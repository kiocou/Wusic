import { Loading } from "@/components/loading";
import { StatePanel } from "@/components/ui/state-panel";
import { motion } from "framer-motion";

interface DetailPageSkeletonProps<T> {
  loading: boolean;
  data: T | null;
  children: (data: T) => React.ReactNode;
}

export function DetailPageSkeleton<T>({
  loading,
  data,
  children,
}: DetailPageSkeletonProps<T>) {
  return (
    <div className="w-full h-full flex flex-col">
      {loading && <Loading />}
      {!loading && !data && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          <StatePanel
            title="未找到相关内容"
            description="可能是网络暂时不可用，或该内容已经失效。"
            className="mx-8"
          />
        </motion.div>
      )}
      {data && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        >
          {children(data)}
        </motion.div>
      )}
    </div>
  );
}
