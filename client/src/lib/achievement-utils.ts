import { Trophy, Medal, Award, Target, Shield, Zap, Star, Users } from "lucide-react";

export function getAchievementIcon(iconUrl: string | null | undefined, title?: string) {
  const iconMap: { [key: string]: any } = {
    "champion": Trophy,
    "runner-up": Medal,
    "third-place": Medal,
    "mvp": Award,
    "top-scorer": Target,
    "best-defense": Shield,
    "rising-star": Zap,
    "verified-star": Star,
    "team-victory": Users,
    "top-performer": Award
  };

  // Try direct match
  if (iconUrl && iconMap[iconUrl]) return iconMap[iconUrl];

  // Try matching by title
  if (title) {
    const normalizeTitle = title.toLowerCase().replace(/\s+/g, '-');
    if (iconMap[normalizeTitle]) return iconMap[normalizeTitle];

    // Partial matches
    if (normalizeTitle.includes('champion') || normalizeTitle.includes('winner')) return Trophy;
    if (normalizeTitle.includes('runner') || normalizeTitle.includes('second')) return Medal;
    if (normalizeTitle.includes('mvp')) return Star;
  }

  return Trophy;
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
    "verified-star": "text-blue-500",
  };
  return colorMap[iconUrl] || "text-muted-foreground";
}
