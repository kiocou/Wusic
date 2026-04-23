import {
  useSettingStore,
  type AppearanceSettings,
} from "@/lib/store/settingStore";
import SettingsExpandar, {
  SettingsExpandarDetail,
} from "@/components/settings/SettingsExpandar";
import { Button } from "@/components/ui/button";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QUALITY_BY_KEY, QUALITY_LIST } from "@/lib/constants/song";
import {
  ArrowDownload20Regular,
  CheckmarkCircle24Filled,
  CheckmarkStarburst20Regular,
  Checkmark24Regular,
  ChevronDown24Regular,
  Color20Regular,
  Info20Regular,
  Speaker220Regular,
  TextFont20Regular,
  Water20Regular,
  Window20Regular,
  Settings20Regular,
} from "@fluentui/react-icons";
import { IconBrandGithub } from "@tabler/icons-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { Update, check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Input } from "@/components/ui/input";
import { useDownloadStore } from "@/lib/store/downloadStore";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Popover, PopoverItem } from "@/components/yee-popover";

import { Play20Regular, Desktop20Regular } from "@fluentui/react-icons";

export default function SettingPage() {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">常规设置</h2>
        <div className="flex flex-col gap-2">
          <AppearanceSettingCard />
          <FontSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">播放与下载</h2>
        <div className="flex flex-col gap-2">
          <AudioSettingCard />
          <PlaybackSettingCard />
          <DownloadSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">高级与性能</h2>
        <div className="flex flex-col gap-2">
          <PerformanceSettingCard />
          <SystemSettingCard />
        </div>
      </div>

      <div className="w-full h-full flex flex-col gap-4">
        <h2 className="text-sm font-bold">关于</h2>
        <div className="flex flex-col gap-2">
          <SettingsExpandar
            title="Wusic"
            subtitle="更好用的网易云音乐客户端"
            icon={
              <img
                src={"/icons/logo.png"}
                className="object-cover"
                alt="Wusic"
              />
            }
          >
            <div className="flex flex-col gap-0">
              <SettingsExpandarDetail desc="作者：isen" />
              <SettingsExpandarDetail
                desc="问题反馈"
                trailing={
                  <IconBrandGithub
                    className="size-4 hover:text-muted-foreground text-foreground cursor-pointer"
                    onClick={async () =>
                      await openUrl("https://github.com/kiocou/Wusic")
                    }
                  />
                }
              />
            </div>
          </SettingsExpandar>
          <UpdateSettingCard />
        </div>
      </div>
    </div>
  );
}

