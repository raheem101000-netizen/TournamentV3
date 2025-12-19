import { Trophy, Medal, Award, Target, Shield, Zap } from "lucide-react";

export function getAchievementIcon(iconUrl: string) {
  const iconMap: { [key: string]: any } = {
    "champion": Trophy,
    "runner-up": Medal,
    "third-place": Medal,
    "mvp": Award,
    "top-scorer": Target,
    "best-defense": Shield,
    "rising-star": Zap,
  };
  return iconMap[iconUrl] || Trophy;
}

export function getAchievementColor(iconUrl: string) {
  const colorMap: { [key: string]: string } = {
    "champion": "text-amber-500",
    "runner-up": "text-slate-300",
    "third-place": "text-amber-700",
    "mvp": "text-purple-500",
    "top-scorer": "text-red-500",
    "best-defense": "text-green-500",
    "rising-star": "text-yellow-500",
  };
  return colorMap[iconUrl] || "text-muted-foreground";
}
