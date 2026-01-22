import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Users, Calendar, ArrowLeft, Copy, Check, Crown, Medal, Award, Target, Shield, Zap, Star } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { TeamProfile, Achievement } from "@shared/schema";

interface TeamProfileWithCaptain extends TeamProfile {
    captain: {
        id: string;
        username: string;
        displayName: string | null;
        avatarUrl: string | null;
    } | null;
    members: {
        id: string;
        role: string | null;
        position: string | null;
        user: {
            id: string;
            username: string;
            displayName: string | null;
            avatarUrl: string | null;
        } | null;
    }[];
}

// Icon mapping for achievements
const achievementIcons: Record<string, any> = {
    champion: Trophy,
    "runner-up": Medal,
    "third-place": Medal,
    mvp: Award,
    "top-scorer": Target,
    "best-defense": Shield,
    "rising-star": Zap,
};

const achievementColors: Record<string, string> = {
    champion: "text-amber-500",
    "runner-up": "text-slate-300",
    "third-place": "text-amber-700",
    mvp: "text-purple-500",
    "top-scorer": "text-red-500",
    "best-defense": "text-green-500",
    "rising-star": "text-yellow-500",
};

export default function TeamProfilePage() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    // Fetch team profile with captain and members
    const { data: teamData, isLoading: isLoadingTeam } = useQuery<TeamProfileWithCaptain>({
        queryKey: [`/api/team-profiles/${id}/full`],
        enabled: !!id,
    });

    // Fetch team achievements
    const { data: achievements = [], isLoading: isLoadingAchievements } = useQuery<Achievement[]>({
        queryKey: [`/api/team-profiles/${id}/achievements`],
        enabled: !!id,
    });

    const handleCopyProfileId = () => {
        if (teamData?.profileId) {
            navigator.clipboard.writeText(teamData.profileId);
            setCopied(true);
            toast({
                title: "Copied!",
                description: "Profile ID copied to clipboard",
            });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoadingTeam) {
        return (
            <MobileLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </MobileLayout>
        );
    }

    if (!teamData) {
        return (
            <MobileLayout>
                <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                    <p className="text-muted-foreground">Team not found</p>
                    <Button variant="outline" onClick={() => setLocation("/")}>
                        Go Home
                    </Button>
                </div>
            </MobileLayout>
        );
    }

    return (
        <MobileLayout>
            <div className="min-h-screen pb-20">
                {/* Header */}
                <div className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
                    <div className="container max-w-lg mx-auto px-4 py-3">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(-1 as any)}
                            className="mb-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                </div>

                <div className="container max-w-lg mx-auto px-4 py-6 space-y-6">
                    {/* Team Header Card */}
                    <Card className="overflow-hidden">
                        <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-6">
                            <div className="flex items-center gap-4">
                                {/* Team Logo */}
                                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                                    <AvatarImage src={teamData.logoUrl || undefined} alt={teamData.name} />
                                    <AvatarFallback className="text-2xl font-bold bg-primary/20">
                                        {teamData.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold">{teamData.name}</h1>
                                    {teamData.tag && (
                                        <p className="text-muted-foreground">[{teamData.tag}]</p>
                                    )}

                                    {/* Profile ID - Prominent and Copyable */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <Badge variant="secondary" className="font-mono text-sm px-3 py-1">
                                            {teamData.profileId || "No ID"}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={handleCopyProfileId}
                                            disabled={!teamData.profileId}
                                        >
                                            {copied ? (
                                                <Check className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <Copy className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Captain Info */}
                            {teamData.captain && (
                                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-border/50">
                                    <Crown className="h-4 w-4 text-amber-500" />
                                    <span className="text-sm text-muted-foreground">Captain:</span>
                                    <Avatar className="w-6 h-6">
                                        <AvatarImage src={teamData.captain.avatarUrl || undefined} />
                                        <AvatarFallback className="text-xs">
                                            {teamData.captain.username?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">@{teamData.captain.username}</span>
                                </div>
                            )}
                        </div>

                        {/* Team Stats */}
                        <CardContent className="py-4">
                            <div className="flex justify-around text-center">
                                <div>
                                    <p className="text-2xl font-bold">{teamData.totalWins || 0}</p>
                                    <p className="text-xs text-muted-foreground">Wins</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{teamData.totalTournaments || 0}</p>
                                    <p className="text-xs text-muted-foreground">Tournaments</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{teamData.totalMembers || 0}</p>
                                    <p className="text-xs text-muted-foreground">Members</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Bio */}
                    {teamData.bio && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base">About</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{teamData.bio}</p>
                            </CardContent>
                        </Card>
                    )}

                    {/* Trophy Case */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-500" />
                                Trophy Case
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isLoadingAchievements ? (
                                <p className="text-sm text-muted-foreground text-center py-4">Loading achievements...</p>
                            ) : achievements.length === 0 ? (
                                <div className="text-center py-8">
                                    <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                                    <p className="text-sm text-muted-foreground">No achievements yet</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Share your Profile ID ({teamData.profileId}) with organizers to receive team awards
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {achievements.map((achievement) => {
                                        const IconComponent = achievementIcons[achievement.category || ""] || Star;
                                        const colorClass = achievementColors[achievement.category || ""] || "text-primary";

                                        return (
                                            <Card key={achievement.id} className="p-3 bg-accent/30">
                                                <div className="flex items-start gap-3">
                                                    <div className={`p-2 rounded-full bg-background ${colorClass}`}>
                                                        <IconComponent className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate">{achievement.title}</p>
                                                        {achievement.game && (
                                                            <p className="text-xs text-muted-foreground truncate">{achievement.game}</p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground">
                                                            {new Date(achievement.achievedAt).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Team Roster */}
                    {teamData.members && teamData.members.length > 0 && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Roster ({teamData.members.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {teamData.members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <Avatar className="w-10 h-10">
                                                <AvatarImage src={member.user?.avatarUrl || undefined} />
                                                <AvatarFallback>
                                                    {member.user?.username?.charAt(0) || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <p className="font-medium">@{member.user?.username || "Unknown"}</p>
                                                <div className="flex items-center gap-2">
                                                    {member.role && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {member.role}
                                                        </Badge>
                                                    )}
                                                    {member.position && (
                                                        <span className="text-xs text-muted-foreground">{member.position}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {member.user?.id === teamData.captain?.id && (
                                                <Crown className="h-4 w-4 text-amber-500" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </MobileLayout>
    );
}
