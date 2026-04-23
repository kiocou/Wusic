import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AnimatePresence, motion } from "framer-motion";
import { initMediaSession } from "./lib/store/mediaSessionSync";
import { useMiniModeStore } from "./hooks/useMiniMode";
import RootLayout from "./layouts/RootLayout";
import { MiniPlayer } from "./components/mini-player";
import { useSettingStore } from "./lib/store/settingStore";
import { corePlayer } from "./lib/player/corePlayer";
import { usePlayerStore } from "./lib/store/playerStore";

// 懒加载所有页面组件 - 减少首屏加载体积
const HomePage = lazy(() => import("./pages/HomePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const AlbumDetailPage = lazy(() => import("./pages/detail/AlbumDetailPage"));
const ArtistDetailPage = lazy(() => import("./pages/detail/ArtistDetailPage"));
const PlaylistDetailPage = lazy(() => import("./pages/detail/PlaylistDetailPage"));
const RecentPage = lazy(() => import("./pages/library/RecentPage"));
const CloudPage = lazy(() => import("./pages/library/CloudPage"));
const DownloadPage = lazy(() => import("./pages/library/DownloadPage"));
const LocalPage = lazy(() => import("./pages/library/LocalPage"));
const SettingPage = lazy(() => import("./pages/SettingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const DailyRecommendPage = lazy(() => import("./pages/recommend/DailyRecommendPage"));

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "search",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: "detail/album",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <AlbumDetailPage />
          </Suspense>
        ),
      },
      {
        path: "detail/artist",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ArtistDetailPage />
          </Suspense>
        ),
      },
      {
        path: "detail/playlist",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <PlaylistDetailPage />
          </Suspense>
        ),
      },
      {
        path: "library/recent",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <RecentPage />
          </Suspense>
        ),
      },
      {
        path: "library/cloud",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <CloudPage />
          </Suspense>
        ),
      },
      {
        path: "library/download",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DownloadPage />
          </Suspense>
        ),
      },
      {
        path: "library/local",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <LocalPage />
          </Suspense>
        ),
      },
      {
        path: "setting",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <SettingPage />
          </Suspense>
        ),
      },
      {
        path: "profile",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: "recommend/daily",
        element: (
          <Suspense fallback={<PageLoadingFallback />}>
            <DailyRecommendPage />
          </Suspense>
        ),
      },
    ],
  },
]);

// 页面加载占位符 - 极简设计，避免重绘
function PageLoadingFallback() {
  return <div className="w-full h-full animate-pulse bg-foreground/5" />;
}

export default function App() {
  const [isBackground, setIsBackground] = useState(false);
  const isMiniMode = useMiniModeStore((s) => s.isMiniMode);

  let mediaSessionInitialized = false;

  useEffect(() => {
    if (!mediaSessionInitialized) {
      initMediaSession();
      mediaSessionInitialized = true;
    }
  }, []);

  // ── 关闭到托盘 / 真正退出 ──────────────────────────────────────
  useEffect(() => {
    const unlistenBg = listen("app-background", async () => {
      const closeToTray = useSettingStore.getState().system.closeToTray;
      if (closeToTray) {
        // 隐藏到托盘（Rust 端已处理 hide，这里让 React 不渲染以省资源）
        setIsBackground(true);
      } else {
        // 用户希望直接退出
        try {
          const { exit } = await import("@tauri-apps/plugin-process");
          await exit(0);
        } catch {
          setIsBackground(true); // 兜底：退出失败时至少隐藏
        }
      }
    });

    const unlistenFg = listen("app-foreground", () => {
      setIsBackground(false);
    });

    return () => {
      unlistenBg.then((f) => f());
      unlistenFg.then((f) => f());
    };
  }, []);

  // ── 淡入淡出：同步设置到 corePlayer ───────────────────────────
  useEffect(() => {
    const sync = () => {
      const { crossfade, crossfadeDuration } =
        useSettingStore.getState().playback;
      corePlayer.setCrossfade(crossfade, crossfadeDuration);
    };

    sync(); // 初始同步
    return useSettingStore.subscribe((state, prev) => {
      if (
        state.playback.crossfade !== prev.playback.crossfade ||
        state.playback.crossfadeDuration !== prev.playback.crossfadeDuration
      ) {
        sync();
      }
    });
  }, []);

  // ── 启动时自动播放 ───────────────────────────────────────────
  useEffect(() => {
    const { autoPlay } = useSettingStore.getState().playback;
    if (!autoPlay) return;

    // 等待 player store hydrate 后自动恢复播放
    const timer = setTimeout(() => {
      const { currentSong, playSong, isFmMode } =
        usePlayerStore.getState();
      if (currentSong) {
        playSong(currentSong, isFmMode);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  if (isBackground) return <div style={{ display: "none" }}></div>;

  return <RouterProvider router={router} />;
}

