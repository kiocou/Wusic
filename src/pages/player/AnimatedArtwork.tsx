import { cn } from "@/lib/utils";
import { smoothLinear, springShared } from "@/styles/animations";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

export function AnimatedArtwork({
  src,
  alt,
  layoutId,
  className,
  imageClassName,
  placeholderClassName,
}: {
  src: string;
  alt: string;
  layoutId?: string;
  className?: string;
  imageClassName?: string;
  placeholderClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    if (imgRef.current?.complete) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <motion.div
      layoutId={layoutId}
      transition={springShared}
      className={cn(
        "relative overflow-hidden bg-white/10 transform-gpu will-change-transform",
        className,
      )}
    >
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="artwork-skeleton"
            initial={{ opacity: 0.55 }}
            animate={{ opacity: [0.36, 0.72, 0.36] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
            className={cn(
              "absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.22),rgba(255,255,255,0.06),rgba(255,255,255,0.18))]",
              placeholderClassName,
            )}
          />
        )}
      </AnimatePresence>

      {src ? (
        <motion.img
          ref={imgRef}
          key={src}
          src={src}
          alt={alt}
          draggable={false}
          loading="eager"
          decoding="async"
          onLoad={() => setLoaded(true)}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: loaded ? 1 : 0, scale: loaded ? 1 : 1.05 }}
          transition={smoothLinear}
          className={cn(
            "h-full w-full object-cover transform-gpu will-change-transform",
            imageClassName,
          )}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl font-black text-white/40">
          ♪
        </div>
      )}
    </motion.div>
  );
}
