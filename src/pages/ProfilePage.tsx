import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { getAccountDetails, getUserSubcount } from "@/lib/services/user";
import { Account } from "@/lib/types";
import { Loading } from "@/components/loading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GetThumbnail } from "@/lib/utils";
import { StatePanel } from "@/components/ui/state-panel";

function formatAccountCreateTime(createTime?: number) {
  if (!createTime) return "未知";

  const timestamp = createTime < 1_000_000_000_000 ? createTime * 1000 : createTime;
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "未知";

  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export default function ProfilePage() {
  const user = useUserStore((state) => state.user);
  const [account, setAccount] = useState<Account | null>(null);
  const [subcount, setSubcount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 获取账户详情
        const accountRes = await getAccountDetails();
        setAccount(accountRes.account);

        // 获取用户统计信息
        const subcountRes = await getUserSubcount();
        setSubcount(subcountRes);
      } catch (err) {
        console.error("获取用户信息失败:", err);
        setError("获取用户信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
        <StatePanel
          title="请先登录"
          description="登录后可以查看个人资料、听歌统计和账户信息。"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
        <StatePanel title="获取个人信息失败" description={error} />
      </div>
    );
  }

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      {/* 个人信息头部 */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <Avatar className="h-24 w-24 border-4 border-primary">
          <AvatarImage src={GetThumbnail(user.avatarUrl, 200)} alt={user.nickname} />
          <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-3">
          <h1 className="text-2xl font-bold">{user.nickname}</h1>
          {user.signature && (
            <p className="text-muted-foreground">{user.signature}</p>
          )}
          <div className="flex gap-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount?.follows || 0}</span>
              <span className="text-sm text-muted-foreground">关注</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount?.followeds || 0}</span>
              <span className="text-sm text-muted-foreground">粉丝</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount?.createdPlaylistCount || 0}</span>
              <span className="text-sm text-muted-foreground">歌单</span>
            </div>
          </div>
        </div>
      </div>

      {/* 账户信息 */}
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">账户信息</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">用户ID</p>
            <p>{user.userId}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">用户名</p>
            <p>{account?.userName || "未知"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">会员类型</p>
            <p>
              {account?.vipType === 0 && "非会员"}
              {account?.vipType === 10 && "音乐包"}
              {account?.vipType === 11 && "黑胶VIP"}
              {account?.vipType !== 0 && account?.vipType !== 10 && account?.vipType !== 11 && "未知"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">注册时间</p>
            <p>{formatAccountCreateTime(account?.createTime)}</p>
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      {subcount && (
        <div className="bg-card rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">我的音乐</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-accent/30 rounded-lg p-4 flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount.listenSongs || 0}</span>
              <span className="text-sm text-muted-foreground">听歌数</span>
            </div>
            <div className="bg-accent/30 rounded-lg p-4 flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount.createdPlaylistCount || 0}</span>
              <span className="text-sm text-muted-foreground">创建歌单</span>
            </div>
            <div className="bg-accent/30 rounded-lg p-4 flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount.subPlaylistCount || 0}</span>
              <span className="text-sm text-muted-foreground">收藏歌单</span>
            </div>
            <div className="bg-accent/30 rounded-lg p-4 flex flex-col items-center">
              <span className="text-lg font-semibold">{subcount.artistCount || 0}</span>
              <span className="text-sm text-muted-foreground">关注歌手</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
