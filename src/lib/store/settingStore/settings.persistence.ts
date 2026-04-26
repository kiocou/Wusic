import type { Store } from "@tauri-apps/plugin-store";
import { isTauriRuntime } from "@/lib/tauri";

type SettingsStore = Pick<Store, "get" | "set" | "save">;

let store: SettingsStore | null = null;

function createBrowserSettingsStore(): SettingsStore {
  const storageKey = "wusic-settings";

  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}") as Record<
        string,
        unknown
      >;
    } catch {
      return {};
    }
  };

  return {
    async get<T>(key: string) {
      return read()[key] as T | undefined;
    },
    async set(key: string, value: unknown) {
      const data = read();
      data[key] = value;
      localStorage.setItem(storageKey, JSON.stringify(data));
    },
    async save() {
      // localStorage writes synchronously in browser preview.
    },
  };
}

export async function getSettingsStore() {
  if (!store) {
    if (!isTauriRuntime()) {
      store = createBrowserSettingsStore();
      return store;
    }

    const { load } = await import("@tauri-apps/plugin-store");
    store = await load("settings.json");
  }
  return store;
}
