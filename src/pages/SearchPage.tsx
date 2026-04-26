/**
 * 搜索页面组件
 * 提供歌曲、歌单、歌手、专辑的搜索功能
 * 支持安全的增量加载和错误处理
 */
import { SongList } from "@/components/song/song-list";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSearchResult, type SearchParams } from "@/lib/services/search";
import { useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useRef, useState } from "react";
import { Song, Album, Artist, Playlist } from "@/lib/types";
import { Loading } from "@/components/loading";
import { AlbumList } from "@/components/album/album-list";
import { ArtistList } from "@/components/artist/artist-list";
import { cn } from "@/lib/utils";
import { PlaylistList } from "@/components/playlist/playlist-list";
import { BlurLayer } from "@/components/blur-layer";
import { StatePanel } from "@/components/ui/state-panel";
import { Button } from "@/components/ui/button";
import { Search24Regular } from "@fluentui/react-icons";

interface SearchData {
  songs: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}

type SearchResult = {
  songs?: Song[];
  songCount?: number;
  albums?: Album[];
  albumCount?: number;
  artists?: Artist[];
  artistCount?: number;
  playlists?: Playlist[];
  playlistCount?: number;
};

const LIMIT = 30;

const EMPTY_DATA: SearchData = {
  songs: [],
  albums: [],
  artists: [],
  playlists: [],
};

function SearchContent() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const [tabValue, setTabValue] = useState("1");
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  const loadMoreRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const type = Number(tabValue) as SearchParams["type"];

  const currentLength =
    {
      "1": data.songs.length,
      "10": data.albums.length,
      "100": data.artists.length,
      "1000": data.playlists.length,
    }[tabValue] ?? 0;

  // query / tab 变化时，先重置
  useEffect(() => {
    setData(EMPTY_DATA);
    setOffset(0);
    setHasMore(true);
    setError("");
    abortRef.current?.abort();
  }, [query, tabValue]);

  useEffect(() => {
    if (!query) {
      setData(EMPTY_DATA);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const res: SearchResult = await getSearchResult(
          {
            keywords: query,
            type,
            limit: LIMIT,
            offset,
          },
          { signal: controller.signal },
        );

        // 安全检查：确保返回的数据结构正确
        if (!res) {
          setHasMore(false);
          return;
        }

        switch (type) {
          case 1: {
            const songs = res.songs ?? [];
            const total = res.songCount ?? 0;

            setData((prev) => ({
              ...prev,
              songs: offset === 0 ? songs : [...prev.songs, ...songs],
            }));

            setHasMore(offset + songs.length < total);
            break;
          }

          case 10: {
            const albums = res.albums ?? [];
            const total = res.albumCount ?? 0;

            setData((prev) => ({
              ...prev,
              albums: offset === 0 ? albums : [...prev.albums, ...albums],
            }));

            setHasMore(offset + albums.length < total);
            break;
          }

          case 100: {
            const artists = res.artists ?? [];
            const total = res.artistCount ?? 0;

            setData((prev) => ({
              ...prev,
              artists: offset === 0 ? artists : [...prev.artists, ...artists],
            }));

            setHasMore(offset + artists.length < total);
            break;
          }

          case 1000: {
            const playlists = res.playlists ?? [];
            const total = res.playlistCount ?? 0;

            setData((prev) => ({
              ...prev,
              playlists:
                offset === 0 ? playlists : [...prev.playlists, ...playlists],
            }));

            setHasMore(offset + playlists.length < total);
            break;
          }

          default:
            setHasMore(false);
        }
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("搜索数据获取失败:", err);
        setError("搜索失败，请检查网络后重试。");
        setHasMore(false);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchData();

    return () => {
      controller.abort();
    };
  }, [query, type, offset, reloadToken]);

  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting && hasMore && !loading) {
          setOffset((prev) => prev + LIMIT);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loading]);

  const renderContent = () => {
    if (!query) {
      return (
        <StatePanel
          icon={<Search24Regular className="size-6" />}
          title="输入关键词开始搜索"
          description="可以搜索单曲、歌单、歌手和专辑，结果会自动按当前标签分类展示。"
        />
      );
    }

    if (error && !loading) {
      return (
        <StatePanel
          icon={<Search24Regular className="size-6" />}
          title="搜索出错"
          description={error}
          action={
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                setHasMore(true);
                setReloadToken((value) => value + 1);
              }}
            >
              重试
            </Button>
          }
        />
      );
    }

    if (!loading && currentLength === 0 && !hasMore) {
      return (
        <StatePanel
          icon={<Search24Regular className="size-6" />}
          title="没有找到匹配结果"
          description={`换个关键词或切换到其他分类试试。当前搜索：${query}`}
        />
      );
    }

    switch (tabValue) {
      case "1":
        return <SongList songList={data.songs} showAlbum={true} />;
      case "10":
        return <AlbumList albumList={data.albums} />;
      case "100":
        return <ArtistList artistList={data.artists} />;
      case "1000":
        return <PlaylistList playlistList={data.playlists} />;
      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-full w-full flex-col gap-2 py-8">
      <div
        className={cn(
          "relative mt-4 mb-2 text-4xl font-bold",
          "before:text-5xl before:text-muted-foreground/60 before:content-['“']",
          "after:text-5xl after:text-muted-foreground/60 after:content-['”']",
          "z-10 px-8",
        )}
      >
        {query}
      </div>

      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between py-6 ">
        <div className="z-10 px-8">
          <Tabs value={tabValue} onValueChange={setTabValue}>
            <TabsList>
              <TabsTrigger value="1">单曲</TabsTrigger>
              <TabsTrigger value="1000">歌单</TabsTrigger>
              <TabsTrigger value="100">歌手</TabsTrigger>
              <TabsTrigger value="10">专辑</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <BlurLayer />
      </div>

      <div className="h-full w-full flex-1 px-8">{renderContent()}</div>

      <div ref={loadMoreRef} className="flex justify-center mt-8">
        {loading && <Loading />}
        {!loading && !hasMore && currentLength > 0 && (
          <span className="text-muted-foreground">没有更多了</span>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SearchContent />
    </Suspense>
  );
}
