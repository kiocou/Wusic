import { ChevronRight24Regular } from "@fluentui/react-icons";
import React, { useEffect, useRef, useState } from "react";
import { MenuRegistrationContext } from "./global-context-menu";
import { cn } from "@/lib/utils";

interface ContextMenuButtonProps {
  id: string;
  content?: string;
  icon?: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  hasSubmenu?: boolean;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function ContextMenuSeperator() {
  return <div className="h-px bg-border my-2" />;
}

export function ContextMenuButton({
  id,
  content,
  icon,
  onClick,
  hasSubmenu,
  children,
  disabled = false,
}: ContextMenuButtonProps) {
  const { activeSubmenuId, setActiveSubmenuId, timeoutRef } = React.useContext(
    MenuRegistrationContext,
  );
  const subMenuRef = useRef<HTMLDivElement>(null);
  const [positionClass, setPositionClass] = useState("left-full pl-2");
  const [topOffset, setTopOffset] = useState("0px");

  const showSubmenu = activeSubmenuId === id;

  const handleMouseEnter = () => {
    if (disabled) return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveSubmenuId(id);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveSubmenuId(null);
    }, 200);
  };

  useEffect(() => {
    if (showSubmenu && subMenuRef.current) {
      const rect = subMenuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newPositionClass = "left-full pl-2";
      let newTopOffset = "0px";

      if (rect.right > viewportWidth) {
        newPositionClass = "right-full pr-2";
      }

      if (rect.bottom > viewportHeight) {
        const diff = rect.bottom - viewportHeight + 8;
        newTopOffset = `-${diff}px`;
      }

      setPositionClass(newPositionClass);
      setTopOffset(newTopOffset);
    } else if (!showSubmenu) {
      setPositionClass("left-full pl-2");
      setTopOffset("0px");
    }
  }, [showSubmenu]);

  return (
    <div
      className={cn(
        "relative flex items-center gap-2 rounded-md p-2 text-sm transition-[background,color,transform] duration-200",
        disabled
          ? "cursor-not-allowed text-muted-foreground/50"
          : "cursor-pointer hover:bg-foreground/8 active:scale-[0.98]",
      )}
      aria-disabled={disabled}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }
        onClick?.(event);
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex size-4 items-center justify-center">{icon}</div>
      <span className="line-clamp-1">{content}</span>
      {hasSubmenu && !disabled && (
        <ChevronRight24Regular className="size-4 ml-auto text-foreground/60" />
      )}

      {hasSubmenu && !disabled && showSubmenu && children && (
        <div
          ref={subMenuRef}
          className={`absolute z-99999 cursor-default ${positionClass}`}
          style={{ top: topOffset }}
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        >
          <IsolatedSubmenu>
            <div className="w-48 bg-[var(--floating-surface)] border border-[var(--floating-surface-border)] rounded-lg shadow-lg flex flex-col p-2 max-h-[300px] overflow-y-auto backdrop-blur-md">
              {children}
            </div>
          </IsolatedSubmenu>
        </div>
      )}
    </div>
  );
}

function IsolatedSubmenu({ children }: { children: React.ReactNode }) {
  const { timeoutRef } = React.useContext(MenuRegistrationContext);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  return (
    <MenuRegistrationContext.Provider
      value={{ activeSubmenuId, setActiveSubmenuId, timeoutRef }}
    >
      {children}
    </MenuRegistrationContext.Provider>
  );
}
