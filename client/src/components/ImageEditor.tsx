import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, ZoomOut, Maximize2, AlignCenter, Upload, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (imageUrl: string) => void;
  initialImage?: string;
}

export function ImageEditor({ open, onOpenChange, onSave, initialImage }: ImageEditorProps) {
  const [imageUrl, setImageUrl] = useState(initialImage || "");
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState<"cover" | "contain" | "fill">("cover");
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const { toast } = useToast();
  const pendingObjectPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialImage) {
      setImageUrl(initialImage);
    }
  }, [initialImage]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageUrl(event.target?.result as string);
        setZoom(100);
        setPosition({ x: 50, y: 50 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;

    const deltaX = (e.clientX - dragStart.current.x) / 2;
    const deltaY = (e.clientY - dragStart.current.y) / 2;

    setPosition((prev) => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX)),
      y: Math.max(0, Math.min(100, prev.y + deltaY)),
    }));

    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleSave = async () => {
    if (!imageUrl) return;
    
    setIsSaving(true);
    try {
      // Create canvas to render the edited image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Set canvas dimensions (16:9 aspect ratio for posters)
      const canvasWidth = 800;
      const canvasHeight = 450;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Calculate scaling and positioning to match the preview
      const zoomFactor = zoom / 100;

      if (fitMode === 'cover') {
        // Cover mode: image fills canvas, may be cropped
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const baseScale = Math.max(scaleX, scaleY);
        const scale = baseScale * zoomFactor;

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Calculate the excess (how much larger the scaled image is than canvas)
        const excessWidth = scaledWidth - canvasWidth;
        const excessHeight = scaledHeight - canvasHeight;

        // Position based on position settings (0-100 maps to the excess)
        const offsetX = -excessWidth * (position.x / 100);
        const offsetY = -excessHeight * (position.y / 100);

        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      } else if (fitMode === 'contain') {
        // Contain mode: entire image visible, may have letterboxing
        const scaleX = canvasWidth / img.width;
        const scaleY = canvasHeight / img.height;
        const baseScale = Math.min(scaleX, scaleY);
        const scale = baseScale * zoomFactor;

        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;

        // Center the image (or offset based on position if zoomed)
        const excessWidth = scaledWidth - canvasWidth;
        const excessHeight = scaledHeight - canvasHeight;
        
        let offsetX = (canvasWidth - scaledWidth) / 2;
        let offsetY = (canvasHeight - scaledHeight) / 2;

        // If zoomed in, apply position offsets to the excess
        if (zoomFactor > 1) {
          offsetX = -excessWidth * (position.x / 100);
          offsetY = -excessHeight * (position.y / 100);
        }

        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      } else if (fitMode === 'fill') {
        // Fill mode: stretch to fill canvas
        // With zoom, we crop from the source image based on position
        if (zoomFactor === 1) {
          // No zoom: stretch entire image to canvas
          ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        } else {
          // With zoom: crop from source image based on position settings
          const sourceWidth = img.width / zoomFactor;
          const sourceHeight = img.height / zoomFactor;
          
          // Calculate the excess that can be cropped (how much we can move)
          const excessWidth = img.width - sourceWidth;
          const excessHeight = img.height - sourceHeight;
          
          // Position the crop based on position settings (0-100 maps to the excess)
          const sourceX = excessWidth * (position.x / 100);
          const sourceY = excessHeight * (position.y / 100);
          
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvasWidth, canvasHeight
          );
        }
      }

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Failed to create blob'));
        }, 'image/jpeg', 0.9);
      });

      // Get upload URL and object path
      const uploadResponse = await apiRequest("POST", "/api/objects/upload");
      const uploadData = await uploadResponse.json();
      
      // Store the object path
      const objectPath = uploadData.objectPath;
      pendingObjectPathRef.current = objectPath;

      // Upload the blob to the presigned URL
      await fetch(uploadData.uploadURL, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      // Normalize the path using the object path
      const normalizeResponse = await apiRequest("POST", "/api/objects/normalize", {
        objectPath: objectPath,
      });
      const normalizeData = await normalizeResponse.json();

      // Save the new image path
      onSave(normalizeData.objectPath);
      onOpenChange(false);
      
      toast({
        title: "Image saved",
        description: "Your edited image has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving edited image:', error);
      
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save edited image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setImageUrl(initialImage || "");
    setZoom(100);
    setPosition({ x: 50, y: 50 });
    setFitMode("cover");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Tournament Poster Image</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imageUrl ? (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
              <Upload className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Upload an image to get started
              </p>
              <Button
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-upload-image"
              >
                Choose Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-upload"
              />
            </div>
          ) : (
            <>
              <div
                className="relative h-64 border rounded-lg overflow-hidden bg-muted cursor-move"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                data-testid="image-preview-container"
              >
                <img
                  src={imageUrl}
                  alt="Preview"
                  className={cn(
                    "absolute transition-transform",
                    fitMode === "cover" && "w-full h-full object-cover",
                    fitMode === "contain" && "w-full h-full object-contain",
                    fitMode === "fill" && "w-full h-full object-fill"
                  )}
                  style={{
                    transform: `scale(${zoom / 100})`,
                    objectPosition: `${position.x}% ${position.y}%`,
                  }}
                  draggable={false}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-change-image"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change Image
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Zoom</Label>
                    <span className="text-xs text-muted-foreground">{zoom}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => setZoom(Math.max(50, zoom - 10))}
                      data-testid="button-zoom-out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Slider
                      value={[zoom]}
                      onValueChange={(value) => setZoom(value[0])}
                      min={50}
                      max={200}
                      step={5}
                      className="flex-1"
                      data-testid="slider-zoom"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 flex-shrink-0"
                      onClick={() => setZoom(Math.min(200, zoom + 10))}
                      data-testid="button-zoom-in"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Fit Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={fitMode === "cover" ? "default" : "outline"}
                      onClick={() => setFitMode("cover")}
                      className="flex-1"
                      data-testid="button-fit-cover"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Cover
                    </Button>
                    <Button
                      size="sm"
                      variant={fitMode === "contain" ? "default" : "outline"}
                      onClick={() => setFitMode("contain")}
                      className="flex-1"
                      data-testid="button-fit-contain"
                    >
                      <AlignCenter className="w-4 h-4 mr-2" />
                      Contain
                    </Button>
                    <Button
                      size="sm"
                      variant={fitMode === "fill" ? "default" : "outline"}
                      onClick={() => setFitMode("fill")}
                      className="flex-1"
                      data-testid="button-fit-fill"
                    >
                      Fill
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {fitMode === "cover" && "Image fills entire area, may crop edges"}
                    {fitMode === "contain" && "Entire image visible, may show borders"}
                    {fitMode === "fill" && "Image stretched to fill area"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Position</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 0, y: 0 })}
                      data-testid="button-position-tl"
                    >
                      Top Left
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 50, y: 0 })}
                      data-testid="button-position-tc"
                    >
                      Top Center
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 100, y: 0 })}
                      data-testid="button-position-tr"
                    >
                      Top Right
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 0, y: 50 })}
                      data-testid="button-position-ml"
                    >
                      Middle Left
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 50, y: 50 })}
                      data-testid="button-position-mc"
                    >
                      Center
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 100, y: 50 })}
                      data-testid="button-position-mr"
                    >
                      Middle Right
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 0, y: 100 })}
                      data-testid="button-position-bl"
                    >
                      Bottom Left
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 50, y: 100 })}
                      data-testid="button-position-bc"
                    >
                      Bottom Center
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPosition({ x: 100, y: 100 })}
                      data-testid="button-position-br"
                    >
                      Bottom Right
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            data-testid="button-cancel-editor"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!imageUrl || isSaving}
            data-testid="button-save-editor"
          >
            <Check className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
