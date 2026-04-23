import type { Transition } from "framer-motion";

export const springShared = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.9,
} satisfies Transition;

export const springApple = {
  type: "spring",
  stiffness: 350,
  damping: 35,
  mass: 0.8,
} satisfies Transition;

export const smoothLinear = {
  type: "tween",
  ease: [0.32, 0.72, 0, 1],
  duration: 0.5,
} satisfies Transition;

export const microSpring = {
  type: "spring",
  stiffness: 520,
  damping: 32,
  mass: 0.72,
} satisfies Transition;

export const themeMorphSpring = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.86,
} satisfies Transition;

export const PLAYER_LAYOUT_IDS = {
  artwork: "yee-player-artwork",
  artworkApple: "yee-player-artwork-apple",
  artworkVinyl: "yee-player-artwork-vinyl",
  title: "yee-player-title",
  artist: "yee-player-artist",
  playToggle: "yee-player-play-toggle",
} as const;

export const pressableMotion = {
  whileTap: { scale: 0.9 },
  whileHover: { scale: 1.05 },
  transition: microSpring,
} as const;

export const playbackThemeVariants = {
  initial: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? 26 : -18,
    scale: direction > 0 ? 0.94 : 1.04,
    filter: direction > 0 ? "blur(18px)" : "blur(10px)",
  }),
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    y: direction > 0 ? -18 : 28,
    scale: direction > 0 ? 1.04 : 0.92,
    filter: direction > 0 ? "blur(10px)" : "blur(18px)",
  }),
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: (index = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      ...smoothLinear,
      delay: Math.min(index, 18) * 0.028,
    },
  }),
};
