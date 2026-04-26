import { cn } from "@/lib/utils";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { createPortal } from "react-dom";

const PopoverContext = createContext<{
  closePopover: () => void;
} | null>(null);

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

interface Rect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export function Popover({ trigger, children, className }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<Rect | null>(null);

  // 计算 trigger 相对于视口的位置，供 Portal 定位使用
  const calcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    calcPosition();

    // 滚动或窗口变化时重新计算
    window.addEventListener("scroll", calcPosition, true);
    window.addEventListener("resize", calcPosition);
    return () => {
      window.removeEventListener("scroll", calcPosition, true);
      window.removeEventListener("resize", calcPosition);
    };
  }, [isOpen, calcPosition]);

  // 点击外部关闭
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) return;
      setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // 计算弹出位置（防止超出视口）
  const getPopoverStyle = (): React.CSSProperties => {
    if (!rect) return { visibility: "hidden" };

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const estimatedHeight = 300; // 估算弹出框高度，用于判断是否向上弹出

    // 默认向下展开
    let top = rect.bottom + 8;
    let left = rect.left;

    // 如果下方空间不足，改为向上展开
    if (top + estimatedHeight > vh) {
      top = rect.top - estimatedHeight - 8;
    }

    // 如果右侧超出视口，向左对齐
    if (left + rect.width > vw) {
      left = rect.right - rect.width;
    }

    return {
      position: "fixed",
      top: Math.max(8, top),
      left: Math.max(8, left),
      minWidth: rect.width,
      zIndex: 99999,
    };
  };

  return (
    <PopoverContext.Provider value={{ closePopover: () => setIsOpen(false) }}>
      <div className="relative inline-block" ref={triggerRef}>
        <div onClick={() => setIsOpen((o) => !o)} className="inline-block">
          {trigger}
        </div>
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={contentRef}
            style={getPopoverStyle()}
            className={cn(
              "flex flex-col gap-1 p-2",
              "bg-[var(--floating-surface)] backdrop-blur-md rounded-md border border-[var(--floating-surface-border)] shadow-2xl",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              className,
            )}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {children}
          </div>,
          document.body,
        )}
    </PopoverContext.Provider>
  );
}

interface PopoverItemProps {
  isActive?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

export function PopoverItem({
  isActive = false,
  onClick,
  children,
}: PopoverItemProps) {
  const context = useContext(PopoverContext);

  const handleClick = () => {
    onClick?.();
    context?.closePopover();
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "w-full px-4 py-2 rounded-sm text-sm cursor-pointer hover:bg-foreground/8 relative transition-colors",
        isActive && "bg-foreground/5 text-primary font-medium",
      )}
    >
      {children}
      {isActive && (
        <div className="absolute w-1 h-1/2 bg-primary rounded-full left-0 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
}

