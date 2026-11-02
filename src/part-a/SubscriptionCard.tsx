import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { catalog } from "../api/fixtures";
import { ApiError, type Subscription } from "../api/types";
import { CancelFlow } from "./CancelFlow";
import { afterSkip, applyChanges, cancelled, paused, reactivated, withFrequency, withQuantity, withSwap, type LocalChanges } from "./localChanges";
import { LoadErrorView, LoadingView } from "./LoadStates";
import { frequencyNotice, nothingToSkipNotice, quantityNotice, skippedNotice, statusAnnouncement, swapNotice } from "./notices";
import { PageHeader } from "./PageHeader";
import { PauseDialog } from "./PauseDialog";
import { SkipDialog } from "./SkipDialog";
import { SubscriptionPage } from "./SubscriptionPage";
import { priceSummary } from "./summary";
import { useSkipFlow } from "./useSkipFlow";
import { createQueryClient, useSubscriptionQuery } from "./useSubscription";

/** Part A: the "Manage my subscription" page. */
export function SubscriptionCard() {
  const [queryClient] = useState(createQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
        <SubscriptionLoader />
      </div>
    </QueryClientProvider>
  );
}

function WithHeader({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader />
      <div className="mt-6">{children}</div>
    </>
  );
}

function SubscriptionLoader() {
  const query = useSubscriptionQuery();

  // Once loaded, the page stays on screen even if a later refetch fails.
  if (query.data) {
    return (
      <SubscriptionManager
        server={query.data}
        refetch={async () => {
          const result = await query.refetch();
          return result.isSuccess ? result.data : null;
        }}
      />
    );
  }
  if (query.isError && !query.isFetching) {
    const notFound = query.error instanceof ApiError && query.error.status === 404;
    return (
      <WithHeader>
        <LoadErrorView
          failure={notFound ? "not-found" : "error"}
          onRetry={() => {
            void query.refetch();
          }}
        />
      </WithHeader>
    );
  }
  return (
    <WithHeader>
      <LoadingView />
    </WithHeader>
  );
}

interface SubscriptionManagerProps {
  server: Subscription;
  refetch: () => Promise<Subscription | null>;
}

/** Where focus goes after a change; the counter makes the same target fire again. */
interface FocusRequest {
  target: "summary" | "notice";
  count: number;
}

