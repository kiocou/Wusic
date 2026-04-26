export interface LocalTrack {
  id: number;
  path: string;
  file_name: string;
  title: string;
  artist?: string | null;
  album?: string | null;
  duration_ms?: number | null;
  extension: string;
  size: number;
}

export type PlayableTrackSource = "online" | "local" | "cloud";
