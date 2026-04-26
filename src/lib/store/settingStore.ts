import { create } from "zustand";
import { getSettingsStore } from "./settingStore/settings.persistence";
import { QualityKey } from "../constants/song";
import { isTauriRuntime } from "@/lib/tauri";

export interface MeshGradientSettings {
  distortion: number;
  swirl: number;
  grainMixer: number;
  grainOverlay: number;
  speed: number;
}

export interface FontSettings {
  interfaceFontStr: string;
  lyricFontStr: string;
}

export interface PerformanceSettings {
  gpuAcceleration: boolean;
  fluidBackground: boolean;
  fluidBackgroundIntensity: number;
  hardwareAcceleration: boolean;
  audioVisualizer: boolean;
}

export interface AppearanceSettings {
  theme: "light" | "dark" | "system";
  material: "acrylic" | "mica" | "none";
  meshGradient: MeshGradientSettings;
  font: FontSettings;
  performance: PerformanceSettings;
}

export interface AudioSettings {
  preferQuality: QualityKey;
}

export interface PlaybackSettings {
  crossfade: boolean;
  crossfadeDuration: number;
  autoPlay: boolean;
}

export interface SystemSettings {
  closeToTray: boolean;
  enableDiscordRPC: boolean;
  showDesktopLyric: boolean;
  autoCollapseSidebar: boolean;
}

const defaultAppearanceSettings: AppearanceSettings = {
  theme: "system",
  material: "mica",
  meshGradient: {
    distortion: 0.5,
    swirl: 0.2,
    grainMixer: 0,
    grainOverlay: 0,
    speed: 0.2,
  },
  font: {
    interfaceFontStr: "",
    lyricFontStr: "",
  },
  performance: {
    gpuAcceleration: true,
    fluidBackground: true,
    fluidBackgroundIntensity: 0.8,
    hardwareAcceleration: true,
    audioVisualizer: true,
  },
};

const defaultPlaybackSettings: PlaybackSettings = {
  crossfade: false,
  crossfadeDuration: 3,
  autoPlay: false,
};

const defaultSystemSettings: SystemSettings = {
  closeToTray: true,
  enableDiscordRPC: false,
  showDesktopLyric: false,
  autoCollapseSidebar: false,
};

type SettingStore = {
  appearance: AppearanceSettings;
  audio: AudioSettings;
  playback: PlaybackSettings;
  system: SystemSettings;
  hydrated: boolean;

  setTheme: (theme: AppearanceSettings["theme"]) => void;
  setMaterial: (material: AppearanceSettings["material"]) => void;
  updateMeshGradient: (patch: Partial<MeshGradientSettings>) => void;
  updateFont: (patch: Partial<FontSettings>) => void;
  updatePerformance: (patch: Partial<PerformanceSettings>) => void;
  updatePlayback: (patch: Partial<PlaybackSettings>) => void;
  updateSystem: (patch: Partial<SystemSettings>) => void;

  loadSettings: () => Promise<void>;
  saveSettings: () => Promise<void>;
  resetAppearance: () => Promise<void>;

  setPreferQuality: (quality: QualityKey) => Promise<void>;
};

