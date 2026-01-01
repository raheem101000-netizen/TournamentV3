import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Upload, Trophy, Coins, Calendar, Users, Image as ImageIcon } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ImageEditor } from "@/components/ImageEditor";

const mockServer = {
  name: "ProGaming League",
  logo: "🎮",
};

const defaultPoster = {
  backgroundImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop",
  title: "Summer Championship 2024",
  game: "Valorant",
  prize: "$5,000",
  entryFee: "$25",
  startDate: "Dec 20, 2024",
  maxParticipants: "128",
};

export default function PreviewPosterBuilder() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [imageEditorOpen, setImageEditorOpen] = useState(false);
  const [posterData, setPosterData] = useState({
    title: defaultPoster.title,
    game: defaultPoster.game,
    backgroundImage: defaultPoster.backgroundImage,
    prize: defaultPoster.prize,
    entryFee: defaultPoster.entryFee,
    description: "",
  });

  const handleImageSave = (imageUrl: string) => {
    setPosterData(prev => ({ ...prev, backgroundImage: imageUrl }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const templateData = {
        name: posterData.title,
        imageUrl: posterData.backgroundImage,
        category: "tournament",
        isActive: 1,
      };
      const res = await apiRequest('POST', '/api/poster-templates', templateData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Poster template saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/poster-templates"] });
      setLocation("/templates");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save poster",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              data-testid="button-back"
              onClick={() => setLocation("/")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Create Tournament Poster</h1>
          </div>
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700" 
            data-testid="button-post"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Post"}
          </Button>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-4 space-y-6">
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">Poster Preview</Label>
            <Card className="overflow-hidden">
              <div className="relative h-64">
                <img
                  src={posterData.backgroundImage}
                  alt="Poster background"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Avatar className="w-8 h-8 border-2 border-white/20">
                    <AvatarFallback className="text-lg">{mockServer.logo}</AvatarFallback>
                  </Avatar>
                  <div className="text-white text-sm font-medium drop-shadow-lg">
                    {mockServer.name}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <h3 className="text-2xl font-bold mb-1 drop-shadow-lg">
                    {posterData.title}
                  </h3>
                  <p className="text-sm text-white/90 drop-shadow-lg mb-3">
                    {posterData.game}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-semibold">{defaultPoster.prize}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-semibold">{defaultPoster.entryFee}</span>
                      </div>
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-sm border border-white/30 text-white">
                      0/{defaultPoster.maxParticipants}
                    </Badge>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-3 right-3 bg-black/20 backdrop-blur-sm border border-white/20 text-white hover:bg-black/40"
                  onClick={() => setImageEditorOpen(true)}
                  data-testid="button-upload-background"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Change
                </Button>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tournament Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tournament Title</Label>
                <Input
                  id="title"
                  placeholder="Enter tournament name..."
                  defaultValue={defaultPoster.title}
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="game">Game</Label>
                <Input
                  id="game"
                  placeholder="e.g., Valorant, CS:GO, League of Legends"
                  defaultValue={defaultPoster.game}
                  data-testid="input-game"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prize">Prize Pool</Label>
                  <div className="relative">
                    <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="prize"
                      placeholder="$0"
                      className="pl-9"
                      defaultValue={defaultPoster.prize}
                      data-testid="input-prize"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entry-fee">Entry Fee</Label>
                  <div className="relative">
                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="entry-fee"
                      placeholder="Free or $0"
                      className="pl-9"
                      defaultValue={defaultPoster.entryFee}
                      data-testid="input-entry-fee"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="start-date"
                      type="date"
                      className="pl-9"
                      data-testid="input-start-date"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-participants">Max Players</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="max-participants"
                      type="number"
                      placeholder="128"
                      className="pl-9"
                      defaultValue={defaultPoster.maxParticipants}
                      data-testid="input-max-participants"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add tournament rules, format, or additional information..."
                  rows={4}
                  data-testid="textarea-description"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publishing Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Server Tournament Channel</p>
                  <p className="text-xs text-muted-foreground">
                    Poster will be published to your server's tournament channel
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">Public Homepage</p>
                  <p className="text-xs text-muted-foreground">
                    Poster will appear on the main tournament discovery page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button className="w-full h-12 bg-green-600 hover:bg-green-700 text-base font-semibold" data-testid="button-publish">
            Publish Tournament
          </Button>
        </div>
      </main>

      <ImageEditor
        open={imageEditorOpen}
        onOpenChange={setImageEditorOpen}
        onSave={handleImageSave}
        initialImage={posterData.backgroundImage}
      />

      <BottomNavigation />
    </div>
  );
}
