import { create } from "zustand";
import { Album, Artist, Playlist, Resource, Song } from "../types";

export type ContextMenuType =
  | "song"
  | "playlist"
  | "album"
  | "artist"
  | "resource"
  | null;

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  type: ContextMenuType;
  data: Song | Playlist | Album | Artist | Resource | null;

  openMenu: (
    x: number,
    y: number,
    type: ContextMenuType,
    data: Song | Playlist | Album | Artist | Resource | null,
  ) => void;
  closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
  isOpen: false,
  x: 0,
  y: 0,
  type: null,
  data: null,

  openMenu: (
    x: number,
    y: number,
    type: ContextMenuType,
    data: Song | Playlist | Album | Artist | Resource | null,
  ) => {
    set({ isOpen: true, x, y, type, data });
  },
  closeMenu: () => {
    set({ isOpen: false, x: 0, y: 0, data: null });
  },
}));