function SubscriptionManager({ server, refetch }: SubscriptionManagerProps) {
  const [changes, setChanges] = useState<LocalChanges>({});
  const [dialog, setDialog] = useState<"pause" | "cancel" | null>(null);
  // A new key each time the cancel flow opens, so it always starts at its first step.
  const [cancelFlowKey, setCancelFlowKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [frequencyConfirmation, setFrequencyConfirmation] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focus, setFocus] = useState<FocusRequest | null>(null);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);
  const shown = applyChanges(server, changes);

  // After a change made in a dialog, the confirmation can be far from where focus would return (on a
  // phone, the notice is off-screen above the button that opened the dialog), and after a status
  // change that button is gone. So focus moves to the confirmation itself. This effect runs after the
  // dialogs' own effects (a parent's effects run after its children's), so it wins over their focus return.
  useEffect(() => {
    if (!focus) return;
    const element = (focus.target === "summary" ? summaryHeadingRef : noticeRef).current;
    element?.focus();
    // WebKit moves focus here but doesn't scroll to it, which leaves a phone's confirmation off-screen.
    element?.scrollIntoView({ block: "nearest" });
  }, [focus]);

  const requestFocus = (target: FocusRequest["target"]) => {
    setFocus((previous) => ({ target, count: (previous?.count ?? 0) + 1 }));
  };

  /** Skip, frequency, quantity, swap: confirmed with a visible message. */
  const changeSetting = (next: LocalChanges, message: string, where: "notice" | "frequency") => {
    setChanges(next);
    setDialog(null);
    setAnnouncement("");
    if (where === "frequency") {
      // Changed with the select on the page: confirm right under it, and leave focus there.
      setNotice(null);
      setFrequencyConfirmation(message);
    } else {
      setFrequencyConfirmation(null);
      setNotice(message);
      requestFocus("notice");
    }
  };

  /** Pause, resume, restart, cancel: the summary card changes and gets focus, and it is announced. */
  const changeStatus = (next: LocalChanges) => {
    setChanges(next);
    setDialog(null);
    setNotice(null);
    setFrequencyConfirmation(null);
    setAnnouncement(statusAnnouncement(applyChanges(server, next)));
    requestFocus("summary");
  };

  // Where the skip started: from the page (focus returns to its Skip button, next to the notice) or
  // from the cancel flow's offer (the opening button is at the bottom, so focus goes to the notice).
  const skipFromOffer = useRef(false);
  const skip = useSkipFlow({
    server,
    refetch,
    canSkip: (latest) => applyChanges(latest, changes).nextChargeAt !== null,
    onSkipped: (updated, simulated) => {
      const next = afterSkip(changes, shown, server, simulated);
      setChanges(next);
      setAnnouncement("");
      setFrequencyConfirmation(null);
      setNotice(shown.nextChargeAt ? skippedNotice(shown.nextChargeAt, applyChanges(updated, next)) : null);
      if (skipFromOffer.current) requestFocus("notice");
    },
    onNothingToSkip: (latest) => {
      setFrequencyConfirmation(null);
      setNotice(nothingToSkipNotice(applyChanges(latest, changes)));
      requestFocus("notice");
    },
  });

  const settingFromDialog = (next: LocalChanges, message: (after: Subscription) => string) => {
    changeSetting(next, message(applyChanges(server, next)), "notice");
  };

  return (
    <>
      <SubscriptionPage
        subscription={shown}
        notice={notice}
        noticeRef={noticeRef}
        frequencyConfirmation={frequencyConfirmation}
        announcement={announcement}
        summaryHeadingRef={summaryHeadingRef}
        onSkip={() => {
          skipFromOffer.current = false;
          skip.start();
        }}
        onResume={() => {
          changeStatus(reactivated(changes, new Date()));
        }}
        onRestart={() => {
          changeStatus(reactivated(changes, new Date()));
        }}
        onFrequencyChange={(days) => {
          const next = withFrequency(changes, days);
          changeSetting(next, frequencyNotice(applyChanges(server, next)), "frequency");
        }}
        onPause={() => {
          setDialog("pause");
        }}
        onCancel={() => {
          setCancelFlowKey((key) => key + 1);
          setDialog("cancel");
        }}
      />
      <PauseDialog
        open={dialog === "pause"}
        onPause={(months) => {
          changeStatus(paused(changes, months, new Date()));
        }}
        onClose={() => {
          setDialog(null);
        }}
      />
      <CancelFlow
        key={cancelFlowKey}
        open={dialog === "cancel"}
        subscription={shown}
        catalog={catalog}
        onClose={() => {
          setDialog(null);
        }}
        onSkip={() => {
          setDialog(null);
          skipFromOffer.current = true;
          skip.startConfirmed();
        }}
        onFrequencyChange={(days) => {
          settingFromDialog(withFrequency(changes, days), frequencyNotice);
        }}
        onQuantityChange={(sku, quantity) => {
          settingFromDialog(withQuantity(changes, shown, sku, quantity), (after) => {
            const item = after.items.find((i) => i.sku === sku);
            return item ? quantityNotice(item, after) : "";
          });
        }}
        onSwap={(fromSku, to) => {
          const from = shown.items.find((item) => item.sku === fromSku);
          settingFromDialog(withSwap(changes, shown, fromSku, to), () => (from ? swapNotice(from, to) : ""));
        }}
        onPause={(months) => {
          changeStatus(paused(changes, months, new Date()));
        }}
        onCancelSubscription={() => {
          changeStatus(cancelled(changes, new Date()));
        }}
      />
      {/* After the cancel flow, so it opens after that dialog closes when the flow hands over a skip. */}
      {shown.nextChargeAt && (
        <SkipDialog
          open={skip.open}
          status={skip.status}
          nextChargeAt={shown.nextChargeAt}
          intervalDays={shown.intervalDays}
          totalCents={priceSummary(shown).totalCents}
          onConfirm={skip.confirm}
          onClose={skip.close}
        />
      )}
    </>
  );
}
