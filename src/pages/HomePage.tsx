import { useEffect } from "react";
import { HomeBlock, RecentListenListData, creative, Resource } from "@/lib/types";
import { Section } from "@/components/home/section";
import { SongPreviewItem } from "@/components/home/song-preview";
import {
  getHomepageData,
  getRecentListenListData,
} from "@/lib/services/homepage";
import { getPersonalizedNewSongs, getNewestAlbums } from "@/lib/services/discover";
import { PlaylistCard } from "../components/home/playlist-card";
import { VoicePreview } from "../components/home/voice-preview";
import { Loading } from "@/components/loading";
import { useTitlebar } from "@/contexts/titlebar-context";
import { SlideAndFadePage } from "@/components/slide-and-fade-page";
import useSWR from "swr";
import { RecentListenSection } from "@/components/home/recent-listen-section";
import { useUserStore } from "@/lib/store/userStore";
import { RecommendAndFMSection } from "@/components/home/recommend-and-fm-section";
import { StatePanel } from "@/components/ui/state-panel";
import { Button } from "@/components/ui/button";
import { GetThumbnail } from "@/lib/utils";
import { usePlayerStore } from "@/lib/store/playerStore";
import { Play24Filled } from "@fluentui/react-icons";
import { Link } from "react-router-dom";

export default function Page() {
  const { setOnRefresh, setIsRefreshing } = useTitlebar();
  const { isLoggedin } = useUserStore();

  const {
    data: homepageData,
    isLoading: isLoadingHomepage,
    error: homepageError,
    mutate: mutateHomepage,
  } = useSWR<HomeBlock[]>("homepage", () => getHomepageData(true), {
    revalidateOnFocus: false,
  });

  const {
    data: recentListenList,
    isLoading: isLoadingRecent,
    error: recentError,
    mutate: mutateRecent,
  } = useSWR<RecentListenListData | null>(
    "recentListen",
    getRecentListenListData,
    {
      revalidateOnFocus: false,
    },
  );

  const isLoading = isLoadingHomepage || isLoadingRecent;
  const hasHomeError = homepageError || recentError;

  const { data: newSongs } = useSWR(
    "newSongs",
    () => getPersonalizedNewSongs(10),
    { revalidateOnFocus: false },
  );

  const { data: newAlbums } = useSWR(
    "newAlbums",
    () => getNewestAlbums(10),
    { revalidateOnFocus: false },
  );

  // 当登录状态变化时自动刷新
  useEffect(() => {
    mutateHomepage();
    mutateRecent();
  }, [isLoggedin, mutateHomepage, mutateRecent]);

  // 注册刷新回调
  useEffect(() => {
    setOnRefresh(async () => {
      setIsRefreshing(true);
      try {
        await Promise.all([mutateHomepage(), mutateRecent()]);
      } finally {
        setIsRefreshing(false);
      }
    });
    return () => setOnRefresh(null);
  }, [setOnRefresh, setIsRefreshing, mutateHomepage, mutateRecent]);

  return (
    <>
      {isLoading ? (
        <Loading />
      ) : (
        <div className="w-full min-h-full flex-1 px-8 py-8 flex flex-col gap-12">
          <RecommendAndFMSection />

          {hasHomeError && !homepageData?.length && (
            <StatePanel
              title="首页内容加载失败"
              description="推荐内容暂时不可用，可以稍后刷新重试。"
              action={
                <Button
                  variant="outline"
                  onClick={() => {
                    mutateHomepage();
                    mutateRecent();
                  }}
                >
                  重新加载
                </Button>
              }
            />
          )}

          {recentListenList && (
            <RecentListenSection resources={recentListenList.resources} />
          )}

          {homepageData?.map((blocks, idx) => (
            <SlideAndFadePage key={idx}>
              <Section
                title={blocks.uiElement?.mainTitle?.title || blocks.uiElement?.subTitle?.title || ""}
                seeMore={blocks?.uiElement?.button?.text?.includes("更多")}
              >
                {blocks.showType === "HOMEPAGE_SLIDE_PLAYLIST" &&
                  blocks?.creatives?.map((creative) => (
                    <PlaylistCard
                      resource={creative?.resources?.[0] || null}
                      key={creative.creativeId}
                    />
                  ))}

                {(blocks.showType === "HOMEPAGE_SLIDE_SONGLIST_ALIGN" ||
                  blocks.showType === "HOMPAGE_VIP_SONG_RCMD") &&
                  flattenSongResources(blocks.creatives).map((resource) => (
                    <div key={resource.resourceId} className="w-72 shrink-0">
                      <SongPreviewItem resource={resource} />
                    </div>
                  ))}

                {blocks.showType === "SLIDE_RCMDLIKE_VOICELIST" &&
                  blocks?.creatives && (
                    <>
                      <VoicePreview creatives={blocks.creatives.slice(0, 3)} />
                      <VoicePreview creatives={blocks.creatives.slice(3, 6)} />
                    </>
                  )}

                {blocks.showType === "HOMEPAGE_NEW_SONG_NEW_ALBUM" &&
                  flattenSongResources(blocks.creatives).map((resource, index) => (
                    <NewSongAlbumCard resource={resource} key={resource.resourceId || `new-song-album-${index}`} />
                  ))}


                {/* 兜底：未知类型但有 creatives，统一按 playlist 卡片渲染 */}
                {!["HOMEPAGE_SLIDE_PLAYLIST",
                  "HOMEPAGE_SLIDE_SONGLIST_ALIGN",
                  "HOMPAGE_VIP_SONG_RCMD",
                  "SLIDE_RCMDLIKE_VOICELIST",
                ].includes(blocks.showType) &&
                  blocks.showType !== "HOMEPAGE_NEW_SONG_NEW_ALBUM" &&
                  blocks?.creatives?.map((creative) => (
                    <PlaylistCard
                      resource={creative?.resources?.[0] || null}
                      key={creative.creativeId}
                    />
                  ))}
              </Section>
            </SlideAndFadePage>
          ))}

          {newSongs && newSongs.length > 0 && (
            <SlideAndFadePage>
              <Section title="新歌推荐">
                {newSongs.map((song) => (
                  <NewSongCard song={song} key={song.id} />
                ))}
              </Section>
            </SlideAndFadePage>
          )}

          {newAlbums && newAlbums.length > 0 && (
            <SlideAndFadePage>
              <Section title="最新专辑">
                {newAlbums.map((album) => (
                  <NewAlbumCard album={album} key={album.id} />
                ))}
              </Section>
            </SlideAndFadePage>
          )}

          {!hasHomeError && homepageData?.length === 0 && (
            <StatePanel
              title="暂无推荐内容"
              description="当前账号或网络没有返回首页推荐，刷新后可能恢复。"
            />
          )}
        </div>
      )}
    </>
  );
}

