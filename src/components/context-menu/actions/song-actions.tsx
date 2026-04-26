import { useContextMenuStore } from "@/lib/store/contextMenuStore";
import { ActionProps } from "./action";
import { useSongLogic } from "@/hooks/use-song-logic";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "@/lib/store/userStore";
import {
  ContextMenuButton,
  ContextMenuSeperator,
} from "../context-menu-button";
import {
  Album24Regular,
  ArrowDownload24Regular,
  Collections24Regular,
  Delete24Regular,
  Person24Regular,
  Play24Filled,
  TextBulletListAdd24Regular,
} from "@fluentui/react-icons";
import { Resource, Song } from "@/lib/types";
import { QUALITY_LIST } from "@/lib/constants/song";
import { useDownloadStore } from "@/lib/store/downloadStore";
import { toast } from "sonner";

export function SongActions({ type, data }: ActionProps) {
  const { closeMenu } = useContextMenuStore();
  const {
    handleLike,
    handlePlay,
    handleNextPlay,
    handleAddToPlaylist,
    handleRemoveFromPlaylist,
  } = useSongLogic();
  const currentSong = usePlayerStore((s) => s.currentSong);
  const { isInPlaylist } = usePlayerStore();
  const navigate = useNavigate();
  const playlistList = useUserStore((s) => s.playlistList);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const playlistId = searchParams.get("id");

  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const createdPlaylists = useUserStore((s) => s.createdPlaylists);

  const isPlaylistPage = location.pathname.includes("/playlist");
  const isFavPlaylist = playlistId === favPlaylist?.id?.toString();

  const isMyPalylistPage =
    isPlaylistPage &&
    playlistId &&
    (isFavPlaylist ||
      createdPlaylists.some((pl) => pl.id.toString() === playlistId));

  const startDownload = useDownloadStore((s) => s.startDownload);
  const downloadedSongs = useDownloadStore((s) => s.downloadedSongs);

  const isSongAction = type === "song" || data?.resourceType === "song";
  if (!isSongAction || !data) return null;

  const song = data as Partial<Song>;
  const resource = data as Partial<Resource>;
  const resourceSong = resource.resourceExtInfo?.song;
  const songId = Number(song.id ?? resource.resourceId ?? resourceSong?.id);
  const artists = song.ar?.length
    ? song.ar
    : resource.resourceExtInfo?.artists?.length
      ? resource.resourceExtInfo.artists
      : resourceSong?.ar ?? [];
  const primaryArtist = artists[0];
  const album = song.al ?? resourceSong?.al;
  const canDownload = type === "song" && Number.isFinite(songId);
  const downloadableQualities = canDownload
    ? QUALITY_LIST.filter(
        (q) => q.key !== "unlock" && Boolean((data as Song)[q.key as keyof Song]),
      )
    : [];

  const isDownloaded = downloadedSongs.some(
    (item) => Number(item.song.id) === songId,
  );
  const isCurrentSong = currentSong?.id === songId;
  const isAlreadyInPlaylist = Number.isFinite(songId)
    ? isInPlaylist({ id: songId } as Song)
    : false;

  return (
    <>
      {!isCurrentSong && (
        <ContextMenuButton
          id="play-music"
          icon={<Play24Filled className="size-4" />}
          content="播放"
          onClick={() => {
            closeMenu();
            handlePlay(data);
          }}
        />
      )}

      {!isAlreadyInPlaylist && (
        <>
          <ContextMenuButton
            id="add-to-playlist"
            icon={<TextBulletListAdd24Regular className="size-4" />}
            content="加入播放列表"
            onClick={async () => {
              closeMenu();
              handleNextPlay(data);
            }}
          />
          <ContextMenuSeperator />
        </>
      )}

      <ContextMenuButton
        id="collect-music"
        icon={<Collections24Regular className="size-4" />}
        content="收藏"
        hasSubmenu={true}
      >
        {playlistList.length > 0 ? (
          playlistList.map((playlist) => (
            <ContextMenuButton
              id={`collect-music-${playlist.id}`}
              key={playlist.id}
              content={playlist.name}
              onClick={() => {
                closeMenu();
                handleAddToPlaylist(playlist.id, data);
              }}
            />
          ))
        ) : (
          <ContextMenuButton
            id="collect-music-empty"
            content="暂无可收藏歌单"
            disabled
          />
        )}
      </ContextMenuButton>

      {!isDownloaded && canDownload && (
        <ContextMenuButton
          id="download-music"
          icon={<ArrowDownload24Regular className="size-4" />}
          content="下载"
          hasSubmenu={true}
        >
          {downloadableQualities.length > 0 ? (
            downloadableQualities.map((q) => (
              <ContextMenuButton
                id={`download-music-${q.level}`}
                key={q.level}
                content={q.desc}
                onClick={() => {
                  closeMenu();
                  startDownload(data as Song, q.level);
                }}
              />
            ))
          ) : (
            <ContextMenuButton
              id="download-music-empty"
              content="暂无可下载音质"
              disabled
            />
          )}
        </ContextMenuButton>
      )}

      <ContextMenuButton
        id="artist-info"
        icon={<Person24Regular className="size-4" />}
        content={`歌手：${primaryArtist?.name ?? "未知歌手"}`}
        disabled={!primaryArtist?.id}
        onClick={() => {
          if (!primaryArtist?.id) return;
          navigate(`/detail/artist?id=${primaryArtist.id}`);
          closeMenu();
        }}
      />

      {album && (
        <ContextMenuButton
          id="album-info"
          icon={<Album24Regular className="size-4" />}
          content={`专辑：${album.name ?? "未知专辑"}`}
          disabled={!album.id}
          onClick={() => {
            if (!album.id) return;
            navigate(`/detail/album?id=${album.id}`);
            closeMenu();
          }}
        />
      )}

      {isMyPalylistPage && (
        <ContextMenuButton
          id="remove-from-playlist"
          icon={<Delete24Regular className="size-4" />}
          content={`从歌单中移除`}
          onClick={() => {
            closeMenu();
            if (isFavPlaylist) {
              handleLike("song", data);
            } else {
              handleRemoveFromPlaylist(Number(playlistId), data);
            }
            toast.success("已提交移除操作", { position: "top-center" });
          }}
        />
      )}
    </>
  );
}
