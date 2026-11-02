import { useEffect, useRef, type ReactNode, type RefObject } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  /** Where focus lands when the dialog opens; set in code because autofocus is unreliable in some browsers. */
  initialFocus: RefObject<HTMLElement | null>;
  /** False while a request is in flight, so the customer can't close the dialog before the result. */
  dismissible?: boolean;
  children: ReactNode;
}

/**
 * A native modal <dialog>: the browser makes the page behind it inert, closes it on Escape and puts
 * focus back on the element that opened it.
 */
export function Dialog({ open, onClose, titleId, initialFocus, dismissible = true, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocus.current?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open, initialFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape: let React's state decide, so the dialog and the state never disagree. A native
        // modal dialog doesn't close on a backdrop click, so Escape is the only built-in way out.
        event.preventDefault();
        if (dismissible) onClose();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-card bg-surface p-6 text-ink backdrop:bg-ink/50"
    >
      {children}
    </dialog>
  );
}
