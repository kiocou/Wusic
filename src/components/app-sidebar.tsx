import { LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import { useSettingStore } from "@/lib/store/settingStore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import {
  Person20Regular,
  FluentIcon,
  Settings20Regular,
  SignOut20Regular,
  PersonEdit20Regular,
  Home20Regular,
  Home20Filled,
  ArrowDownload20Regular,
  ArrowDownload20Filled,
  Folder20Regular,
  Folder20Filled,
  Clock20Regular,
  Clock20Filled,
  Heart20Filled,
  Heart20Regular,
  List20Regular,
  Add20Regular,
  ChevronRight24Regular,
} from "@fluentui/react-icons";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { LoginForm } from "./modal/login-form";
import { useUserStore } from "@/lib/store/userStore";
import { LogoutForm } from "./modal/logout-form";
import { useLocation, useSearchParams } from "react-router-dom";
import { Playlist } from "@/lib/types";
import { PlaylistAddForm } from "./modal/playlist-add-form";

const mainItems = [
  {
    title: "主页",
    url: "/",
    icon: Home20Regular,
    activeIcon: Home20Filled,
  },
];

const libraryItems = [
  {
    title: "最近播放",
    url: "/library/recent",
    icon: Clock20Regular,
    activeIcon: Clock20Filled,
  },
  {
    title: "下载管理",
    url: "/library/download",
    icon: ArrowDownload20Regular,
    activeIcon: ArrowDownload20Filled,
  },
  {
    title: "本地音乐",
    url: "/library/local",
    icon: Folder20Regular,
    activeIcon: Folder20Filled,
  },
];

const sidebarLabelClass =
  "text-[11px] font-semibold uppercase tracking-wider text-[var(--sidebar-text-faint)] mb-1 px-2";
const sidebarSeparatorClass = "mx-3! my-2! bg-[var(--sidebar-divider)]";
const sidebarActiveIconClass = "size-5 text-[var(--sidebar-accent-strong)]";
const sidebarActiveRailClass =
  "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--sidebar-accent-strong)] rounded-r-full";
const sidebarSubtleButtonClass =
  "text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text-strong)] hover:bg-[var(--sidebar-item-hover-bg)]";

function sidebarItemClass(active: boolean) {
  return cn(
    "relative overflow-hidden transition-all duration-200",
    active
      ? "font-semibold text-[var(--sidebar-text-strong)] bg-[var(--sidebar-item-active-bg)]"
      : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-strong)] hover:bg-[var(--sidebar-item-hover-bg)]",
  );
}

