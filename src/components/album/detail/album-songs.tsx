import { SongList } from "@/components/song/song-list";
import { StatePanel } from "@/components/ui/state-panel";
import { Song } from "@/lib/types";
import { CollectionsEmpty24Regular } from "@fluentui/react-icons";

export function AlbumSongs({ songs }: { songs: Song[] }) {
  return (
    <div className="w-full h-full">
      {songs.length > 0 ? (
        <SongList songList={songs} showCover={false} showAlbum={false} />
      ) : (
        <StatePanel
          compact
          icon={<CollectionsEmpty24Regular className="size-6" />}
          title="暂无歌曲"
          description="这个专辑暂时没有可展示的曲目。"
        />
      )}
    </div>
  );
}
