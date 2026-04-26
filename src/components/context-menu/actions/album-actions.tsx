import { Album24Regular } from "@fluentui/react-icons";
import { ContextMenuButton } from "../context-menu-button";
import { ActionProps } from "./action";
import { useNavigate } from "react-router-dom";
import { useContextMenuStore } from "@/lib/store/contextMenuStore";

export function AlbumActions({ type, data }: ActionProps) {
  const { closeMenu } = useContextMenuStore();
  const navigate = useNavigate();
  const albumId = data?.id ?? data?.resourceId;

  if ((type !== "album" && data?.resourceType !== "album") || !albumId) {
    return null;
  }

  return (
    <>
      <ContextMenuButton
        id="album-info"
        icon={<Album24Regular className="size-4" />}
        content="查看专辑"
        onClick={(e) => {
          e.stopPropagation();

          closeMenu();
          navigate(`/detail/album?id=${albumId}`);
        }}
      />
    </>
  );
}
