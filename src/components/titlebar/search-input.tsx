import {
  Delete20Regular,
  Dismiss20Regular,
  Fire20Regular,
  History20Regular,
  Search24Regular,
} from "@fluentui/react-icons";
import { Input } from "../ui/input";
import { useEffect, useState } from "react";
import {
  getSearchDefault,
  getSearchHotDetail,
  getSearchSuggest,
} from "@/lib/services/search";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useUserStore } from "@/lib/store/userStore";

const SEARCH_HISTORY_KEY = "wusic-search-history";
const MAX_HISTORY = 8;
const MAX_HOT_SEARCH = 8;

export function SearchInput() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [placeholder, setPlaceholder] = useState("搜索...");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [hotSearches, setHotSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();

  const user = useUserStore((s) => s.user);

  useEffect(() => {
    async function fetchDefault() {
      try {
        const res = await getSearchDefault();
        if (res?.showKeyword) setPlaceholder(res.showKeyword);
      } catch (err) {
        console.error("获取默认搜索词失败", err);
      }
    }
    fetchDefault();
  }, [user]);

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(SEARCH_HISTORY_KEY) || "[]",
      );
      if (Array.isArray(saved)) setHistory(saved.filter(Boolean).slice(0, MAX_HISTORY));
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    async function fetchHotSearches() {
      try {
        const res = await getSearchHotDetail();
        setHotSearches(
          res
            .map((item) => item.searchWord)
            .filter(Boolean)
            .slice(0, MAX_HOT_SEARCH),
        );
      } catch (err) {
        console.error("获取热门搜索失败", err);
      }
    }
    fetchHotSearches();
  }, [user]);

  useEffect(() => {
    if (!debouncedQuery) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuggestions([]);
      return;
    }

    async function fetchSuggest() {
      try {
        const res = await getSearchSuggest(debouncedQuery);
        setSuggestions(res);
      } catch (err) {
        console.error("获取搜索建议失败", err);
      }
    }
    fetchSuggest();
  }, [debouncedQuery]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(-1);
  }, [suggestions]);

  function saveHistory(keyword: string) {
    const next = [
      keyword,
      ...history.filter((item) => item !== keyword),
    ].slice(0, MAX_HISTORY);
    setHistory(next);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }

  function handleSearch(keyword: string) {
    const target = keyword.trim() || placeholder.trim();
    if (!target) return;
    saveHistory(target);
    setQuery(target);
    setSuggestions([]);
    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(target)}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions.length > 0)
        handleSearch(suggestions[selectedIndex]);
      else handleSearch(query);
      return;
    }

    if (!isOpen || suggestions.length === 0 || !query.trim()) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + suggestions.length) % suggestions.length,
        );
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }

  const showDiscoveryPanel =
    isOpen &&
    !query.trim() &&
    (history.length > 0 || hotSearches.length > 0);
  const showSuggestPanel = isOpen && query.trim() && suggestions.length > 0;

  return (
    <div className="relative">
      <Input
        placeholder={placeholder}
        className={cn(
          "w-72 bg-[var(--search-input-surface)]! pr-8 text-[var(--search-panel-text)] shadow-xs border-[var(--search-input-border)]! placeholder:text-[var(--search-panel-muted)] focus:border-[var(--search-input-border)]! hover:bg-[var(--search-input-surface-hover)]!",
          (showSuggestPanel || showDiscoveryPanel) && "rounded-b-none",
        )}
        containerClassName={cn(
          "rounded-md",
          (showSuggestPanel || showDiscoveryPanel) && "rounded-b-none",
        )}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 120)}
        onKeyDown={handleKeyDown}
      />

      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {query && (
          <Dismiss20Regular
            className="size-4 cursor-pointer text-[var(--search-panel-muted)] hover:text-[var(--search-panel-text)]"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
            }}
          />
        )}
        <Search24Regular
          className="size-4 cursor-pointer text-[var(--search-panel-muted)] hover:text-[var(--search-panel-text)]"
          onClick={() => handleSearch(query)}
        />
      </div>

      <AnimatePresence>
        {(showSuggestPanel || showDiscoveryPanel) && (
          <motion.div
            className="absolute left-0 top-full z-50 w-full origin-top overflow-hidden rounded-b-md border border-t-0 border-[var(--search-panel-border)] bg-[var(--search-panel-surface)] text-[var(--search-panel-text)] shadow-[var(--search-panel-shadow)] backdrop-blur-xl"
            initial={{ opacity: 0, y: -4, scaleY: 0.96 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -4, scaleY: 0.96 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          >
            <div className="flex flex-col gap-2 px-2 py-2">
              {showSuggestPanel && (
                <SearchGroup title="联想建议" icon={<Search24Regular className="size-4" />}>
                  {suggestions.map((suggest, index) => (
                    <SearchPanelItem
                      key={suggest}
                      label={suggest}
                      active={index === selectedIndex}
                      onSelect={() => handleSearch(suggest)}
                    />
                  ))}
                </SearchGroup>
              )}

              {showDiscoveryPanel && history.length > 0 && (
                <SearchGroup
                  title="搜索历史"
                  icon={<History20Regular className="size-4" />}
                  trailing={
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded-sm px-1.5 py-1 text-xs text-[var(--search-panel-muted)] hover:bg-foreground/8 hover:text-[var(--search-panel-text)]"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={clearHistory}
                    >
                      <Delete20Regular className="size-3.5" />
                      清空
                    </button>
                  }
                >
                  {history.map((item) => (
                    <SearchPanelItem
                      key={item}
                      label={item}
                      onSelect={() => handleSearch(item)}
                    />
                  ))}
                </SearchGroup>
              )}

              {showDiscoveryPanel && hotSearches.length > 0 && (
                <SearchGroup title="热门搜索" icon={<Fire20Regular className="size-4" />}>
                  {hotSearches.map((item) => (
                    <SearchPanelItem
                      key={item}
                      label={item}
                      onSelect={() => handleSearch(item)}
                    />
                  ))}
                </SearchGroup>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SearchGroup({
  title,
  icon,
  trailing,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2 py-1 text-xs font-medium text-[var(--search-panel-muted)]">
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function SearchPanelItem({
  label,
  active,
  onSelect,
}: {
  label: string;
  active?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative w-full cursor-pointer rounded-sm p-2 text-left text-sm text-[var(--search-panel-text)] hover:bg-foreground/8",
        active && "bg-foreground/5",
      )}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
    >
      <span className="line-clamp-1">{label}</span>
      {active && (
        <div className="absolute left-0 top-1/2 h-4 w-1 -translate-y-1/2 -translate-x-0.5 rounded-full bg-primary" />
      )}
    </button>
  );
}
