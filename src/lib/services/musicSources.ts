/**
 * musicSources.ts
 * 多音源回退链 —— 当网易云官方音源不可用时，依次尝试以下来源：
 *   1. 官方 /song/url/v1（已在 playSong 中优先调用，此处不重复）
 *   2. 后端自带的 /song/url/match（UnblockNeteaseMusic 接口）
 *   3. 酷狗音乐公共搜索 API
 *   4. 酷我音乐公共搜索 API
 *   5. 咪咕音乐公共搜索 API
 */

import { Song } from "../types";

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

function buildSearchKeyword(song: Song): string {
  const name = song.name || "";
  const artist =
    song.ar?.[0]?.name || song.artists?.[0]?.name || "";
  return `${name} ${artist}`.trim();
}

/** 带超时的 fetch，避免某个源卡死整个回退链 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ─── 各音源解析函数 ─────────────────────────────────────────────────────────────

/**
 * 源 1：后端 /song/url/match
 * 依赖 NeteaseCloudMusicApi 后端内置的 UnblockNeteaseMusic 支持
 */
async function resolveByBackendMatch(
  songId: number | string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const BASE_URL = "http://101.37.83.226:3000";
    const res = await fetch(
      `${BASE_URL}/song/url/match?id=${songId}&timestamp=${Date.now()}`,
      { signal },
    );
    if (!res.ok) return null;
    const data = await res.json();
    const url = data?.data as string | undefined;
    return url || null;
  } catch {
    return null;
  }
}

/**
 * 源 2：酷狗音乐
 * 通过酷狗公开的关键词搜索接口获取播放链接
 */