export const useSettingStore = create<SettingStore>((set, get) => ({
  appearance: defaultAppearanceSettings,
  audio: {
    preferQuality: "l",
  },
  playback: defaultPlaybackSettings,
  system: defaultSystemSettings,
  hydrated: false,

  setTheme: (theme) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        theme,
      },
    }));
    get().saveSettings();
  },

  setMaterial: (material) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        material,
      },
    }));
    get().saveSettings();
  },

  updateMeshGradient: (patch) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        meshGradient: {
          ...state.appearance.meshGradient,
          ...patch,
        },
      },
    }));
    get().saveSettings();
  },

  updateFont: (patch) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        font: {
          ...state.appearance.font,
          ...patch,
        },
      },
    }));
    get().saveSettings();
  },

  updatePerformance: (patch) => {
    set((state) => ({
      appearance: {
        ...state.appearance,
        performance: {
          ...state.appearance.performance,
          ...patch,
        },
      },
    }));
    get().saveSettings();
  },

  updatePlayback: (patch) => {
    set((state) => ({
      playback: {
        ...state.playback,
        ...patch,
      },
    }));
    get().saveSettings();
  },

  updateSystem: (patch) => {
    set((state) => ({
      system: {
        ...state.system,
        ...patch,
      },
    }));
    get().saveSettings();
  },

  loadSettings: async () => {
    const store = await getSettingsStore();
    const savedAppearance = await store.get<AppearanceSettings>("appearance");
    const savedAudio = await store.get<AudioSettings>("audio");
    const savedPlayback = await store.get<PlaybackSettings>("playback");
    const savedSystem = await store.get<SystemSettings>("system");

    set({
      appearance: savedAppearance
        ? {
            ...defaultAppearanceSettings,
            ...savedAppearance,
            meshGradient: {
              ...defaultAppearanceSettings.meshGradient,
              ...savedAppearance.meshGradient,
            },
            performance: {
              ...defaultAppearanceSettings.performance,
              ...savedAppearance.performance,
            },
          }
        : defaultAppearanceSettings,
      audio: savedAudio ? { ...get().audio, ...savedAudio } : get().audio,
      playback: savedPlayback ? { ...defaultPlaybackSettings, ...savedPlayback } : defaultPlaybackSettings,
      system: savedSystem ? { ...defaultSystemSettings, ...savedSystem } : defaultSystemSettings,
      hydrated: true,
    });
  },

  saveSettings: async () => {
    const store = await getSettingsStore();
    await store.set("appearance", get().appearance);
    await store.set("audio", get().audio);
    await store.set("playback", get().playback);
    await store.set("system", get().system);
    await store.save();
  },

  resetAppearance: async () => {
    const store = await getSettingsStore();
    set({ appearance: defaultAppearanceSettings });
    await store.set("appearance", defaultAppearanceSettings);
    await store.save();
  },

  setPreferQuality: async (quality: QualityKey) => {
    const store = await getSettingsStore();
    set({ audio: { preferQuality: quality } });
    await store.set("audio", get().audio);
    await store.save();
  },
}));

function applyTheme(theme: AppearanceSettings["theme"]) {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(getEffectiveTheme(theme));
}

