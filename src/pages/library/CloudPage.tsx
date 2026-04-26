import { StatePanel } from "@/components/ui/state-panel";

export default function CloudPage() {
  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      <StatePanel
        title="云盘暂未接入"
        description="入口已保留，后续接入云盘接口后会展示云盘音乐、上传状态和播放入口。"
      />
    </div>
  );
}
