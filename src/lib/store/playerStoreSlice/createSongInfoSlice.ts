import { StateCreator } from "zustand";
import { SharedPlayerState, SongInfoSlice } from "@/lib/types/player";
import { QUALITY_BY_KEY, QualityKey } from "@/lib/constants/song";
import { getSongUrl } from "@/lib/services/song";
import { corePlayer } from "@/lib/player/corePlayer";

function getSafeProgress(currentTime: number, duration: number) {
  if (!Number.isFinite(currentTime) || !Number.isFinite(duration) || duration <= 0) {
    return 0;
  }

  return Math.min(Math.max((currentTime / duration) * 100, 0), 100);
}

export const createSongInfoSlice: StateCreator<
  SharedPlayerState,
  [],
  [],
  SongInfoSlice
> = (set, get) => ({
  currentSong: null,
  currentSongMusicDetail: [],
  currentSongLyrics: null,
  currentMusicLevelKey: "sq",

  setCurrentMusicLevelKey: async (key: QualityKey) => {
    const { currentSong, currentMusicLevelKey, currentTime } = get();

    if (!currentSong || key === currentMusicLevelKey) {
      set({ currentMusicLevelKey: key });
      return;
    }

    set({ currentMusicLevelKey: key, isLoadingMusic: true });

    try {
      const res = await getSongUrl(
        [currentSong.id.toString()],
        QUALITY_BY_KEY[key].level,
      );

      if (res?.[0]?.url) {
        corePlayer.play(res[0].url, {
          onEnd: () => get().next(),
          onPlay: (duration) => {
            set({ isPlaying: true, duration, isLoadingMusic: false });
            if (duration > 0) {
              get().seek((currentTime / duration) * 100);
            }
          },
          onProgress: (currentTime) => {
            const { duration } = get();
            set({ currentTime, progress: getSafeProgress(currentTime, duration) });
          },
          onLoadError: (error) => {
            console.error("切换音质后加载失败", error);
            set({ isPlaying: false, isLoadingMusic: false });
          },
          onPlayError: (error) => {
            console.error("切换音质后播放失败", error);
            set({ isPlaying: false, isLoadingMusic: false });
          },
        });
      } else {
        set({ isLoadingMusic: false });
      }
    } catch (err) {
      console.log("切换音质失败", err);
      set({ isLoadingMusic: false });
    }
  },
});
