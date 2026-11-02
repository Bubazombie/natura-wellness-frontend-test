import { useRef, useState } from "react";
import { ApiError, type Subscription } from "../api/types";
import type { SkipStatus } from "./SkipDialog";
import { useSkipMutation } from "./useSubscription";

/** From the second conflict in a row, the dialog also offers support. */
const REPEATED_CONFLICT = 2;

interface SkipFlowOptions {
  /** The server's subscription, which the API call must be based on. */
  server: Subscription;
  /** Fetches the latest subscription after a conflict; resolves to whether it worked. */
  refetch: () => Promise<boolean>;
  /** Called once the skip is done. `simulated` when the server's own status isn't active. */
  onSkipped: (updated: Subscription, simulated: boolean) => void;
}

export interface SkipFlow {
  open: boolean;
  status: SkipStatus;
  start: () => void;
  /** For a skip the customer already chose explicitly (the cancel flow's offer): no second question. */
  startConfirmed: () => void;
  confirm: () => void;
  close: () => void;
}

export function useSkipFlow({ server, refetch, onSkipped }: SkipFlowOptions): SkipFlow {
  const mutation = useSkipMutation();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<SkipStatus>("confirm");
  const conflicts = useRef(0);

  const finish = (updated: Subscription, simulated: boolean) => {
    setOpen(false);
    onSkipped(updated, simulated);
  };

  // Changed elsewhere: show the latest details and ask again, rather than retrying blindly. The
  // dialog stays pending until the latest details are in.
  const showLatestAndAskAgain = async () => {
    const refreshed = await refetch().catch(() => false);
    conflicts.current += 1;
    setStatus(!refreshed ? "error" : conflicts.current >= REPEATED_CONFLICT ? "repeated-conflict" : "conflict");
  };

  const confirm = () => {
    // A subscription resumed or restarted here is still paused or cancelled on the server, which
    // would reject the skip, so the skip is simulated too.
    if (server.status !== "active") {
      finish(server, true);
      return;
    }
    setStatus("pending");
    mutation.mutate(server, {
      onSuccess: (updated) => {
        finish(updated, false);
      },
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void showLatestAndAskAgain();
        } else {
          setStatus("error");
        }
      },
    });
  };

  const start = () => {
    conflicts.current = 0;
    setStatus("confirm");
    setOpen(true);
  };

  return {
    open,
    status,
    start,
    startConfirmed: () => {
      start();
      confirm();
    },
    confirm,
    close: () => {
      if (status !== "pending") setOpen(false);
    },
  };
}