function PlaybackSettingCard() {
  const playback = useSettingStore((s) => s.playback);
  const updatePlayback = useSettingStore((s) => s.updatePlayback);

  return (
    <SettingsExpandar
      icon={<Play20Regular />}
      title="播放控制"
      subtitle="音乐播放行为设置"
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail
          desc="启动时自动播放"
          trailing={
            <ToggleSwitch
              checked={playback.autoPlay}
              onCheckedChange={(checked) =>
                updatePlayback({ autoPlay: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc="音频淡入淡出"
          trailing={
            <ToggleSwitch
              checked={playback.crossfade}
              onCheckedChange={(checked) =>
                updatePlayback({ crossfade: checked })
              }
            />
          }
        />
        {playback.crossfade && (
          <SettingsExpandarDetail desc="淡入淡出时长 (秒)">
            <Input
              type="number"
              className="w-20 bg-card"
              value={playback.crossfadeDuration}
              min={1}
              max={10}
              step={1}
              onChange={(e) => updatePlayback({ crossfadeDuration: Number(e.target.value) })}
            />
          </SettingsExpandarDetail>
        )}
      </div>
    </SettingsExpandar>
  );
}

function SystemSettingCard() {
  const system = useSettingStore((s) => s.system);
  const updateSystem = useSettingStore((s) => s.updateSystem);

  return (
    <SettingsExpandar
      icon={<Desktop20Regular />}
      title="系统级功能"
      subtitle="桌面歌词、托盘等系统行为设置"
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail
          desc="关闭主面板时隐藏到系统托盘"
          trailing={
            <ToggleSwitch
              checked={system.closeToTray}
              onCheckedChange={(checked) =>
                updateSystem({ closeToTray: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc={
            <div className="flex items-center gap-2">
              <span>显示桌面歌词</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">实验性</span>
            </div>
          }
          trailing={
            <ToggleSwitch
              checked={system.showDesktopLyric}
              onCheckedChange={(checked) =>
                updateSystem({ showDesktopLyric: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc={
            <div className="flex items-center gap-2">
              <span>启用 Discord 状态展示 (RPC)</span>
              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">实验性</span>
            </div>
          }
          trailing={
            <ToggleSwitch
              checked={system.enableDiscordRPC}
              onCheckedChange={(checked) =>
                updateSystem({ enableDiscordRPC: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc="侧边栏自动折叠"
          trailing={
            <ToggleSwitch
              checked={system.autoCollapseSidebar}
              onCheckedChange={(checked) =>
                updateSystem({ autoCollapseSidebar: checked })
              }
            />
          }
        />
      </div>
    </SettingsExpandar>
  );
}

function AudioSettingCard() {
  const preferQuality = useSettingStore((s) => s.audio.preferQuality);
  const setPreferQuality = useSettingStore((s) => s.setPreferQuality);

  return (
    <div className="flex flex-col gap-1">
      <SettingsExpandar
        title="音频质量"
        subtitle="选择优先播放的音质"
        icon={<Speaker220Regular />}
        trailing={
          <Popover
            trigger={
              <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0">
                <span>{QUALITY_BY_KEY[preferQuality].desc}</span>
                <ChevronDown24Regular />
              </Button>
            }
            className="-left-2"
          >
            {QUALITY_LIST.filter((q) => q.desc !== "UNLOCK").map((q) => (
              <PopoverItem
                key={q.key}
                isActive={preferQuality === q.key}
                onClick={() => setPreferQuality(q.key)}
              >
                {q.desc}
              </PopoverItem>
            ))}
          </Popover>
        }
      ></SettingsExpandar>
    </div>
  );
}

function DownloadSettingCard() {
  const downloadDir = useDownloadStore((s) => s.downloadDir);
  const setDownloadDir = useDownloadStore((s) => s.setDownloadDir);
  const loadFromStore = useDownloadStore((s) => s.loadFromStore);

  useEffect(() => {
    loadFromStore();
  }, []);

  async function handleChangeDir() {
    try {
      const selected = await open({
        directory: true,
        title: "选择下载目录",
      });
      if (!selected) return;
      await invoke("ensure_dir_exists", { path: selected });
      await setDownloadDir(selected as string);
    } catch (e) {
      console.error("更改下载目录失败:", e);
      toast.error(`更改目录失败：${e}`);
    }
  }

  return (
    <SettingsExpandar
      title="下载"
      subtitle="选择歌曲下载的目录"
      icon={<ArrowDownload20Regular />}
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail>
          <div className="w-full flex justify-between items-center">
            <span className="text-sm text-muted-foreground truncate max-w-xs">
              {downloadDir || "加载中..."}
            </span>
            <Button
              className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0"
              onClick={handleChangeDir}
            >
              更改目录
            </Button>
          </div>
        </SettingsExpandarDetail>
      </div>
    </SettingsExpandar>
  );
}

function AppearanceSettingCard() {
  const theme = useSettingStore((s) => s.appearance.theme);
  const setTheme = useSettingStore((s) => s.setTheme);
  const material = useSettingStore((s) => s.appearance.material);
  const setMaterial = useSettingStore((s) => s.setMaterial);

  const themeStr =
    theme === "system" ? "跟随系统" : theme === "light" ? "浅色" : "深色";

  return (
    <div className="flex flex-col gap-2">
      <SettingsExpandar
        title="主题"
        subtitle="选择 Yee Music 的显示主题"
        icon={<Color20Regular />}
        trailing={
          <span className="text-muted-foreground text-sm">{themeStr}</span>
        }
      >
        <div className="flex flex-col gap-0">
          <SettingsExpandarDetail>
            <div className="w-full flex flex-col items-start">
              <RadioGroup
                defaultValue={theme}
                onValueChange={(val) =>
                  setTheme(val as AppearanceSettings["theme"])
                }
              >
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="light" />
                  <span>浅色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="dark" />
                  <span>深色</span>
                </div>
                <div className="flex gap-2 items-center">
                  <RadioGroupItem value="system" />
                  <span>跟随系统</span>
                </div>
              </RadioGroup>
            </div>
          </SettingsExpandarDetail>
        </div>
      </SettingsExpandar>

      <SettingsExpandar
        title="窗口材质"
        subtitle="选择窗口视觉效果"
        icon={<Window20Regular />}
        trailing={
          <div className="flex justify-end">
            <Popover
              trigger={
                <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0">
                  <span>
                    {material === "acrylic" ? "毛玻璃" : material === "mica" ? "云母" : "透明"}
                  </span>
                  <ChevronDown24Regular />
                </Button>
              }
            >
              <PopoverItem
                key="acrylic"
                isActive={material === "acrylic"}
                onClick={() => setMaterial("acrylic")}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">毛玻璃</span>
                  <span className="text-xs text-muted-foreground">半透明模糊效果，类似磨砂玻璃</span>
                </div>
              </PopoverItem>
              <PopoverItem
                key="mica"
                isActive={material === "mica"}
                onClick={() => setMaterial("mica")}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">云母</span>
                  <span className="text-xs text-muted-foreground">晶莹剔透，Windows 11 默认材质</span>
                </div>
              </PopoverItem>
              <PopoverItem
                key="none"
                isActive={material === "none"}
                onClick={() => setMaterial("none")}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">透明</span>
                  <span className="text-xs text-muted-foreground">完全透明，无材质效果</span>
                </div>
              </PopoverItem>
            </Popover>
          </div>
        }
      ></SettingsExpandar>
    </div>
  );
}



function PerformanceSettingCard() {
  const performanceSettings = useSettingStore((s) => s.appearance.performance);
  const updatePerformance = useSettingStore((s) => s.updatePerformance);

  const [fluidIntensity, setFluidIntensity] = useState(
    performanceSettings.fluidBackgroundIntensity,
  );

  useEffect(() => {
    setFluidIntensity(performanceSettings.fluidBackgroundIntensity);
  }, [performanceSettings.fluidBackgroundIntensity]);

  return (
    <SettingsExpandar
      icon={<Settings20Regular />}
      title="性能与动画"
      subtitle="配置 GPU 加速与动画效果"
    >
      <div className="flex flex-col gap-0">
        <SettingsExpandarDetail
          desc="GPU 硬件加速"
          trailing={
            <ToggleSwitch
              checked={performanceSettings.gpuAcceleration}
              onCheckedChange={(checked) =>
                updatePerformance({ gpuAcceleration: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc="动态硬件加速"
          trailing={
            <ToggleSwitch
              checked={performanceSettings.hardwareAcceleration}
              onCheckedChange={(checked) =>
                updatePerformance({ hardwareAcceleration: checked })
              }
            />
          }
        />
        <SettingsExpandarDetail
          desc="流体背景动画"
          trailing={
            <ToggleSwitch
              checked={performanceSettings.fluidBackground}
              onCheckedChange={(checked) =>
                updatePerformance({ fluidBackground: checked })
              }
            />
          }
        />
        {performanceSettings.fluidBackground && (
          <SettingsExpandarDetail desc="流体强度">
            <Input
              type="number"
              className="w-20 bg-card"
              value={fluidIntensity}
              min={0}
              max={1}
              step={0.1}
              onChange={(e) => setFluidIntensity(Number(e.target.value))}
              onBlur={() => {
                let val = fluidIntensity;
                if (isNaN(val)) val = 0.8;
                val = Math.min(Math.max(val, 0), 1);
                setFluidIntensity(val);
                updatePerformance({ fluidBackgroundIntensity: val });
              }}
            />
          </SettingsExpandarDetail>
        )}
      </div>
    </SettingsExpandar>
  );
}

function ToggleSwitch({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function FontSettingCard() {
  const fontSettings = useSettingStore((s) => s.appearance.font);
  const updateFont = useSettingStore((s) => s.updateFont);

  const [fonts, setFonts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 获取系统字体列表
  useEffect(() => {
    async function fetchFonts() {
      try {
        // 检查是否在 Tauri 环境中
        const isTauri = "__TAURI__" in window;
        if (isTauri) {
          const systemFonts = await invoke<string[]>("get_system_fonts");
          setFonts(systemFonts);
        } else {
          // 非 Tauri 环境（如 Vite dev）使用预设字体
          setFonts([
            "Microsoft YaHei",
            "微软雅黑",
            "PingFang SC",
            "SimSun",
            "宋体",
            "SimHei",
            "黑体",
            "Arial",
            "Helvetica",
            "Segoe UI",
            "Microsoft YaHei UI",
            "Microsoft JhengHei",
            "苹方",
            "思源黑体",
            "Noto Sans SC",
          ]);
        }
      } catch (error) {
        console.error("Failed to get system fonts:", error);
        // 回退到常见字体
        setFonts([
          "Microsoft YaHei",
          "微软雅黑",
          "PingFang SC",
          "SimSun",
          "宋体",
          "SimHei",
          "黑体",
          "Arial",
          "Helvetica",
          "Segoe UI",
          "Microsoft YaHei UI",
          "Microsoft JhengHei",
        ]);
      } finally {
        setLoading(false);
      }
    }
    fetchFonts();
  }, []);

  // 过滤字体
  const filteredFonts = searchTerm
    ? fonts.filter((f) => f.toLowerCase().includes(searchTerm.toLowerCase()))
    : fonts;

  // 字体选择组件
  function FontSelector({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (font: string) => void;
    label: string;
  }) {
    return (
      <Popover
        trigger={
          <Button className="cursor-pointer bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2 shrink-0 min-w-[180px] justify-between gap-2">
            <span className={value ? "" : "text-muted-foreground"}>
              {value || `选择${label}`}
            </span>
            <ChevronDown24Regular />
          </Button>
        }
      >
        <div className="w-64 max-h-80 flex flex-col">
          {/* 搜索框 */}
          <div className="px-2 pb-2">
            <Input
              className="w-full bg-background/50 h-8 text-sm"
              placeholder="搜索字体..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* 字体列表 */}
          <div className="max-h-60 overflow-y-auto flex-1">
            {loading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                加载字体中...
              </div>
            ) : filteredFonts.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground">
                未找到字体
              </div>
            ) : (
              filteredFonts.map((font) => (
                <PopoverItem
                  key={font}
                  isActive={value === font}
                  onClick={() => {
                    onChange(font);
                    setSearchTerm("");
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span style={{ fontFamily: font }}>{font}</span>
                    {value === font && (
                      <Checkmark24Regular className="w-4 h-4 text-primary shrink-0" />
                    )}
                  </div>
                </PopoverItem>
              ))
            )}
          </div>
        </div>
      </Popover>
    );
  }

  return (
    <SettingsExpandar
      icon={<TextFont20Regular />}
      title="字体"
      subtitle="配置 Yee Music 的字体"
    >
      <SettingsExpandarDetail desc="界面字体">
        <FontSelector
          value={fontSettings.interfaceFontStr}
          onChange={(font) => updateFont({ interfaceFontStr: font })}
          label="界面字体"
        />
      </SettingsExpandarDetail>
      <SettingsExpandarDetail desc="歌词字体">
        <FontSelector
          value={fontSettings.lyricFontStr}
          onChange={(font) => updateFont({ lyricFontStr: font })}
          label="歌词字体"
        />
      </SettingsExpandarDetail>
    </SettingsExpandar>
  );
}

function UpdateSettingCard() {
  const [version, setVersion] = useState("");
  const [checking, setChecking] = useState(false);
  const [isNewest, setIsNewest] = useState<boolean | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateObj, setUpdateObj] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{
    downloaded: number;
    contentLength: number;
  } | null>(null);

  async function checkForUpdates() {
    const update = await check();
    if (update) {
      console.log(`found update ${update.version}`);
      setUpdateObj(update);
      setIsNewest(false);
      toast.success(`发现新版本 v${update.version}！`, { duration: 3000 });
    } else {
      setUpdateObj(null);
      setIsNewest(true);
    }
  }

  async function handleUpdate() {
    if (!updateObj) return;

    setIsUpdating(true);

    let downloaded = 0;
    let contentLength = 0;

    try {
      await updateObj.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || 0;
            console.log(`started downloading ${contentLength} bytes`);
            setProgress({ downloaded, contentLength });
            break;
          case "Progress":
            downloaded += event.data.chunkLength || 0;
            console.log(`downloaded ${downloaded} from ${contentLength}`);
            setProgress({ downloaded, contentLength });
            break;
          case "Finished":
            console.log("download finished");
            break;
        }
      });

      console.log("update installed");
      toast.success("更新下载完成，即将重启并挂载更新...", { duration: 3000 });
      setTimeout(async () => {
        await relaunch();
      }, 3000);
    } catch (e) {
      console.log(`failed to install update: ${e}`);
      toast.error("更新失败，请稍后重试...");
    } finally {
      setIsUpdating(false);
      setProgress(null);
    }
  }

  async function handleCheck() {
    setChecking(true);
    setIsNewest(null);
    try {
      await checkForUpdates();
    } catch (e) {
      console.log(`failed to check update: ${e}`);
      toast.error("检查更新失败，请重试...");
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    async function loadVersion() {
      const v = await getVersion();
      setVersion(v);
    }

    loadVersion();
  }, []);

  return (
    <div className="flex flex-col gap-0">
      <SettingsExpandar
        className={cn(isNewest !== null && "rounded-b-none")}
        title={`Beta ${version}`}
        icon={<CheckmarkStarburst20Regular />}
        trailing={
          <div className="flex justify-end">
            <Button
              className={cn(
                "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                checking && "bg-muted",
              )}
              onClick={handleCheck}
              disabled={checking || isUpdating}
            >
              <div className="flex gap-2 transition-[width] duration-300 ease-in-out">
                <Spinner
                  className={cn(
                    "transition-all duration-300 -mx-2.5",
                    checking
                      ? "opacity-100 scale-100 mx-0"
                      : "opacity-0 scale-75",
                  )}
                />
                <span>{checking ? "检查中..." : "检查更新"}</span>
              </div>
            </Button>
          </div>
        }
      ></SettingsExpandar>
      {isNewest === true && (
        <div className="bg-green-400/25 rounded-b-md border-t-0 border border-border p-4 flex items-center gap-2 text-sm">
          <CheckmarkCircle24Filled className="text-green-600" />
          已更新到最新版本
        </div>
      )}
      {isNewest === false && updateObj && (
        <div className="bg-card/60 rounded-b-md border-t-0 border border-border p-4 flex flex-col gap-4 text-sm">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-4">
              <Info20Regular className="text-foreground" />
              检测到新版本 v{updateObj.version}，是否立即更新？
            </div>

            <div className="flex items-center gap-4">
              <Button
                className={cn(
                  "bg-card text-foreground border-border hover:bg-foreground/2 rounded-sm border-b-2",
                )}
                onClick={handleUpdate}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    <span>
                      {progress && progress.contentLength > 0
                        ? `正在下载 (${((progress.downloaded / progress.contentLength) * 100).toFixed(0)}%)`
                        : "正在更新..."}
                    </span>
                  </div>
                ) : (
                  "立即更新"
                )}
              </Button>
            </div>
          </div>
          {isUpdating && progress && progress.contentLength > 0 && (
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{
                  width: `${(progress.downloaded / progress.contentLength) * 100}%`,
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
