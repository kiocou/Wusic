import { Howl } from "howler";

type CorePlayerCallbacks = {
  onEnd: () => void;
  onPlay: (duration: number) => void;
  onProgress?: (currentTime: number) => void;
  onLoadError?: (error: unknown) => void;
  onPlayError?: (error: unknown) => void;
};

class CorePlayer {
  private howl: Howl | null = null;
  private rafId: number | null = null;
  private onProgressCallback: ((currentTime: number) => void) | null = null;
  
  // 进度更新节流：限制更新频率为 ~10fps
  private lastFrameTime = 0;
  private readonly PROGRESS_INTERVAL = 100; // ms，约10fps

  // 淡入淡出配置
  private crossfadeEnabled = false;
  private crossfadeDuration = 3; // 秒

  setCrossfade(enabled: boolean, duration: number) {
    this.crossfadeEnabled = enabled;
    this.crossfadeDuration = duration;
  }

  play(url: string, callbacks: CorePlayerCallbacks) {
    const { onEnd, onPlay, onProgress, onLoadError, onPlayError } = callbacks;

    // 如果开启了淡出，先把当前曲目淡出再切换
    if (this.crossfadeEnabled && this.howl && this.howl.playing()) {
      const fadingOut = this.howl;
      const fadeMs = this.crossfadeDuration * 1000;
      fadingOut.fade(fadingOut.volume(), 0, fadeMs);
      fadingOut.once("fade", () => fadingOut.unload());
      this.howl = null;
    } else if (this.howl) {
      this.howl.unload();
    }

    this.stopProgressLoop();
    this.lastFrameTime = 0;
    this.onProgressCallback = onProgress || null;

    const fadeMs = this.crossfadeEnabled ? this.crossfadeDuration * 1000 : 0;

    this.howl = new Howl({
      src: [url],
      html5: true,
      format: ["mp3", "flac"],
      volume: this.crossfadeEnabled ? 0 : 1, // 淡入时从 0 开始
      onplay: () => {
        if (this.crossfadeEnabled && fadeMs > 0) {
          this.howl?.fade(0, 1, fadeMs);
        }
        onPlay(this.howl?.duration() || 0);
        this.startProgressLoop();
      },
      onpause: () => this.stopProgressLoop(),
      onstop: () => this.stopProgressLoop(),
      onend: () => {
        this.stopProgressLoop();
        onEnd();
      },
      onloaderror: (_id, error) => {
        this.stopProgressLoop();
        onLoadError?.(error);
      },
      onplayerror: (_id, error) => {
        this.stopProgressLoop();
        onPlayError?.(error);
      },
    });

    const playId = this.howl.play();
    if (playId === null) {
      this.stopProgressLoop();
      onPlayError?.(new Error("Howler failed to start playback"));
    }
  }

  private startProgressLoop() {
    const loop = (timestamp: number) => {
      if (!this.howl || !this.onProgressCallback) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }
      
      // 节流：每 100ms 更新一次，而不是每帧都更新
      if (timestamp - this.lastFrameTime >= this.PROGRESS_INTERVAL) {
        this.lastFrameTime = timestamp;
        const currentTime = this.howl.seek() as number;
        this.onProgressCallback(currentTime);
      }
      
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stopProgressLoop() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  pause() {
    this.howl?.pause();
  }

  resume() {
    if (!this.howl) return false;
    const playId = this.howl.play();
    return playId !== null;
  }

  stop(unload = false) {
    this.stopProgressLoop();
    if (!this.howl) return;

    this.howl.stop();
    if (unload) {
      this.howl.unload();
      this.howl = null;
    }
  }

  seek(per: number) {
    if (!this.howl) return 0;

    const duration = this.howl.duration();
    if (!Number.isFinite(duration) || duration <= 0) return 0;

    const safePercent = Math.min(Math.max(per, 0), 1);
    const time = duration * safePercent;
    this.howl.seek(time);
    return time;
  }

  setVolume(val: number) {
    const safeVolume = Math.min(Math.max(val, 0), 1);
    this.howl?.volume(safeVolume);
  }

  getPosition() {
    const position = this.howl?.seek();
    return typeof position === "number" && Number.isFinite(position)
      ? position
      : 0;
  }

  getDuration() {
    const duration = this.howl?.duration() || 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  isReady() {
    return this.howl !== null;
  }

  isPlaying() {
    return this.howl?.playing() || false;
  }
}

export const corePlayer = new CorePlayer();

