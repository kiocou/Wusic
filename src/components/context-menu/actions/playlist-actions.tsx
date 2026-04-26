import { Album24Regular } from "@fluentui/react-icons";
import { ContextMenuButton } from "../context-menu-button";
import { ActionProps } from "./action";
import { useNavigate } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";

export function PlaylistActions({ type, data }: ActionProps) {
  const { closeMenu } = useContextMenuStore();
  const navigate = useNavigate();
  const playlistId = data?.id ?? data?.resourceId;

  if ((type !== "list" && data?.resourceType !== "list") || !playlistId) {
    return null;
  }

  return (
    <>
      <ContextMenuButton
        id="playlist-info"
        icon={<Album24Regular className="size-4" />}
        content="查看歌单"
        onClick={(e) => {
          e.stopPropagation();

          closeMenu();
          navigate(`/detail/playlist?id=${playlistId}`);
        }}
      />
    </>
  );
}
