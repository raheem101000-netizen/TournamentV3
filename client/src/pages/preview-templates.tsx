import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, ArrowLeft, CheckCircle2, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocation } from "wouter";
import type { PosterTemplate } from "@shared/schema";

const mockTemplates = [
  {
    id: "1",
    name: "Neon Strike",
    description: "Bold neon aesthetic perfect for competitive FPS tournaments",
    backgroundImageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop",
    category: "Valorant",
    tags: ["Neon", "Dark", "Competitive"],
  },
  {
    id: "2",
    name: "Epic Fantasy",
    description: "Mystical and dramatic for MOBA championships",
    backgroundImageUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=1200&fit=crop",
    category: "League of Legends",
    tags: ["Fantasy", "Epic", "Dark"],
  },
  {
    id: "3",
    name: "Urban Warfare",
    description: "Gritty tactical shooter aesthetic",
    backgroundImageUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=1200&fit=crop",
    category: "CS:GO",
    tags: ["Dark", "Tactical", "Urban"],
  },
  {
    id: "4",
    name: "Battle Royale",
    description: "High-octane action for battle royale games",
    backgroundImageUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&h=1200&fit=crop",
    category: "Apex Legends",
    tags: ["Action", "Vibrant", "Dynamic"],
  },
  {
    id: "5",
    name: "Cyber Void",
    description: "Futuristic cyberpunk design for modern esports",
    backgroundImageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=800&h=1200&fit=crop",
    category: "Valorant",
    tags: ["Cyberpunk", "Futuristic", "Neon"],
  },
  {
    id: "6",
    name: "Championship Gold",
    description: "Premium gold accents for prestigious tournaments",
    backgroundImageUrl: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&h=1200&fit=crop",
    category: "League of Legends",
    tags: ["Premium", "Gold", "Elegant"],
  },
];

export default function PreviewTemplates() {
  const [, setLocation] = useLocation();
  const [selectedTemplate, setSelectedTemplate] = useState<typeof mockTemplates[0] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const { data: templates, isLoading, isError } = useQuery<PosterTemplate[]>({
    queryKey: ['/api/poster-templates'],
  });

  const templateCards = (templates || [])
    .filter(t => t.isActive)
    .map(t => ({
      id: t.id,
      name: t.name,
      description: t.description || "No description",
      backgroundImageUrl: t.backgroundImageUrl || "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop",
      category: t.category || "General",
      tags: [], // Will be populated when we add tags support
    }));

  const allTemplates = templateCards.length > 0 ? templateCards : mockTemplates;
  const categories = ["All", ...Array.from(new Set(allTemplates.map(t => t.category)))];

  const filteredTemplates = selectedCategory === "All" 
    ? allTemplates 
    : allTemplates.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: typeof mockTemplates[0]) => {
    // In production, this would navigate to tournament creation with template pre-selected
    // For now, close the modal to show the selection worked
    setSelectedTemplate(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost"
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Poster Templates</h1>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9"
              data-testid="input-search-templates"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                className="whitespace-nowrap text-xs px-3 cursor-pointer"
                onClick={() => setSelectedCategory(category)}
                data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">
        <div className="container max-w-3xl mx-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading templates...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load templates</p>
              <p className="text-sm text-muted-foreground mt-2">Please try again later</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {filteredTemplates.map((template) => (
                  <Card
                    key={template.id}
                    className="overflow-hidden cursor-pointer hover-elevate"
                    onClick={() => setSelectedTemplate(template)}
                    data-testid={`template-card-${template.id}`}
                  >
                    <div className="relative aspect-[3/4]">
                      <img
                        src={template.backgroundImageUrl}
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 text-white">
                        <h3 className="font-bold text-xs sm:text-sm mb-1 leading-tight">
                          {template.name}
                        </h3>
                        <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white text-xs px-2 py-0.5">
                          {template.category}
                        </Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No templates found in this category</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <BottomNavigation />

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription>{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                <img
                  src={selectedTemplate.backgroundImageUrl}
                  alt={selectedTemplate.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
                <div className="absolute inset-0 flex flex-col justify-between text-center text-white px-4 py-6">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-white/80 tracking-wider uppercase">
                      Your Server
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-black mb-2 drop-shadow-2xl leading-tight">
                        Your Tournament Title
                      </h2>
                      <div className="text-sm font-semibold text-white/90">
                        {selectedTemplate.category}
                      </div>
                    </div>
                    <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white text-xs px-3 py-1">
                      Preview Mode
                    </Badge>
                  </div>
                  
                  <div className="h-10" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Category:</span>
                  <Badge variant="outline" className="text-xs">{selectedTemplate.category}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedTemplate(null)}
              data-testid="button-cancel-template"
            >
              Cancel
            </Button>
            <Button
              onClick={() => selectedTemplate && handleSelectTemplate(selectedTemplate)}
              data-testid="button-select-template"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
