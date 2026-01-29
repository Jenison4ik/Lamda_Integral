import { hapticFeedback } from "@tma.js/sdk-react";

interface UseHapticProps {
  type?: "light" | "medium" | "heavy" | "rigid" | "soft" | "none";
}

export default function useHaptic() {
  const hapticTrigger = (type: UseHapticProps["type"] = "none") => {
    if (type !== "none" && hapticFeedback.isSupported()) {
      hapticFeedback.impactOccurred(type);
    }
  };

  return { hapticTrigger };
}