export function AppSidebar() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isPlaylistAddOpen, setIsPlaylistAddOpen] = useState(false);

  const createdPlaylists = useUserStore((s) => s.createdPlaylists);
  const subscribedPlaylists = useUserStore((s) => s.subscribedPlaylists);

  const user = useUserStore((state) => state.user);

  const location = useLocation();
  const pathName = location.pathname;
  const [searchParams] = useSearchParams();
  const currentId = searchParams.get("id");

  const isItemActive = (item: {
    title: string;
    url: string;
    icon: FluentIcon;
    activeIcon: FluentIcon;
  }) => {
    if (item.url && item.url != "#") {
      return pathName === item.url || pathName.startsWith(item.url + "/");
    }

    return false;
  };

  const isPlaylistActive = (playlist: Playlist) => {
    const isMatchedPath =
      pathName === "/detail/playlist" || pathName === "/detail/playlist/";
    return isMatchedPath && currentId === String(playlist.id);
  };

  const navigate = useNavigate();

  const favPlaylist = useUserStore((s) => s.favPlaylist);
  const isFavPlaylistActive = favPlaylist ? isPlaylistActive(favPlaylist) : false;
  const favPlaylistUrl = favPlaylist
    ? `/detail/playlist?id=${favPlaylist.id}`
    : "";

  const { setOpen, isMobile } = useSidebar();
  const autoCollapseSidebar = useSettingStore((s) => s.system?.autoCollapseSidebar);
  const setSidebarOpenRef = useRef(setOpen);

  useEffect(() => {
    setSidebarOpenRef.current = setOpen;
  }, [setOpen]);

  useEffect(() => {
    if (isMobile) return;
    setSidebarOpenRef.current(!autoCollapseSidebar);
  }, [autoCollapseSidebar, isMobile]);

  const handleAutoExpand = () => {
    if (!isMobile && autoCollapseSidebar) setOpen(true);
  };

  const handleAutoCollapse = () => {
    if (!isMobile && autoCollapseSidebar) setOpen(false);
  };

  return (
    <>
      <Sidebar
        variant="sidebar"
        collapsible="icon"
        className="absolute! h-full! transition-all duration-300"
        onMouseEnter={handleAutoExpand}
        onMouseLeave={handleAutoCollapse}
        onFocus={handleAutoExpand}
        onBlur={(event) => {
          const nextTarget = event.relatedTarget as Node | null;
          if (!nextTarget || !event.currentTarget.contains(nextTarget)) {
            handleAutoCollapse();
          }
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <SidebarContent className="bg-transparent dark:bg-transparent text-[var(--sidebar-text)]">
          <SidebarGroup className="px-2">
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {mainItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="relative"
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive(item)}
                        className={sidebarItemClass(isItemActive(item))}
                      >
                        <Link to={item.url}>
                          <AnimatePresence mode="wait">
                            {isItemActive(item) ? (
                              <motion.div
                                key="active"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <item.activeIcon className={sidebarActiveIconClass} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="inactive"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <item.icon className="size-5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className={cn(
                            isItemActive(item) && "font-semibold"
                          )}>{item.title}</span>
                          {isItemActive(item) && (
                            <motion.div
                              layoutId="activeNav"
                              className={sidebarActiveRailClass}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className={sidebarSeparatorClass} />

          <SidebarGroup className="px-2">
            <SidebarGroupLabel className={sidebarLabelClass}>
              资料库
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {libraryItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="relative"
                    >
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive(item)}
                        className={sidebarItemClass(isItemActive(item))}
                      >
                        <Link to={item.url}>
                          <AnimatePresence mode="wait">
                            {isItemActive(item) ? (
                              <motion.div
                                key="active"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <item.activeIcon className={sidebarActiveIconClass} />
                              </motion.div>
                            ) : (
                              <motion.div
                                key="inactive"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                              >
                                <item.icon className="size-5" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                          <span className={cn(
                            isItemActive(item) && "font-semibold"
                          )}>{item.title}</span>
                          {isItemActive(item) && (
                            <motion.div
                              layoutId="activeNav"
                              className={sidebarActiveRailClass}
                              transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </motion.div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator className={sidebarSeparatorClass} />

          <SidebarGroup className="px-2 flex-1 overflow-hidden">
            <SidebarGroupLabel className={sidebarLabelClass}>
              播放列表
            </SidebarGroupLabel>
            <SidebarGroupContent className="overflow-y-auto max-h-[calc(100vh-420px)] scrollbar-thin scrollbar-thumb-black/10 scrollbar-track-transparent hover:scrollbar-thumb-black/20 dark:scrollbar-thumb-white/10 dark:hover:scrollbar-thumb-white/20 transition-colors duration-300">
              <SidebarMenu className="gap-1">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="relative"
                >
                  {favPlaylist ? (
                    <SidebarMenuButton
                      className={sidebarItemClass(isFavPlaylistActive)}
                      asChild
                      isActive={isFavPlaylistActive}
                    >
                      <Link to={favPlaylistUrl}>
                        <AnimatePresence mode="wait">
                          {isFavPlaylistActive ? (
                            <motion.div
                              key="active"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Heart20Filled className={sidebarActiveIconClass} />
                            </motion.div>
                          ) : (
                            <motion.div
                              key="inactive"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              transition={{ duration: 0.15 }}
                            >
                              <Heart20Regular className="size-5" />
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <span className="font-semibold">我喜欢的音乐</span>
                        {isFavPlaylistActive && (
                          <motion.div
                            layoutId="activeNavFav"
                            className={sidebarActiveRailClass}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      disabled
                      className={cn(sidebarItemClass(false), "opacity-50")}
                    >
                      <Heart20Regular className="size-5" />
                      <span className="font-semibold">我喜欢的音乐</span>
                    </SidebarMenuButton>
                  )}
                </motion.div>

                <Collapsible defaultOpen className="group/collapsible py-1">
                  <SidebarMenuItem key={"歌单"}>
                    <CollapsibleTrigger asChild>
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                      >
                        <SidebarMenuButton className={sidebarSubtleButtonClass}>
                          <List20Regular />
                          <span>歌单</span>
                          <ChevronRight24Regular className="size-4! ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </motion.div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub className="gap-1 pl-2 mt-1 border-l border-[var(--sidebar-divider)]">
                        <SidebarMenuItem>
                          <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: 0.15 }}
                          >
                            <SidebarMenuButton
                              className={cn("cursor-pointer", sidebarSubtleButtonClass)}
                              onClick={() => {
                                if (!user) {
                                  setIsLoginOpen(true);
                                  return;
                                }
                                setIsPlaylistAddOpen(true);
                              }}
                            >
                              <div className="flex items-center gap-2">
                                <div className="size-6 relative rounded-sm overflow-hidden shrink-0 flex items-center justify-center bg-[var(--sidebar-item-hover-bg)]">
                                  <Add20Regular className="size-4!" />
                                </div>
                                <span className="text-sm">
                                  新建歌单
                                </span>
                              </div>
                            </SidebarMenuButton>
                          </motion.div>
                        </SidebarMenuItem>

                        {createdPlaylists.map((playlist) => (
                          <SidebarMenuItem key={playlist.id}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="relative"
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isPlaylistActive(playlist)}
                                className={sidebarItemClass(isPlaylistActive(playlist))}
                              >
                                <Link to={`/detail/playlist?id=${playlist.id}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="size-6 relative rounded overflow-hidden shrink-0">
                                      <img
                                        src={playlist.coverImgUrl}
                                        alt={`${playlist.name} 歌单封面`}
                                        className="size-6"
                                      />
                                    </div>
                                    <span className="line-clamp-1">{playlist.name}</span>
                                  </div>
                                  {isPlaylistActive(playlist) && (
                                    <motion.div
                                      layoutId="activeNavPlaylist"
                                      className={sidebarActiveRailClass}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                        {subscribedPlaylists.map((playlist) => (
                          <SidebarMenuItem key={playlist.id}>
                            <motion.div
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              transition={{ duration: 0.15 }}
                              className="relative"
                            >
                              <SidebarMenuButton
                                asChild
                                isActive={isPlaylistActive(playlist)}
                                className={sidebarItemClass(isPlaylistActive(playlist))}
                              >
                                <Link to={`/detail/playlist?id=${playlist.id}`}>
                                  <div className="flex items-center gap-2">
                                    <div className="size-6 relative rounded overflow-hidden shrink-0">
                                      <img
                                        src={playlist.coverImgUrl}
                                        alt={`${playlist.name} 歌单封面`}
                                        className="size-6"
                                      />
                                    </div>
                                    <span className="line-clamp-1">
                                      {playlist.name}
                                    </span>
                                  </div>
                                  {isPlaylistActive(playlist) && (
                                    <motion.div
                                      layoutId="activeNavPlaylist"
                                      className={sidebarActiveRailClass}
                                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                  )}
                                </Link>
                              </SidebarMenuButton>
                            </motion.div>
                          </SidebarMenuItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="bg-transparent dark:bg-transparent border-t border-[var(--sidebar-divider)]">
          <SidebarMenu className="gap-1 px-2 py-2">
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <SidebarMenuButton className={cn("cursor-pointer", sidebarSubtleButtonClass)}>
                      <Avatar className="size-6 -ml-0.5 ring-2 ring-[var(--sidebar-divider)]">
                        <AvatarImage src={user?.avatarUrl} alt="1sen" />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10">
                          <Person20Regular />
                        </AvatarFallback>
                      </Avatar>
                      <span className="ml-1 font-medium">{user?.nickname || "未登录"}</span>
                    </SidebarMenuButton>
                  </motion.div>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" className="h-auto min-w-[180px] shadow-xl rounded-xl">
                  {!user && (
                    <DropdownMenuItem
                      onClick={() => setIsLoginOpen(true)}
                      className="cursor-pointer"
                    >
                      <LogIn className="size-4 mr-2" />
                      登录
                    </DropdownMenuItem>
                  )}

                  {!!user && (
                    <>
                      <DropdownMenuItem
                        onClick={() => navigate("/profile")}
                        className="cursor-pointer"
                      >
                        <PersonEdit20Regular className="size-4 mr-2" />
                        个人信息
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="bg-[var(--component-divider)]" />

                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setIsLogoutOpen(true)}
                        className="cursor-pointer"
                      >
                        <SignOut20Regular className="size-4 mr-2" />
                        退出登录
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="relative"
              >
                <SidebarMenuButton
                  asChild
                  isActive={pathName === "/setting"}
                  className={sidebarItemClass(pathName === "/setting")}
                >
                  <Link to={"/setting"}>
                    <Settings20Regular />
                    <span>设置</span>
                    {pathName === "/setting" && (
                      <motion.div
                        layoutId="activeNavSettings"
                        className={sidebarActiveRailClass}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </Link>
                </SidebarMenuButton>
              </motion.div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <LoginForm open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      <LogoutForm open={isLogoutOpen} onOpenChange={setIsLogoutOpen} />
      <PlaylistAddForm
        open={isPlaylistAddOpen}
        onOpenChange={setIsPlaylistAddOpen}
      />
    </>
  );
}
