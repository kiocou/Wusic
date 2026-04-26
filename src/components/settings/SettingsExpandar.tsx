import { cn } from "@/lib/utils";
import { ChevronDown24Regular } from "@fluentui/react-icons";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { motion } from "framer-motion";

interface SettingsExpandarProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
}

export default function SettingsExpandar({
  title,
  subtitle,
  children,
  className,
  icon,
  trailing,
}: SettingsExpandarProps) {
  const [showDetail, setShowDetail] = useState(false);

  const hasDetail = children ? true : false;
  const toggleDetail = () => {
    if (!hasDetail) return;
    setShowDetail((show) => !show);
  };

  return (
    <div className="flex flex-col w-full gap-0">
      <div
        className={cn(
          "flex flex-col gap-2 w-full bg-[var(--control-surface)] border border-[var(--floating-surface-border)] rounded-sm p-4 backdrop-blur-md transition-[background,border-color,transform] duration-200",
          showDetail && "rounded-b-none",
          hasDetail && "cursor-pointer hover:bg-[var(--floating-surface)] active:scale-[0.995]",
          className,
        )}
        role={hasDetail ? "button" : undefined}
        tabIndex={hasDetail ? 0 : undefined}
        aria-expanded={hasDetail ? showDetail : undefined}
        onClick={toggleDetail}
        onKeyDown={(event) => {
          if (!hasDetail) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleDetail();
          }
        }}
      >
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="size-8">{icon}</div>
            <div className="flex flex-col">
              <h2 className="text-md font-semibold">{title}</h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex gap-2 items-center">
            {trailing && (
              <div onClick={(event) => event.stopPropagation()}>{trailing}</div>
            )}
            {hasDetail && (
              <motion.div
                animate={{ rotate: showDetail ? 180 : 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex items-center justify-center"
              >
                <ChevronDown24Regular className="size-4" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {showDetail && (
          <motion.div
            initial={{ height: 0, opacity: 0, overflow: "hidden" }}
            animate={{
              height: "auto",
              opacity: 1,
              transitionEnd: { overflow: "visible" },
            }}
            exit={{ height: 0, opacity: 0, overflow: "hidden" }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface SettingsExpandarDetailProps {
  desc?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}

export function SettingsExpandarDetail({
  desc,
  trailing,
  children,
}: SettingsExpandarDetailProps) {
  return (
    <div className="w-full bg-[var(--control-surface)] border border-[var(--floating-surface-border)] border-t-0 p-4 flex items-center justify-between last:rounded-b-sm">
      <div className="text-sm text-card-foreground">{desc}</div>
      {trailing}
      {children}
    </div>
  );
}
