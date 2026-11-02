import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { catalog } from "../api/fixtures";
import { ApiError, type Subscription } from "../api/types";
import { CancelFlow } from "./CancelFlow";
import { applyChanges, cancelled, paused, reactivated, withFrequency, withQuantity, withSwap, afterSkip, type LocalChanges } from "./localChanges";
import { LoadErrorView, LoadingView } from "./LoadStates";
import { frequencyNotice, quantityNotice, skippedNotice, statusAnnouncement, swapNotice } from "./notices";
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
          return result.isSuccess;
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
  refetch: () => Promise<boolean>;
}

function SubscriptionManager({ server, refetch }: SubscriptionManagerProps) {
  const [changes, setChanges] = useState<LocalChanges>({});
  const [dialog, setDialog] = useState<"pause" | "cancel" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [focusKey, setFocusKey] = useState(0);
  const summaryHeadingRef = useRef<HTMLHeadingElement>(null);
  const shown = applyChanges(server, changes);

  // After a status change the button that was used (Pause, Resume, Cancel) is gone, and closing a
  // dialog would send focus back to that missing button. This effect runs after the dialogs' own
  // effects (a parent's effects run after its children's), so focus lands on the new card's heading.
  useEffect(() => {
    if (focusKey > 0) summaryHeadingRef.current?.focus();
  }, [focusKey]);

  /** Skip, frequency, quantity, swap: confirmed with a visible notice. */
  const changeSetting = (next: LocalChanges, message: (after: Subscription) => string) => {
    setChanges(next);
    setDialog(null);
    setAnnouncement("");
    setNotice(message(applyChanges(server, next)));
  };

  /** Pause, resume, restart, cancel: the summary card changes and gets focus, and it is announced. */
  const changeStatus = (next: LocalChanges) => {
    setChanges(next);
    setDialog(null);
    setNotice(null);
    setAnnouncement(statusAnnouncement(applyChanges(server, next)));
    setFocusKey((key) => key + 1);
  };

  const skip = useSkipFlow({
    server,
    refetch,
    onSkipped: (updated, simulated) => {
      const next = afterSkip(changes, shown, server, simulated);
      setChanges(next);
      setAnnouncement("");
      setNotice(shown.nextChargeAt ? skippedNotice(shown.nextChargeAt, applyChanges(updated, next)) : null);
    },
  });

  return (
    <>
      <SubscriptionPage
        subscription={shown}
        notice={notice}
        announcement={announcement}
        summaryHeadingRef={summaryHeadingRef}
        onSkip={skip.start}
        onResume={() => {
          changeStatus(reactivated(changes, new Date()));
        }}
        onRestart={() => {
          changeStatus(reactivated(changes, new Date()));
        }}
        onFrequencyChange={(days) => {
          changeSetting(withFrequency(changes, days), frequencyNotice);
        }}
        onPause={() => {
          setDialog("pause");
        }}
        onCancel={() => {
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
        open={dialog === "cancel"}
        subscription={shown}
        catalog={catalog}
        onClose={() => {
          setDialog(null);
        }}
        onSkip={() => {
          setDialog(null);
          skip.startConfirmed();
        }}
        onFrequencyChange={(days) => {
          changeSetting(withFrequency(changes, days), frequencyNotice);
        }}
        onQuantityChange={(sku, quantity) => {
          changeSetting(withQuantity(changes, shown, sku, quantity), (after) => {
            const item = after.items.find((i) => i.sku === sku);
            return item ? quantityNotice(item, after) : "";
          });
        }}
        onSwap={(fromSku, to) => {
          const from = shown.items.find((item) => item.sku === fromSku);
          changeSetting(withSwap(changes, shown, fromSku, to), () => (from ? swapNotice(from, to) : ""));
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
