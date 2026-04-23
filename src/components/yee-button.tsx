import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useMicroInteraction } from "@/hooks/use-micro-interaction";

interface PlayerBarButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "ghost";
  icon: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

const YeeButtonVariants = cva("cursor-pointer", {
  variants: {
    variant: {
      outline: "rounded-full cursor-pointer border-0 drop-shadow-md bg-card!",
      ghost: "hover:bg-foreground/5 rounded-sm",
    },
  },
});

export const YeeButton = React.forwardRef<
  HTMLButtonElement,
  PlayerBarButtonProps
>(({ variant = "ghost", icon, disabled, className, ...props }, ref) => {
  const micro = useMicroInteraction(disabled);

  return (
    <motion.div
      {...micro}
      className="transform-gpu will-change-transform"
    >
      <Button
        ref={ref}
        variant={variant}
        size="icon"
        className={cn(YeeButtonVariants({ variant }), className)}
        disabled={disabled}
        {...props}
      >
        {icon}
      </Button>
    </motion.div>
  );
});

YeeButton.displayName = "PlayerBarButton";
