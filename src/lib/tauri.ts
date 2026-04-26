export function isTauriRuntime() {
  if (typeof window === "undefined") return false;

  const globalWindow = window as Window & {
    __TAURI__?: unknown;
    __TAURI_INTERNALS__?: unknown;
    __TAURI_IPC__?: unknown;
  };

  return Boolean(
    globalWindow.__TAURI__ ||
      globalWindow.__TAURI_INTERNALS__ ||
      globalWindow.__TAURI_IPC__,
  );
}
