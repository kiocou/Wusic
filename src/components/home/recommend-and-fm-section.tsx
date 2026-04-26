import { getDailyRecommend } from "@/lib/services/recommend";
import { Song } from "@/lib/types";
import { extractColorFromImage } from "@/utils/color-utils";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import SFIcon from "@bradleyhodges/sfsymbols-react";
import {
  sfHeartSlashFill,
  sfForwardEndFill,
  sfPlayFill,
  sfPauseFill,
  sfAntennaRadiowavesLeftAndRight,
  sfCalendar,
} from "@bradleyhodges/sfsymbols";
import { YeeButton } from "../yee-button";
import { useNavigate } from "react-router-dom";
import { usePlayerStore } from "@/lib/store/playerStore";
import { motion } from "framer-motion";

export function RecommendAndFMSection() {
  return (
    <motion.div 
      className="w-full h-48 flex gap-8"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
    >
      <RecommendCard />
      <FmCard />
    </motion.div>
  );
}



function RecommendCard() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [coverUrl, setCoverUrl] = useState("");
  const [vibrant, setVibrant] = useState("");
  const [lightVibrant, setLightVibrant] = useState("");
  const navigate = useNavigate();

  const playQueue = usePlayerStore((s) => s.playQueue);

  useEffect(() => {
    async function fetchData() {
      const res = await getDailyRecommend();
      const url = res[0]?.al?.picUrl || "";

      setSongs(res);
      setCoverUrl(url);

      if (url) {
          try {
            extractColorFromImage(url).then((colors) => {
              setVibrant(colors.dark);
              setLightVibrant(colors.light);
            });
          } catch (err) {
            console.error("提取颜色失败", err);
          }
        }
    }
    fetchData();
  }, []);

  const date = new Date();
  const day = date.getDate();
  const month = date.getMonth() + 1;

  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      className="w-full h-full bg-(--dynamic-color) rounded-xl overflow-hidden relative text-white drop-shadow-2xl cursor-pointer group transform-gpu"
      style={
        {
          "--dynamic-color": vibrant || "gray",
          "--light-vibrant": lightVibrant || "white",
          "--mouse-x": "50%",
          "--mouse-y": "50%",
          "--spotlight-color": "rgba(255, 255, 255, 0.3)",
        } as React.CSSProperties
      }
      onClick={() => {
        navigate("/recommend/daily");
      }}
      onPointerMove={handleMove}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        {coverUrl && (
          <img
            src={coverUrl}
            className="w-full h-full object-cover brightness-60"
            alt="Recommend cover"
          />
        )}
      </div>

      <div className="relative z-10 w-full h-full p-6 flex flex-col justify-between">
        <span className="text-md font-medium drop-shadow-lg flex items-center gap-2">
          <SFIcon icon={sfCalendar} className="size-4 text-white/80" />
          每日推荐
        </span>

        <div className="flex flex-col gap-2">
          <span className="text-white text-lg drop-shadow-md font-medium">
            {songs.length > 0
              ? `${month} 月 ${day} 日，从《${songs[0]?.name}》听起`
              : `${month} 月 ${day} 日，发现今日推荐`}
          </span>
          <Button
            className="w-24 bg-(--dynamic-color) border-b-(--light-vibrant) border-b-2 drop-shadow-lg font-light cursor-pointer transition-all duration-300 hover:brightness-110 hover:shadow-xl text-white"
            disabled={songs.length === 0}
            onClick={(event) => {
              event.stopPropagation();
              if (songs.length > 0) playQueue(songs);
            }}
          >
            立即播放
          </Button>
        </div>
      </div>
      
      {/* 光感效果 */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(250px circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent)`,
        } as React.CSSProperties}
      />
    </motion.div>
  );
}



function FmCard() {
  const {
    fmPlaylist,
    fetchFmSongs,
    playFm,
    isFmMode,
    isPlaying,
    togglePlay,
    nextFmSong,
  } = usePlayerStore();
  const [bgColor, setBgColor] = useState("#2f2f2f"); // 初始深灰色
  const trashFmSong = usePlayerStore((s) => s.trashFmSong);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.PointerEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cardRef.current.style.setProperty("--mouse-x", `${x}px`);
    cardRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const currentFmSong = fmPlaylist[0];

  useEffect(() => {
    if (fmPlaylist.length === 0) {
      fetchFmSongs();
    }
  }, [fetchFmSongs, fmPlaylist.length]);
  useEffect(() => {
    const url = currentFmSong?.al?.picUrl;
    if (url) {
      try {
        extractColorFromImage(url).then((colors) => {
          setBgColor(colors.dark);
        });
      } catch (err) {
        console.error("提取颜色失败", err);
      }
    }
  }, [currentFmSong]);

  const isPlayingFm = isFmMode && isPlaying;

  return (
    <motion.div
      ref={cardRef}
      className="w-full h-full rounded-xl drop-shadow-2xl relative text-white overflow-hidden shadow-inner transition-colors duration-1000 group transform-gpu"
      style={{
        background: `linear-gradient(135deg, ${bgColor} 0%, color-mix(in srgb, ${bgColor}, black 20%) 100%)`,
        "--mouse-x": "50%",
        "--mouse-y": "50%",
        "--spotlight-color": "rgba(255, 255, 255, 0.3)",
      } as React.CSSProperties}
      onPointerMove={handleMove}
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="absolute inset-0 bg-black/10 z-0 pointer-events-none" />

      <div className="w-full h-full flex justify-between p-6 relative z-10">
        <div className="flex flex-col justify-between">
          <span className="text-md font-medium drop-shadow-lg flex items-center gap-2">
            <SFIcon
              icon={sfAntennaRadiowavesLeftAndRight}
              className="size-4 text-white/80"
            />
            私人漫游
          </span>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col">
              <span className="text-lg font-semibold line-clamp-1 max-w-58">
                {currentFmSong?.name}
              </span>
              <span className="text-md opacity-70 line-clamp-1 max-w-58 font-light tracking-wide">
                {currentFmSong?.ar?.map((ar) => ar.name).join(" / ")}
              </span>
            </div>

            <div className="flex gap-4 items-center">
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={<SFIcon icon={sfHeartSlashFill} className="size-6" />}
                onClick={() => {
                  if (!currentFmSong) return;
                  trashFmSong();
                }}
              />
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={
                  <SFIcon
                    icon={isPlayingFm ? sfPauseFill : sfPlayFill}
                    className="size-5"
                  />
                }
                onClick={() => {
                  if (isFmMode) {
                    togglePlay();
                  } else {
                    playFm();
                  }
                }}
              />
              <YeeButton
                variant="ghost"
                className="hover:bg-transparent! hover:text-white text-white/80"
                icon={<SFIcon icon={sfForwardEndFill} className="size-5" />}
                onClick={() => {
                  nextFmSong();
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center">
          {currentFmSong?.al?.picUrl && (
            <img
              src={currentFmSong.al.picUrl}
              className="h-full rounded-[12px] object-cover shadow-2xl"
            />
          )}
        </div>
      </div>
      
      {/* 光感效果 */}
      <div 
        className="absolute inset-0 pointer-events-none transition-opacity duration-500 ease-out opacity-0 group-hover:opacity-100"
        style={{
          background: `radial-gradient(250px circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent)`,
        } as React.CSSProperties}
      />
    </motion.div>
  );
}
