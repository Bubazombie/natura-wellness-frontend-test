// STATIC PREVIEW for design review: reads the fixture straight from the URL, with no API calls yet.
// Actions only open and close dialogs; the API and local state are wired in the next step.
import { useState } from "react";
import { catalog, fixtures } from "../api/fixtures";
import { CancelFlow } from "./CancelFlow";
import { LoadErrorView } from "./LoadStates";
import { PageHeader } from "./PageHeader";
import { PauseDialog } from "./PauseDialog";
import { SkipDialog } from "./SkipDialog";
import { SubscriptionPage } from "./SubscriptionPage";
import { priceSummary } from "./summary";

const fixtureName = new URLSearchParams(window.location.search).get("fixture") ?? "active";
const subscription = fixtureName in fixtures ? fixtures[fixtureName as keyof typeof fixtures]() : null;

type OpenDialog = "skip" | "pause" | "cancel" | null;

export function SubscriptionCard() {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const close = () => {
    setDialog(null);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
      {subscription ? (
        <>
          <SubscriptionPage
            subscription={subscription}
            onSkip={() => {
              setDialog("skip");
            }}
            onPause={() => {
              setDialog("pause");
            }}
            onCancel={() => {
              setDialog("cancel");
            }}
            onResume={close}
            onRestart={close}
            onFrequencyChange={close}
          />
          {subscription.nextChargeAt && (
            <SkipDialog
              open={dialog === "skip"}
              status="confirm"
              nextChargeAt={subscription.nextChargeAt}
              intervalDays={subscription.intervalDays}
              totalCents={priceSummary(subscription).totalCents}
              onConfirm={close}
              onClose={close}
            />
          )}
          <PauseDialog open={dialog === "pause"} onPause={close} onClose={close} />
          <CancelFlow
            open={dialog === "cancel"}
            subscription={subscription}
            catalog={catalog}
            onClose={close}
            onSkip={close}
            onFrequencyChange={close}
            onQuantityChange={close}
            onSwap={close}
            onPause={close}
            onCancelSubscription={close}
          />
        </>
      ) : (
        <>
          <PageHeader />
          <div className="mt-6">
            <LoadErrorView failure={fixtureName === "error" ? "error" : "not-found"} onRetry={close} />
          </div>
        </>
      )}
    </div>
  );
}
