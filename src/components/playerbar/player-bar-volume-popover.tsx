import {
  Speaker124Regular,
  Speaker224Regular,
  SpeakerMute24Regular,
} from "@fluentui/react-icons";
import { YeeButton } from "../yee-button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";
import { usePlayerStore } from "@/lib/store/playerStore";

export function PlayerBarVolumePopover() {
  const volume = usePlayerStore((s) => s.volume);
  const updateVolume = usePlayerStore((s) => s.updateVolume);

  const VolumeButton =
    volume === 0
      ? SpeakerMute24Regular
      : volume < 0.5
        ? Speaker124Regular
        : Speaker224Regular;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <YeeButton variant="ghost" icon={<VolumeButton className="size-5" />} />
      </PopoverTrigger>
      <PopoverContent side="top" sideOffset={32} className="w-48 rounded-lg">
        <div className="flex gap-2 items-center">
          <VolumeButton className="size-4" />
          <Slider
            value={[volume]}
            onValueChange={(value) => updateVolume(value[0])}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="w-8 text-right text-foreground/80">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
