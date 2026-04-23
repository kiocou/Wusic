import { usePlayerStore } from "@/lib/store/playerStore";
import { useState, lazy, Suspense, cloneElement, isValidElement, useEffect } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { LyricSheetTitlebar } from "./lyric-sheetr-titlebar";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { springShared } from "@/styles/animations";
import { createPortal } from "react-dom";

// 懒加载 PlayerPage - 它包含大量动画组件
const PlayerPage = lazy(() => import("@/pages/PlayerPage"));

export function LyricSheet({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [mounted, setMounted] = useState(false);
  const togglePlay = usePlayerStore((s) => s.togglePlay);

  useEffect(() => {
    setMounted(true);
  }, []);

  useHotkeys(
    "space",
    (e) => {
      e.preventDefault();
      togglePlay();
    },
    { enableOnFormTags: false },
    [togglePlay],
  );

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (info.offset.y > 140 || info.velocity.y > 900) {
      setIsOpen(false);
    }
  }

  const handleOpen = (e: any) => {
    setHasOpened(true);
    setIsOpen(true);
    if (isValidElement(children) && children.props.onClick) {
      children.props.onClick(e);
    }
  };

  const trigger = isValidElement(children) ? (
    cloneElement(children as any, { onClick: handleOpen })
  ) : (
    <div onClick={handleOpen}>{children}</div>
  );

  if (!mounted) return trigger;

  return (
    <>
      {trigger}
      {createPortal(
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: isOpen ? "0%" : "100%" }}
          transition={{ type: "spring", stiffness: 350, damping: 40, mass: 0.8 }}
          className="fixed inset-0 z-50 overflow-hidden transform-gpu will-change-transform animate-gpu"
          style={{ 
            pointerEvents: isOpen ? "auto" : "none",
            backfaceVisibility: "hidden",
            perspective: "1000px"
          }}
        >
          <motion.div
            drag="y"
            dragDirectionLock
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.32 }}
            onDragEnd={handleDragEnd}
            className="relative h-full w-full overflow-hidden bg-transparent"
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest(
                  "button, input, textarea, select, [role='button'], [role='slider'], [data-allow-pointer]",
                )
              ) {
                return;
              }
              e.preventDefault();
            }}
          >
            {hasOpened && (
              <Suspense fallback={<PlayerPageLoadingFallback />}>
                <PlayerPage />
              </Suspense>
            )}
            <div className="absolute left-0 right-0 top-0 z-40 transform-gpu will-change-transform">
              <LyricSheetTitlebar setIsOpen={setIsOpen} />
            </div>
          </motion.div>
        </motion.div>,
        document.body,
      )}
    </>
  );
}

// PlayerPage 加载占位符
function PlayerPageLoadingFallback() {
  return (
    <div className="relative h-full min-h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#090909] text-white flex items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-white/10 animate-pulse" />
    </div>
  );
}
