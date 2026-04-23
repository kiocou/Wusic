import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { PlayerBar } from "@/components/playerbar/playerbar";
import { Toaster } from "@/components/ui/sonner";
import { AuthConfig } from "@/components/providers/auth-provider";
import { Titlebar } from "@/components/titlebar/titlebar";
import { TitlebarProvider } from "@/contexts/titlebar-context";
import { cn } from "@/lib/utils";
import { GlobalContextMenu } from "@/components/context-menu/global-context-menu";
import { AnimatePresence, motion } from "framer-motion";
import { useMiniModeStore } from "@/hooks/useMiniMode";
import { MiniPlayer } from "@/components/mini-player/MiniPlayer";

// Apple Music 风格的页面过渡配置
const pageTransition = {
  initial: { opacity: 0, y: 8, filter: "blur(4px)" },
  animate: { 
    opacity: 1, 
    y: 0, 
    filter: "blur(0px)",
    transition: { type: "tween" as const, ease: [0.32, 0.72, 0, 1] as [number, number, number, number], duration: 0.35 }
  },
  exit: { 
    opacity: 0, 
    filter: "blur(4px)",
    transition: { duration: 0.2 }
  },
};

export default function RootLayout() {
  const location = useLocation();
  const isMiniMode = useMiniModeStore((s) => s.isMiniMode);

  return (
    <div
      className={cn(
        "font-sans antialiased h-screen w-screen flex flex-col overflow-hidden select-none",
        isMiniMode ? "bg-transparent" : "bg-background"
      )}
    >
      <AnimatePresence mode="wait">
        {isMiniMode ? (
          <motion.div
            key="mini-mode"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[9999]"
          >
            <MiniPlayer />
          </motion.div>
        ) : (
          <motion.div
            key="main-mode"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col flex-1 w-full min-h-0"
          >
            <AuthConfig />
            <TitlebarProvider>
              <SidebarProvider className="flex w-full flex-1 flex-col overflow-hidden min-h-0!">
                <div className="w-full shrink-0 z-50">
                  <Suspense>
                    <Titlebar />
                  </Suspense>
                </div>

                <div className="flex-1 w-full overflow-hidden flex relative">
                  <Suspense fallback={null}>
                    <AppSidebar />
                  </Suspense>

                  <div
                    id="main-wrapper"
                    className="relative flex flex-col flex-1 overflow-hidden bg-transparent rounded-tl-2xl"
                  >
                    <main
                      id="main-scroll-container"
                      className="flex-1 w-full min-h-0 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30 transition-colors duration-300"
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                    >
                      <div className="w-full min-h-full flex flex-col">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={location.pathname}
                            variants={pageTransition}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="w-full min-h-full flex flex-col"
                          >
                            <Outlet />
                          </motion.div>
                        </AnimatePresence>
                      </div>

                      <Toaster
                        containerAriaLabel="Notifications"
                        className="absolute"
                        style={{ position: "absolute" }}
                      />
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </TitlebarProvider>
            <GlobalContextMenu />
            <div className="w-full z-40">
              <PlayerBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
