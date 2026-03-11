import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import FavoritePage from "./pages/FavoritePage";
import AlbumDetailPage from "./pages/detail/AlbumDetailPage";
import ArtistDetailPage from "./pages/detail/ArtistDetailPage";
import PlaylistDetailPage from "./pages/detail/PlaylistDetailPage";
import RecentPage from "./pages/library/RecentPage";
import CloudPage from "./pages/library/CloudPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { initMediaSession } from "./lib/store/mediaSessionSync";
import DownloadPage from "./pages/library/DownloadPage";
import LocalPage from "./pages/library/LocalPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "search",
        element: <SearchPage />,
      },
      {
        path: "favorite",
        element: <FavoritePage />,
      },
      {
        path: "detail/album",
        element: <AlbumDetailPage />,
      },
      {
        path: "detail/artist",
        element: <ArtistDetailPage />,
      },
      {
        path: "detail/playlist",
        element: <PlaylistDetailPage />,
      },
      {
        path: "library/recent",
        element: <RecentPage />,
      },
      {
        path: "library/cloud",
        element: <CloudPage />,
      },
      {
        path: "library/download",
        element: <DownloadPage />,
      },
      {
        path: "library/local",
        element: <LocalPage />,
      },
      {
        path: "setting",
        element: <SettingPage />,
      },
      {
        path: "profile",
        element: <ProfilePage />,
      },
    ],
  },
]);

export default function App() {
  const [isBackground, setIsBackground] = useState(false);

  let mediaSessionInitialized = false;

  useEffect(() => {
    if (!mediaSessionInitialized) {
      initMediaSession();
      mediaSessionInitialized = true;
    }
  }, []);

  useEffect(() => {
    const unlistenBg = listen("app-background", () => {
      setIsBackground(true);
    });

    const unlistenFg = listen("app-foreground", () => {
      setIsBackground(false);
    });

    return () => {
      unlistenBg.then((f) => f());
      unlistenFg.then((f) => f());
    };
  }, []);

  if (isBackground) return <div style={{ display: "none" }}></div>;

  return <RouterProvider router={router} />;
}
