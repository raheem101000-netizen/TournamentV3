import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FolderOpen } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ChannelCategory } from "@shared/schema";

interface ManageCategoriesDialogProps {
  serverId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ManageCategoriesDialog({ serverId, open, onOpenChange }: ManageCategoriesDialogProps) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery<ChannelCategory[]>({
    queryKey: [`/api/servers/${serverId}/categories`],
    enabled: !!serverId && open,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", `/api/servers/${serverId}/categories`, {
        name,
        serverId,
        position: categories.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/categories`] });
      setNewCategoryName("");
      toast({
        title: "Category created",
        description: "Channel category has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      return await apiRequest("DELETE", `/api/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/categories`] });
      queryClient.invalidateQueries({ queryKey: [`/api/servers/${serverId}/channels`] });
      toast({
        title: "Category deleted",
        description: "Channel category has been deleted. Channels have been moved to uncategorized.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!newCategoryName.trim()) return;
    createMutation.mutate(newCategoryName.trim());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" data-testid="dialog-manage-categories">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Manage Categories
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Create new category */}
          <div className="space-y-2">
            <Label htmlFor="category-name">New Category</Label>
            <div className="flex gap-2">
              <Input
                id="category-name"
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCreate();
                  }
                }}
                data-testid="input-category-name"
              />
              <Button
                onClick={handleCreate}
                disabled={!newCategoryName.trim() || createMutation.isPending}
                data-testid="button-create-category"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Existing categories */}
          <div className="space-y-2">
            <Label>Existing Categories</Label>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">No categories yet. Create one above!</p>
            ) : (
              <div className="space-y-2">
                {categories
                  .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                  .map((category) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-3 rounded-md border"
                      data-testid={`category-item-${category.id}`}
                    >
                      <span className="font-medium">{category.name}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(category.id)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-category-${category.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
