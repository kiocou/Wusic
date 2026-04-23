import { getCurrentWindow, LogicalPosition, LogicalSize } from "@tauri-apps/api/window";
import { useCallback, useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Mini 模式窗口尺寸
const MINI_WINDOW_WIDTH = 360;
const MINI_WINDOW_HEIGHT = 96;

// 保存窗口状态
interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MiniModeState {
  isMiniMode: boolean;
  previousWindowState: WindowState | null;
  enterMiniMode: () => Promise<void>;
  exitMiniMode: () => Promise<void>;
  toggleMiniMode: () => Promise<void>;
}

export const useMiniModeStore = create<MiniModeState>()(
  persist(
    (set, get) => ({
      isMiniMode: false,
      previousWindowState: null,

      enterMiniMode: async () => {
        const appWindow = getCurrentWindow();

        // 保存当前窗口状态
        try {
          const position = await appWindow.outerPosition();
          const size = await appWindow.outerSize();
          const state: WindowState = {
            x: position.x,
            y: position.y,
            width: size.width,
            height: size.height,
          };
          set({ previousWindowState: state });
        } catch (e) {
          console.error("保存窗口状态失败:", e);
        }

        // 进入 Mini 模式
        try {
          // 设置窗口置顶
          await appWindow.setAlwaysOnTop(true);

          // 移动到右下角
          const { availableWidth, availableHeight } = await getScreenInfo();
          const miniX = availableWidth - MINI_WINDOW_WIDTH - 20;
          const miniY = availableHeight - MINI_WINDOW_HEIGHT - 20;

          await appWindow.setPosition(new LogicalPosition(miniX, miniY));
          await appWindow.setSize(new LogicalSize(MINI_WINDOW_WIDTH, MINI_WINDOW_HEIGHT));

          set({ isMiniMode: true });
        } catch (e) {
          console.error("进入 Mini 模式失败:", e);
        }
      },

      exitMiniMode: async () => {
        const appWindow = getCurrentWindow();
        const { previousWindowState } = get();

        try {
          // 取消置顶
          await appWindow.setAlwaysOnTop(false);

          // 恢复窗口大小和位置
          if (previousWindowState) {
            await appWindow.setPosition(
              new LogicalPosition(previousWindowState.x, previousWindowState.y),
            );
            await appWindow.setSize(
              new LogicalSize(previousWindowState.width, previousWindowState.height),
            );
          } else {
            // 默认大小
            await appWindow.setPosition(new LogicalPosition(100, 100));
            await appWindow.setSize(new LogicalSize(1440, 900));
          }

          set({ isMiniMode: false });
        } catch (e) {
          console.error("退出 Mini 模式失败:", e);
        }
      },

      toggleMiniMode: async () => {
        const { isMiniMode, enterMiniMode, exitMiniMode } = get();
        if (isMiniMode) {
          await exitMiniMode();
        } else {
          await enterMiniMode();
        }
      },
    }),
    {
      name: "mini-mode-store",
      partialize: (state) => ({
        previousWindowState: state.previousWindowState,
      }),
    },
  ),
);

// 获取屏幕信息
async function getScreenInfo() {
  const { availableWidth, availableHeight } = window.screen;
  return { availableWidth, availableHeight };
}

// React Hook 封装
export function useMiniMode() {
  const {
    isMiniMode,
    enterMiniMode,
    exitMiniMode,
    toggleMiniMode,
  } = useMiniModeStore();

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 延迟设置 ready 状态，确保窗口 API 已初始化
    const timer = setTimeout(() => setIsReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const enter = useCallback(async () => {
    if (!isReady) return;
    await enterMiniMode();
  }, [isReady, enterMiniMode]);

  const exit = useCallback(async () => {
    if (!isReady) return;
    await exitMiniMode();
  }, [isReady, exitMiniMode]);

  const toggle = useCallback(async () => {
    if (!isReady) return;
    await toggleMiniMode();
  }, [isReady, toggleMiniMode]);

  return {
    isMiniMode,
    isReady,
    enterMiniMode: enter,
    exitMiniMode: exit,
    toggleMiniMode: toggle,
  };
}