/** 统一正方形封面卡片（新歌/新碟/API 区块都共用同款） */
function SquareCoverCard({
  coverUrl,
  title,
  subtitle,
  onClick,
  to,
}: {
  coverUrl: string;
  title: string;
  subtitle?: string;
  onClick?: () => void;
  to?: string;
}) {
  const content = (
    <div className="w-36 shrink-0 flex flex-col gap-2 group">
      <div
        className="relative w-36 h-36 rounded-xl overflow-hidden"
        onClick={onClick}
      >
        <img
          src={GetThumbnail(coverUrl, 200)}
          alt={title}
          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Play24Filled className="size-5 text-white" />
          </div>
        </div>
      </div>
      <p className="text-sm font-semibold truncate">{title}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      )}
    </div>
  );

  if (to) {
    return <Link to={to} className="shrink-0">{content}</Link>;
  }
  return <div className="shrink-0">{content}</div>;
}

/** 新歌卡片（统一 w-36 正方形封面） */
function NewSongCard({ song }: { song: import("@/lib/types").Song }) {
  const playSong = usePlayerStore((s) => s.playSong);
  const coverUrl = song.al?.picUrl || song.album?.picUrl || "";
  const artists = song.ar?.map((a) => a.name).join("、") || song.artists?.map((a) => a.name).join("、") || "";

  return (
    <SquareCoverCard
      coverUrl={coverUrl}
      title={song.name}
      subtitle={artists}
      onClick={() => playSong(song)}
    />
  );
}

/** 新碟卡片（统一 w-36 正方形封面） */
function NewAlbumCard({ album }: { album: import("@/lib/types").Album }) {
  const coverUrl = album.picUrl || "";
  const artists = album.artists?.map((a) => a.name).join("、") || "";

  return (
    <SquareCoverCard
      coverUrl={coverUrl}
      title={album.name}
      subtitle={artists}
      to={`/detail/album?id=${album.id}`}
    />
  );
}

/** API 返回的新歌新碟板块的统一卡片（与 NewSongCard/NewAlbumCard 同款尺寸） */
function NewSongAlbumCard({ resource }: { resource: Resource | null }) {
  const playSong = usePlayerStore((s) => s.playSong);

  if (!resource) return null;

  const uiElement = resource.uiElement;
  const title = uiElement?.mainTitle?.title || uiElement?.subTitle?.title || "";
  const cover = uiElement?.image?.imageUrl || "";
  const artists = resource.resourceExtInfo?.artists || [];
  const isAlbum = resource.resourceType === "album";

  return (
    <SquareCoverCard
      coverUrl={cover}
      title={title}
      subtitle={artists.length > 0 ? artists.map((a) => a.name).join("、") : undefined}
      onClick={
        !isAlbum
          ? async () => {
              const id = resource.resourceId;
              if (id) {
                const { getSongDetail } = await import("@/lib/services/song");
                const res = await getSongDetail([id]);
                if (res?.[0]) playSong(res[0]);
              }
            }
          : undefined
      }
      to={isAlbum ? `/detail/album?id=${resource.resourceId}` : undefined}
    />
  );
}

/** 展平所有 song-list 类型 creatives 的资源为独立歌曲项 */
function flattenSongResources(creatives: creative[] | undefined): Resource[] {
  if (!creatives) return [];
  return creatives.flatMap((c) => c.resources || []);
}
