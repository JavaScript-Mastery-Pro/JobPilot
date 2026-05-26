import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-xl border border-default bg-subtle px-3 py-1 text-base text-text-primary transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary placeholder:text-text-muted focus-visible:border-accent-border focus-visible:ring-1 focus-visible:ring-accent-border disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-state-error aria-invalid:ring-1 aria-invalid:ring-state-error/20 md:text-sm",
        className
      )}
      {...props}
    />
  )
}

export { Input }