async function resolveByKugou(song: Song): Promise<string | null> {
  try {
    const keyword = encodeURIComponent(buildSearchKeyword(song));
    // Step 1: 搜索获取 hash
    const searchRes = await fetchWithTimeout(
      `https://mobileservice.kugou.com/api/v3/search/song?keyword=${keyword}&page=1&pagesize=5&userid=0&clientver=&mid=&uuid=&dfid=`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstHit = searchData?.data?.info?.[0];
    if (!firstHit?.hash) return null;

    const { hash, album_id } = firstHit;

    // Step 2: 用 hash 获取播放 URL
    const urlRes = await fetchWithTimeout(
      `https://www.kugou.com/song/#hash=${hash}&album_id=${album_id}`,
    );
    // 酷狗直链通过另一接口获取
    const playRes = await fetchWithTimeout(
      `https://trackercdnbj.kugou.com/i/v2/?cmd=25&hash=${hash}&key=${hash}&appid=1005&pid=2&album_id=${album_id}&album_audio_id=${album_id}`,
      { headers: { "User-Agent": "Mozilla/5.0" } },
    );
    if (!playRes.ok) return null;
    const playData = await playRes.json();
    const playUrl = playData?.url?.[0] as string | undefined;
    if (!playUrl) return null;
    // 酷狗返回的 URL 是 base64 编码的
    return atob(playUrl);
  } catch {
    return null;
  }
}

/**
 * 源 3：酷我音乐
 */
async function resolveByKuwo(song: Song): Promise<string | null> {
  try {
    const keyword = encodeURIComponent(buildSearchKeyword(song));
    // Step 1: 搜索
    const searchRes = await fetchWithTimeout(
      `https://www.kuwo.cn/api/www/search/searchMusicBykeyWord?key=${keyword}&pn=0&rn=3&mobi=1`,
      {
        headers: {
          Referer: "https://www.kuwo.cn",
          "User-Agent": "Mozilla/5.0",
          csrf: "abcdefgh",
          Cookie: "kw_token=abcdefgh",
        },
      },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstSong = searchData?.data?.list?.[0];
    if (!firstSong?.rid) return null;

    const rid = firstSong.rid;
    // Step 2: 获取播放地址
    const urlRes = await fetchWithTimeout(
      `https://www.kuwo.cn/api/v1/www/music/playUrl?mid=${rid}&type=music&httpsStatus=1`,
      {
        headers: {
          Referer: "https://www.kuwo.cn",
          "User-Agent": "Mozilla/5.0",
          csrf: "abcdefgh",
          Cookie: "kw_token=abcdefgh",
        },
      },
    );
    if (!urlRes.ok) return null;
    const urlData = await urlRes.json();
    const playUrl = urlData?.data?.url as string | undefined;
    return playUrl || null;
  } catch {
    return null;
  }
}

/**
 * 源 4：咪咕音乐
 */
async function resolveByMigu(song: Song): Promise<string | null> {
  try {
    const keyword = encodeURIComponent(buildSearchKeyword(song));
    // Step 1: 搜索
    const searchRes = await fetchWithTimeout(
      `https://m.music.migu.cn/migu/remoting/scr_search_tag?rows=3&type=2&keyword=${keyword}&pgc=1`,
      {
        headers: {
          Referer: "https://m.music.migu.cn",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstSong = searchData?.musics?.[0];
    if (!firstSong?.contentId) return null;

    const { contentId } = firstSong;
    // Step 2: 获取播放地址（标准品质）
    const urlRes = await fetchWithTimeout(
      `https://app.c.nf.migu.cn/MIGUM2.0/v1.0/content/sub/listenSong.do?contentId=${contentId}&copyrightId=${firstSong.copyrightId}&resourceType=2&toneFlag=PQ`,
      {
        headers: {
          channel: "0146951",
          uid: "12807435",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );
    if (!urlRes.ok) return null;
    const urlData = await urlRes.json();
    const playUrl = urlData?.data?.playUrl as string | undefined;
    return playUrl || null;
  } catch {
    return null;
  }
}

/**
 * 源 5：B 站音乐 (通过搜索)
 * B 站对 CORS 较友好，且不需要登录即可访问部分音乐
 */
async function resolveByBilibili(song: Song): Promise<string | null> {
  try {
    const keyword = encodeURIComponent(buildSearchKeyword(song));
    // 搜索音频
    const searchRes = await fetchWithTimeout(
      `https://api.bilibili.com/x/web-interface/search/type?search_type=audio&keyword=${keyword}&page=1&page_size=3`,
      {
        headers: {
          Referer: "https://www.bilibili.com",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );
    if (!searchRes.ok) return null;
    const searchData = await searchRes.json();
    const firstResult = searchData?.data?.result?.[0];
    if (!firstResult?.id) return null;

    const audioId = firstResult.id;
    // 获取音频流地址
    const streamRes = await fetchWithTimeout(
      `https://www.bilibili.com/audio/music-service-c/web/url?sid=${audioId}&privilege=2&quality=2`,
      {
        headers: {
          Referer: "https://www.bilibili.com",
          "User-Agent": "Mozilla/5.0",
        },
      },
    );
    if (!streamRes.ok) return null;
    const streamData = await streamRes.json();
    const playUrl = streamData?.data?.cdns?.[0] as string | undefined;
    return playUrl || null;
  } catch {
    return null;
  }
}

// ─── 主回退链 ───────────────────────────────────────────────────────────────────

export interface ResolveResult {
  url: string;
  source: string;
}

/**
 * resolveAudioUrl
 * 按优先级依次尝试各音源，返回第一个成功的结果
 * 
 * @param song  歌曲信息（用于关键词搜索）
 * @param signal  AbortSignal，用于取消整个请求链
 */
export async function resolveAudioUrl(
  song: Song,
  signal?: AbortSignal,
): Promise<ResolveResult | null> {
  // 源 1: 后端解锁接口（速度最快，成功率最高，优先）
  if (!signal?.aborted) {
    const url = await resolveByBackendMatch(song.id, signal);
    if (url) {
      console.log(`[音源] 后端解锁接口 成功`);
      return { url, source: "backend-match" };
    }
  }

  // 并行尝试其余外部音源，取最先成功的
  if (signal?.aborted) return null;

  const externalSources: Array<{ name: string; fn: () => Promise<string | null> }> = [
    { name: "kugou", fn: () => resolveByKugou(song) },
    { name: "kuwo", fn: () => resolveByKuwo(song) },
    { name: "migu", fn: () => resolveByMigu(song) },
    { name: "bilibili", fn: () => resolveByBilibili(song) },
  ];

  // 并行发起，但只取第一个成功的
  const result = await Promise.any(
    externalSources.map(async ({ name, fn }) => {
      const url = await fn();
      if (!url) throw new Error(`${name} failed`);
      console.log(`[音源] ${name} 成功`);
      return { url, source: name } as ResolveResult;
    }),
  ).catch(() => null);

  return result;
}
