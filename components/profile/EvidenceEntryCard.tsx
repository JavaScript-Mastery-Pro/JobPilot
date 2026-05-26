"use client";

import { ChevronDown, Trash2 } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  meta: string;
  isExpanded: boolean;
  canRemove: boolean;
  onToggle: () => void;
  onRemove: () => void;
  children: ReactNode;
};

export function EvidenceEntryCard({
  title,
  meta,
  isExpanded,
  canRemove,
  onToggle,
  onRemove,
  children,
}: Props) {
  return (
    <div className="rounded-2xl border border-default bg-elevated shadow-card">
      <div className="flex items-start justify-between gap-3 px-4 py-4">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-start gap-3 text-left"
          aria-expanded={isExpanded}
        >
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-text-primary">
              {title}
            </span>
            {meta ? (
              <span className="mt-1 block truncate text-xs text-text-muted">
                {meta}
              </span>
            ) : null}
          </span>
          <ChevronDown
            className={`mt-0.5 h-4 w-4 shrink-0 text-text-muted transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>

        {canRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-text-muted transition-colors hover:bg-subtle hover:text-state-error"
            aria-label={`Remove ${title}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {isExpanded ? (
        <div className="grid gap-4 border-t border-default px-4 pb-4 pt-4">
          {children}
        </div>
      ) : null}
    </div>
  );
}
