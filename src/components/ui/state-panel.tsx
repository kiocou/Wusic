import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { springShared } from "@/styles/animations";

interface StatePanelProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function StatePanel({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: StatePanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={springShared}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 rounded-md border border-[var(--component-border)] bg-[var(--glass-panel)] p-8 text-center text-muted-foreground shadow-[var(--glass-shadow)] backdrop-blur-xl",
        compact ? "min-h-48" : "min-h-80",
        className,
      )}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-foreground/5 text-foreground/45">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground/80">{title}</p>
        {description && (
          <p className="mx-auto max-w-md text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </motion.div>
  );
}
