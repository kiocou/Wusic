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

// Apple Music 风格的页面过渡配置：只动 transform/opacity，避免页面切换触发布局抖动。
const pageTransition = {
  initial: { opacity: 0, y: 10, scale: 0.995 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 360,
      damping: 34,
      mass: 0.9,
    },
  },
  exit: {
    opacity: 0,
    y: -6,
    scale: 0.998,
    transition: { duration: 0.18 },
  },
};

export default function RootLayout() {
  const location = useLocation();

  return (
    <div
      className={cn(
        "font-sans antialiased h-screen w-screen flex flex-col overflow-hidden select-none",
        "bg-background"
      )}
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
              className="relative flex flex-col flex-1 overflow-hidden border-l transition-[background,border-color,box-shadow,backdrop-filter] duration-300"
              style={{
                background: "var(--content-surface)",
                borderLeftColor: "var(--content-surface-border)",
                boxShadow: "var(--content-surface-shadow)",
                backdropFilter: "var(--content-surface-filter)",
                WebkitBackdropFilter: "var(--content-surface-filter)",
              }}
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
                      key={`${location.pathname}${location.search}`}
                      variants={pageTransition}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="w-full min-h-full flex flex-col transform-gpu will-change-transform"
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
    </div>
  );
}
