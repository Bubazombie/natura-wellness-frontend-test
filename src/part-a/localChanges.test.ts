import { describe, expect, it } from "vitest";
import { catalog, fixtures } from "../api/fixtures";
import type { Subscription } from "../api/types";
import { afterSkip, applyChanges, cancelled, paused, reactivated, withFrequency, withQuantity, withSwap } from "./localChanges";

const NOW = new Date("2026-11-02T15:00:00.000Z");
const active = (): Subscription => ({ ...fixtures.active(), nextChargeAt: "2026-11-08T15:00:00.000Z" });
const magnesium = catalog.find((product) => product.sku === "NW-MAG-90");
if (!magnesium) throw new Error("catalog changed");

describe("applyChanges", () => {
  it("shows the server's data unchanged when there are no local changes", () => {
    const server = active();
    expect(applyChanges(server, {})).toEqual(server);
  });

  it("keeps local changes on top of new server data, such as after a skip or a refetch", () => {
    const changes = withFrequency({}, 60);
    const refetched = { ...active(), nextChargeAt: "2026-12-08T15:00:00.000Z", updatedAt: "2026-11-02T16:00:00.000Z" };

    expect(applyChanges(refetched, changes)).toMatchObject({ intervalDays: 60, nextChargeAt: "2026-12-08T15:00:00.000Z" });
  });

  it("recomputes the total when the items change, the same way the server does", () => {
    const server = active();
    const shown = applyChanges(server, withQuantity({}, server, "NW-MULTI-30", 1));

    // 1 x $29.95 + 1 x $44.95 = $74.90, $63.67 after 15%.
    expect(shown.nextChargeTotalCents).toBe(6367);
  });

  it("clears the dates that don't belong to the current status", () => {
    const shown = applyChanges(active(), paused({}, 1, NOW));

    expect(shown).toMatchObject({ status: "paused", nextChargeAt: null, nextChargeTotalCents: null, cancelledAt: null });
  });
});

describe("transitions", () => {
  it("changing frequency keeps the next delivery's date", () => {
    expect(applyChanges(active(), withFrequency({}, 90))).toMatchObject({ intervalDays: 90, nextChargeAt: "2026-11-08T15:00:00.000Z" });
  });

  it("a swap puts the new product in the replaced one's place, with its quantity", () => {
    const server = active();
    const items = applyChanges(server, withSwap({}, server, "NW-MULTI-30", magnesium)).items;

    expect(items.map((item) => `${item.sku} x${String(item.quantity)}`)).toEqual(["NW-VITD-60 x1", "NW-MAG-90 x2"]);
  });

  it("pausing resumes the chosen number of months from today", () => {
    expect(applyChanges(active(), paused({}, 2, NOW))).toMatchObject({ status: "paused", pausedUntil: "2027-01-02T15:00:00.000Z" });
  });

  it("resuming or restarting delivers tomorrow", () => {
    const shown = applyChanges(fixtures.paused(), reactivated({}, NOW));

    expect(shown).toMatchObject({ status: "active", nextChargeAt: "2026-11-03T15:00:00.000Z", pausedUntil: null });
    expect(shown.nextChargeTotalCents).toBe(10187);
  });

  it("cancelling records today as the cancellation date", () => {
    expect(applyChanges(active(), cancelled({}, NOW))).toMatchObject({ status: "cancelled", cancelledAt: NOW.toISOString(), nextChargeAt: null });
  });
});

describe("afterSkip", () => {
  it("leaves the date to the server when nothing local affects it", () => {
    const server = active();
    expect(afterSkip({}, applyChanges(server, {}), server, false)).toEqual({});
  });

  it("uses the customer's frequency when it differs from the server's", () => {
    const server = active();
    const changes = withFrequency({}, 60);

    expect(afterSkip(changes, applyChanges(server, changes), server, false).nextChargeAt).toBe("2027-01-07T15:00:00.000Z");
  });

  it("moves a simulated skip by the current frequency", () => {
    const server = fixtures.paused();
    const changes = reactivated({}, NOW);

    expect(afterSkip(changes, applyChanges(server, changes), server, true).nextChargeAt).toBe("2026-12-03T15:00:00.000Z");
  });
});
