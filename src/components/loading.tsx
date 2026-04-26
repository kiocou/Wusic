import { Spinner } from "./ui/spinner";
import { motion } from "framer-motion";

export function Loading() {
  return (
    <motion.div 
      className="w-full min-h-full px-8 py-8 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="flex gap-2 items-center"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      >
        <Spinner className="size-6" />
        <span>加载中...</span>
      </motion.div>
    </motion.div>
  );
}
