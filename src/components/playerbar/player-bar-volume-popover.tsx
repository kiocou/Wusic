import {
  Speaker116Regular,
  Speaker216Regular,
  SpeakerMute16Regular,
} from "@fluentui/react-icons";
import { YeeButton } from "../yee-button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { usePlayerStore } from "@/lib/store/playerStore";
import { useEffect, useRef } from "react";

export function PlayerBarVolumePopover() {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);
  const lastNonZeroVolumeRef = useRef(volume > 0 ? volume : 0.7);

  useEffect(() => {
    if (volume > 0) lastNonZeroVolumeRef.current = volume;
  }, [volume]);

  const VolumeButton =
    volume === 0
      ? SpeakerMute16Regular
      : volume < 0.5
        ? Speaker116Regular
        : Speaker216Regular;
  const volumePercent = Math.round(volume * 100);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <YeeButton
          variant="ghost"
          icon={<VolumeButton className="size-4" />}
          aria-label={`音量 ${volumePercent}%`}
          title={`音量 ${volumePercent}%`}
        />
      </PopoverTrigger>
      <PopoverContent
        side="top"
        sideOffset={32}
        className="w-56 rounded-lg mr-2 p-4"
      >
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md text-foreground/70 hover:bg-foreground/8 hover:text-foreground"
            onClick={() =>
              updateVolume(volume === 0 ? lastNonZeroVolumeRef.current : 0)
            }
            aria-label={volume === 0 ? "取消静音" : "静音"}
            title={volume === 0 ? "取消静音" : "静音"}
          >
            <VolumeButton className="size-4" />
          </button>
          <Slider
            value={[volume]}
            onValueChange={(value) => updateVolume(value[0])}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="w-6 text-right text-foreground/80 text-xs select-none">
            {volumePercent}
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