function getEffectiveTheme(theme: AppearanceSettings["theme"]): "light" | "dark" {
  if (theme !== "system") return theme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

async function applyMaterial(material: AppearanceSettings["material"]) {
  document.documentElement.dataset.material = material;
  if (!isTauriRuntime()) return;
  const { Effect, getCurrentWindow } = await import("@tauri-apps/api/window");
  const appWindow = getCurrentWindow();
  try {
    await appWindow.clearEffects();
    if (material === "mica") {
      await appWindow.setEffects({ effects: [Effect.Mica] });
    } else if (material === "acrylic") {
      const effectiveTheme = getEffectiveTheme(
        useSettingStore.getState().appearance.theme,
      );
      const acrylicTint: [number, number, number, number] =
        effectiveTheme === "dark"
          ? [16, 18, 24, 224]
          : [246, 249, 255, 126];
      await appWindow.setEffects({
        effects: [Effect.Acrylic],
        color: acrylicTint,
      });
    }
  } catch (error) {
    console.error("Failed to set window effects", error);
  }
}

async function applyInterfaceFont(fontStr: string) {
  const root = document.documentElement;
  if (fontStr) {
    root.style.setProperty("--app-font-family", fontStr);
  } else {
    root.style.removeProperty("--app-font-family");
  }
}

function applyLyricFont(fontStr: string) {
  const root = document.documentElement;
  if (fontStr) {
    root.style.setProperty("--app-lyric-font-family", fontStr);
  } else {
    root.style.removeProperty("--app-lyric-font-family");
  }
}

/**
 * GPU 硬件加速：通过 CSS 类控制全局 will-change 策略
 * gpuAcceleration=true → 在 <html> 上添加 data-gpu="on"，CSS 里对动画元素开启 will-change: transform
 */
function applyGpuAcceleration(enabled: boolean) {
  document.documentElement.dataset.gpu = enabled ? "on" : "off";
}

/**
 * 动态硬件加速：CSS 变量，控制动画层是否强制开启 GPU 合成层
 * hardwareAcceleration=true → transform: translateZ(0) 强制合成
 */
function applyHardwareAcceleration(enabled: boolean) {
  document.documentElement.dataset.hwaccel = enabled ? "on" : "off";
}

/**
 * 流体背景开关 + 强度：控制背景 canvas 元素的显示与 opacity
 */
function applyFluidBackground(enabled: boolean, intensity: number) {
  document.documentElement.dataset.fluidbg = enabled ? "on" : "off";
  document.documentElement.style.setProperty(
    "--fluid-bg-opacity",
    enabled ? String(intensity) : "0",
  );
}

/**
 * 关闭到托盘：监听 Tauri 的 close-requested 事件响应
 * 实际的 prevent_close 逻辑在 Rust 端已实现（永远阻止关闭并 hide）
 * 这里控制的是：closeToTray=false 时，前端收到 app-background 事件后真正退出
 */
async function applyCloseToTray(enabled: boolean) {
  if (!isTauriRuntime()) return;
  // 将设置同步给 Rust 端，通过 dataset 标记，App.tsx 的 app-background 监听器读取此值
  document.documentElement.dataset.closeToTray = enabled ? "true" : "false";
}

export async function initSettings() {
  await useSettingStore.getState().loadSettings();

  const { appearance, system } = (() => {
    const s = useSettingStore.getState();
    return {
      appearance: s.appearance,
      system: s.system,
    };
  })();

  // 初始化所有设置
  applyTheme(appearance.theme);
  applyMaterial(appearance.material);
  applyInterfaceFont(appearance.font.interfaceFontStr);
  applyLyricFont(appearance.font.lyricFontStr);
  applyGpuAcceleration(appearance.performance.gpuAcceleration);
  applyHardwareAcceleration(appearance.performance.hardwareAcceleration);
  applyFluidBackground(
    appearance.performance.fluidBackground,
    appearance.performance.fluidBackgroundIntensity,
  );
  applyCloseToTray(system.closeToTray);

  // 监听系统深色模式变化（theme=system 时实时跟随）
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", () => {
    if (useSettingStore.getState().appearance.theme === "system") {
      applyTheme("system");
      applyMaterial(useSettingStore.getState().appearance.material);
    }
  });

  useSettingStore.subscribe((state, prevState) => {
    const perf = state.appearance.performance;
    const prevPerf = prevState.appearance.performance;

    if (state.appearance.theme !== prevState.appearance.theme) {
      applyTheme(state.appearance.theme);
      applyMaterial(state.appearance.material);
    }
    if (state.appearance.material !== prevState.appearance.material) {
      applyMaterial(state.appearance.material);
    }
    if (
      state.appearance.font.interfaceFontStr !==
      prevState.appearance.font.interfaceFontStr
    ) {
      applyInterfaceFont(state.appearance.font.interfaceFontStr);
    }
    if (
      state.appearance.font.lyricFontStr !==
      prevState.appearance.font.lyricFontStr
    ) {
      applyLyricFont(state.appearance.font.lyricFontStr);
    }
    if (perf.gpuAcceleration !== prevPerf.gpuAcceleration) {
      applyGpuAcceleration(perf.gpuAcceleration);
    }
    if (perf.hardwareAcceleration !== prevPerf.hardwareAcceleration) {
      applyHardwareAcceleration(perf.hardwareAcceleration);
    }
    if (
      perf.fluidBackground !== prevPerf.fluidBackground ||
      perf.fluidBackgroundIntensity !== prevPerf.fluidBackgroundIntensity
    ) {
      applyFluidBackground(perf.fluidBackground, perf.fluidBackgroundIntensity);
    }
    if (state.system.closeToTray !== prevState.system.closeToTray) {
      applyCloseToTray(state.system.closeToTray);
    }
  });
}
