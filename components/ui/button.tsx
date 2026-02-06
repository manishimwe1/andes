import * as React from "react"
import { cn } from "@/lib/utils"

function Button({ className, children, ...props }: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { Button }
