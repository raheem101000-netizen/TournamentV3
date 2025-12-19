import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLocation } from "wouter";

interface Template {
  id: string;
  name: string;
  description: string;
  backgroundImageUrl: string;
  category: string;
  tags: string[];
  isActive: boolean;
}

const mockTemplates: Template[] = [
  {
    id: "1",
    name: "Neon Strike",
    description: "Bold neon aesthetic perfect for competitive FPS tournaments",
    backgroundImageUrl: "https://images.unsplash.com/photo-1542751110-97427bbecf20?w=800&h=1200&fit=crop",
    category: "Valorant",
    tags: ["Neon", "Dark", "Competitive"],
    isActive: true,
  },
  {
    id: "2",
    name: "Epic Fantasy",
    description: "Mystical and dramatic for MOBA championships",
    backgroundImageUrl: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?w=800&h=1200&fit=crop",
    category: "League of Legends",
    tags: ["Fantasy", "Epic", "Dark"],
    isActive: true,
  },
  {
    id: "3",
    name: "Urban Warfare",
    description: "Gritty tactical shooter aesthetic",
    backgroundImageUrl: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&h=1200&fit=crop",
    category: "CS:GO",
    tags: ["Dark", "Tactical", "Urban"],
    isActive: false,
  },
];

export default function PreviewAdminTemplates() {
  const [, setLocation] = useLocation();
  const [templates, setTemplates] = useState<Template[]>(mockTemplates);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    backgroundImageUrl: "",
    category: "",
    tags: "",
  });

  const handleCreateNew = () => {
    setFormData({
      name: "",
      description: "",
      backgroundImageUrl: "",
      category: "",
      tags: "",
    });
    setIsCreating(true);
  };

  const handleEdit = (template: Template) => {
    setFormData({
      name: template.name,
      description: template.description,
      backgroundImageUrl: template.backgroundImageUrl,
      category: template.category,
      tags: template.tags.join(", "),
    });
    setEditingTemplate(template);
  };

  const handleSave = () => {
    const tagsArray = formData.tags.split(",").map(t => t.trim()).filter(Boolean);
    
    if (isCreating) {
      const newTemplate: Template = {
        id: String(templates.length + 1),
        name: formData.name,
        description: formData.description,
        backgroundImageUrl: formData.backgroundImageUrl,
        category: formData.category,
        tags: tagsArray,
        isActive: true,
      };
      setTemplates([...templates, newTemplate]);
      setIsCreating(false);
    } else if (editingTemplate) {
      setTemplates(templates.map(t => 
        t.id === editingTemplate.id 
          ? { ...t, ...formData, tags: tagsArray }
          : t
      ));
      setEditingTemplate(null);
    }
  };

  const handleToggleActive = (id: string) => {
    setTemplates(templates.map(t => 
      t.id === id ? { ...t, isActive: !t.isActive } : t
    ));
  };

  const handleDelete = (id: string) => {
    setTemplates(templates.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const closeDialog = () => {
    setIsCreating(false);
    setEditingTemplate(null);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setLocation("/")}
                data-testid="button-back"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Manage Templates</h1>
            </div>
            <Button
              onClick={handleCreateNew}
              data-testid="button-create-template"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Template
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6">
        <div className="container max-w-2xl mx-auto space-y-4">
          {templates.map((template) => (
            <Card key={template.id} data-testid={`template-item-${template.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      {!template.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleToggleActive(template.id)}
                      data-testid={`button-toggle-${template.id}`}
                    >
                      {template.isActive ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleEdit(template)}
                      data-testid={`button-edit-${template.id}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setDeleteConfirm(template.id)}
                      data-testid={`button-delete-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-[120px_1fr] gap-4">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                    <img
                      src={template.backgroundImageUrl}
                      alt={template.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Category</p>
                      <Badge variant="outline" className="text-xs mt-1">{template.category}</Badge>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tags</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {template.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No templates yet</p>
              <Button onClick={handleCreateNew}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Template
              </Button>
            </div>
          )}
        </div>
      </main>

      <Dialog open={isCreating || !!editingTemplate} onOpenChange={closeDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Create New Template" : "Edit Template"}
            </DialogTitle>
            <DialogDescription>
              {isCreating 
                ? "Add a new poster template for organizers to use" 
                : "Update template information"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Neon Strike"
                data-testid="input-template-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the template style..."
                rows={3}
                data-testid="input-template-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundImageUrl">Background Image URL</Label>
              <Input
                id="backgroundImageUrl"
                value={formData.backgroundImageUrl}
                onChange={(e) => setFormData({ ...formData, backgroundImageUrl: e.target.value })}
                placeholder="https://..."
                data-testid="input-template-image-url"
              />
              {formData.backgroundImageUrl && (
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden mt-2">
                  <img
                    src={formData.backgroundImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category (Game)</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Valorant, League of Legends"
                data-testid="input-template-category"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="e.g., Neon, Dark, Competitive"
                data-testid="input-template-tags"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} data-testid="button-cancel">
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!formData.name || !formData.backgroundImageUrl || !formData.category}
              data-testid="button-save-template"
            >
              {isCreating ? "Create Template" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this template. Organizers will no longer be able to use it for new tournaments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
