import { create } from "zustand";

export type PlaybackTheme = "apple" | "vinyl";

interface ThemeState {
  currentTheme: PlaybackTheme;
  previousTheme: PlaybackTheme;
  transitionDirection: 1 | -1;
  isThemeSwitching: boolean;
  setTheme: (theme: PlaybackTheme) => void;
  completeThemeSwitch: () => void;
}

export const usePlaybackThemeStore = create<ThemeState>((set) => ({
  currentTheme: "vinyl",
  previousTheme: "vinyl",
  transitionDirection: 1,
  isThemeSwitching: false,
  setTheme: (nextTheme) =>
    set((state) => {
      if (state.currentTheme === nextTheme || state.isThemeSwitching) {
        return state;
      }

      return {
        previousTheme: state.currentTheme,
        currentTheme: nextTheme,
        transitionDirection: nextTheme === "apple" ? 1 : -1,
        isThemeSwitching: true,
      };
    }),
  completeThemeSwitch: () => set({ isThemeSwitching: false }),
}));
