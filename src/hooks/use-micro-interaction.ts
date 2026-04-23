import { pressableMotion } from "@/styles/animations";

export function useMicroInteraction(disabled = false) {
  if (disabled) {
    return {
      whileTap: undefined,
      whileHover: undefined,
      transition: pressableMotion.transition,
    };
  }

  return pressableMotion;
}
