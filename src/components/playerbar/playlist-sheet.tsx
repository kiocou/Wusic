import {
  Delete16Regular,
  Dismiss16Regular,
  TextBulletList16Regular,
} from "@fluentui/react-icons";

import {
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Sheet,
} from "../ui/sheet";
import { usePlayerStore } from "@/lib/store/playerStore";
import { PlaylistSongPreview } from "./playlist-song-preview";
import { useUserStore } from "@/lib/store/userStore";
import { ReactNode, useMemo, useState } from "react";
import { YeeButton } from "../yee-button";
import { Virtuoso } from "react-virtuoso";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function PlaylistSheet({
  children,
  contentClassName,
  container,
  side = "right",
}: {
  children?: ReactNode;
  contentClassName?: string;
  container?: HTMLElement | null;
  side?: "top" | "right" | "bottom" | "left";
}) {
  const playlist = usePlayerStore((s) => s.playlist);
  const currentSong = usePlayerStore((s) => s.currentSong);
  const clearPlaylist = usePlayerStore((s) => s.clearPlaylist);

  const { likeListSet } = useUserStore();
  const [open, setOpen] = useState(false);

  const initialIndex = useMemo(
    () =>
      currentSong ? playlist.findIndex((s) => s.id === currentSong.id) : 0,
    [currentSong, playlist],
  );

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        {children || (
          <YeeButton
            variant="ghost"
            icon={<TextBulletList16Regular className="size-4" />}
            aria-label="打开播放列表"
            title="播放列表"
          />
        )}
      </SheetTrigger>
      <SheetContent
        side={side}
        className={cn(
          "p-2 pr-0 w-full drop-shadow-2xl",
          contentClassName,
        )}
        showCloseButton={false}
        container={container ?? document.getElementById("main-wrapper")}
      >
        <SheetHeader>
          <div className="flex justify-between items-center">
            <SheetTitle>播放列表</SheetTitle>
            <div className="flex gap-2">
              <YeeButton
                variant="ghost"
                onClick={() => {
                  clearPlaylist();
                  setOpen(false);
                }}
                icon={<Delete16Regular />}
                disabled={playlist.length === 0}
                aria-label="清空播放列表"
                title="清空播放列表"
              />
              <YeeButton
                variant="ghost"
                onClick={() => setOpen(false)}
                icon={<Dismiss16Regular />}
                aria-label="关闭播放列表"
                title="关闭"
              />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 w-full -mt-8">
          <AnimatePresence mode="wait">
            {playlist.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="flex h-full min-h-72 flex-col items-center justify-center gap-3 pr-2 text-center text-muted-foreground"
              >
                <TextBulletList16Regular className="size-9 opacity-40" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground/70">播放列表为空</p>
                  <p className="text-xs">双击歌曲或点击播放按钮后会加入这里。</p>
                </div>
              </motion.div>
            ) : (
              <Virtuoso
                data={playlist}
                initialTopMostItemIndex={initialIndex !== -1 ? initialIndex : 0}
                itemContent={(_, song) => (
                  <div className="px-4 py-4">
                    <PlaylistSongPreview
                      song={song}
                      isPlaying={song.id === currentSong?.id}
                      isLike={likeListSet.has(Number(song.id))}
                      setOpen={setOpen}
                    />
                  </div>
                )}
              />
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
