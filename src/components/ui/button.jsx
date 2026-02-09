import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-[2px] active:shadow-[inset_0_3px_6px_rgba(0,0,0,0.35)] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:bg-primary/90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-[1px]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_2px_8px_rgba(0,0,0,0.25)] hover:bg-destructive/90 hover:shadow-[0_4px_12px_rgba(0,0,0,0.3)] hover:-translate-y-[1px]",
        outline:
          "border border-input bg-card shadow-[0_1px_4px_rgba(0,0,0,0.2)] hover:bg-secondary hover:text-accent-foreground hover:shadow-[0_3px_8px_rgba(0,0,0,0.25)] hover:-translate-y-[1px]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-[0_2px_6px_rgba(0,0,0,0.2)] hover:bg-secondary/80 hover:shadow-[0_3px_10px_rgba(0,0,0,0.25)] hover:-translate-y-[1px]",
        ghost: "hover:bg-secondary hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }