import type { ReactNode } from "react";
import { CheckCircleIcon } from "../ui/icons";

/**
 * A confirmation of what just happened. The live region is always rendered (and takes no space when
 * empty), because some screen readers miss messages added to a region that appears at the same time.
 */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <div role="status">
      {children && (
        <p className="mt-6 flex items-start gap-3 rounded-option border border-brand/30 bg-surface-selected p-4 text-ink">
          <CheckCircleIcon className="mt-0.5 size-5 shrink-0 text-brand" />
          <span>{children}</span>
        </p>
      )}
    </div>
  );
}
