import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import React, { useEffect, useRef, useState } from "react";
import { SongActions } from "./actions/song-actions";
import { AlbumActions } from "./actions/album-actions";
import { PlaylistActions } from "./actions/playlist-actions";
import { AnimatePresence, motion } from "framer-motion";

export const MenuRegistrationContext = React.createContext<{
  activeSubmenuId: string | null;
  setActiveSubmenuId: (id: string | null) => void;
  timeoutRef: React.MutableRefObject<NodeJS.Timeout | null>;
}>({
  activeSubmenuId: null,
  setActiveSubmenuId: () => {},
  timeoutRef: { current: null },
});

export function GlobalContextMenu() {
  const { isOpen, x, y, type, data, closeMenu } = useContextMenuStore();
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [activeSubmenuId, setActiveSubmenuId] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeMenu]);

  useEffect(() => {
    if (!isOpen) {
      setIsPositioned(false);
      return;
    }

    const frame = requestAnimationFrame(() => {
      if (!menuRef.current) return;
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const left =
        x + menuWidth > windowWidth ? x - menuWidth - 8 : x;
      const top =
        y + menuHeight > windowHeight ? y - menuHeight - 8 : y;

      setPosition({
        left: Math.max(8, left),
        top: Math.max(8, top),
      });
      setIsPositioned(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, x, y]);

  useEffect(() => {
    if (!isOpen) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setActiveSubmenuId(null);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          id="global-context-menu"
          className="fixed z-9999 flex w-48 origin-top-left flex-col rounded-lg border border-[var(--floating-surface-border)] bg-[var(--floating-surface)] p-2 shadow-[var(--floating-surface-shadow)] backdrop-blur-md"
          style={{
            top: position.top,
            left: position.left,
            visibility: isPositioned ? "visible" : "hidden",
          }}
          initial={{ opacity: 0, scale: 0.96, y: -4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -4 }}
          transition={{ duration: 0.14, ease: [0.32, 0.72, 0, 1] }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <MenuRegistrationContext.Provider
            value={{ activeSubmenuId, setActiveSubmenuId, timeoutRef }}
          >
            <SongActions type={type ?? ""} data={data} />
            <AlbumActions type={type ?? ""} data={data} />
            <PlaylistActions type={type ?? ""} data={data} />
          </MenuRegistrationContext.Provider>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
