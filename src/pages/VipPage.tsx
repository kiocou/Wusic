import { useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/userStore";
import { getAccountDetails } from "@/lib/services/user";
import { Account } from "@/lib/types";
import { Loading } from "@/components/loading";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { GetThumbnail } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatePanel } from "@/components/ui/state-panel";
import { toast } from "sonner";

export default function VipPage() {
  const user = useUserStore((state) => state.user);
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // 获取账户详情
        const accountRes = await getAccountDetails();
        setAccount(accountRes.account);
      } catch (err) {
        console.error("获取账户信息失败:", err);
        setError("获取账户信息失败");
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [user]);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
        <StatePanel
          title="请先登录"
          description="登录后可以查看会员状态和账户权益。"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
        <StatePanel title="获取会员信息失败" description={error} />
      </div>
    );
  }

  const getVipTypeText = (vipType: number) => {
    switch (vipType) {
      case 0:
        return "非会员";
      case 10:
        return "音乐包";
      case 11:
        return "黑胶VIP";
      default:
        return "未知";
    }
  };

  const getVipStatusText = (vipType: number) => {
    return vipType === 0 ? "未开通" : "已开通";
  };

  const getVipColor = (vipType: number) => {
    switch (vipType) {
      case 0:
        return "text-muted-foreground";
      case 10:
        return "text-blue-400";
      case 11:
        return "text-purple-400";
      default:
        return "text-muted-foreground";
    }
  };

  const handleOpenVip = (plan: string) => {
    toast.info(`${plan} 开通入口暂未接入，已保留展示状态。`, {
      position: "top-center",
    });
  };

  return (
    <div className="w-full h-full px-8 py-8 flex flex-col gap-8">
      {/* 会员信息头部 */}
      <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
        <Avatar className="h-20 w-20 border-4 border-primary">
          <AvatarImage src={GetThumbnail(user.avatarUrl, 200)} alt={user.nickname} />
          <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
        </Avatar>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold">{user.nickname}</h1>
          <div className={`text-lg font-semibold ${getVipColor(account?.vipType || 0)}`}>
            {getVipTypeText(account?.vipType || 0)}
          </div>
          <div className="text-sm text-muted-foreground">
            会员状态: {getVipStatusText(account?.vipType || 0)}
          </div>
        </div>
      </div>

      {/* 会员权益 */}
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-6">会员权益</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 音乐包权益 */}
          <div className="bg-accent/30 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4 text-blue-400">音乐包权益</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                <span>无损音质下载</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                <span>付费歌曲畅听</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400"></div>
                <span>每月赠送下载额度</span>
              </li>
            </ul>
          </div>

          {/* 黑胶VIP权益 */}
          <div className="bg-accent/30 rounded-lg p-5">
            <h3 className="text-lg font-semibold mb-4 text-purple-400">黑胶VIP权益</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span>所有音乐包权益</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span>专属皮肤和动效</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span>演唱会优先购票</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span>会员专属客服</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 开通会员 */}
      <div className="bg-card rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">开通会员</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors duration-300">
            <h3 className="font-semibold mb-2">音乐包</h3>
            <p className="text-lg font-bold mb-4">¥8/月</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenVip("音乐包")}
            >
              立即开通
            </Button>
          </div>
          <div className="border border-primary rounded-lg p-4 bg-primary/5 hover:bg-primary/10 transition-colors duration-300">
            <h3 className="font-semibold mb-2">黑胶VIP</h3>
            <p className="text-lg font-bold mb-4">¥18/月</p>
            <Button
              className="w-full"
              onClick={() => handleOpenVip("黑胶VIP")}
            >
              立即开通
            </Button>
          </div>
          <div className="border border-border rounded-lg p-4 hover:border-primary transition-colors duration-300">
            <h3 className="font-semibold mb-2">黑胶VIP年卡</h3>
            <p className="text-lg font-bold mb-4">¥188/年</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleOpenVip("黑胶VIP年卡")}
            >
              立即开通
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
