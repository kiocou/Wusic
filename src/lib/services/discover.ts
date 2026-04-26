import { api } from "../api";
import { Song, Album } from "../types";

/** /personalized/newsong 返回的单个条目（内层 song 才是 Song 对象） */
interface PersonalizedNewSongItem {
  id: number;
  name: string;
  picUrl: string;
  song: Song;
  copywriter?: string;
  artists?: null;
  type?: number;
  canDislish?: boolean;
}

/** 个性化新歌推荐（默认返回 10 首） */
export async function getPersonalizedNewSongs(limit = 10): Promise<Song[]> {
  const res = await api.get<{
    code: number;
    result: PersonalizedNewSongItem[];
  }>("/personalized/newsong", { limit: String(limit) });

  if (res.code !== 200 || !res.result) return [];

  // 每个 item 的 picUrl 在顶层，song 字段才是真正的 Song 对象
  return res.result.map((item) => ({
    ...item.song,
    // 确保封面可用：优先用外层 picUrl，退回到 song.al 或 song.album
    al: item.song.al
      ? {
          ...item.song.al,
          picUrl:
            item.song.al.picUrl ||
            item.picUrl ||
            item.song.album?.picUrl ||
            "",
        }
      : ({
          id: 0,
          name: "",
          picUrl: item.picUrl || "",
        } as Album),
  }));
}

/** 最新专辑列表 */
export async function getNewestAlbums(limit = 10): Promise<Album[]> {
  const res = await api.get<{
    code: number;
    albums: Album[];
  }>("/album/newest");

  if (res.code !== 200 || !res.albums) return [];

  return res.albums.slice(0, limit);
}
