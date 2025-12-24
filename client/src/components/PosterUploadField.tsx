import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface PosterUploadFieldProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export default function PosterUploadField({ 
  label = "Tournament Poster",
  value, 
  onChange,
  required = false
}: PosterUploadFieldProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Read as data URL for editing
    const reader = new FileReader();
    reader.onload = (e) => {
      setRawImage(e.target?.result as string);
      setZoom(100);
      setPosition({ x: 50, y: 50 });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    e.preventDefault();
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

  const handleSaveEdited = async () => {
    if (!rawImage) return;
    
    setIsSaving(true);
    try {
      // Create canvas to render the edited image (9:16 portrait ratio like homepage)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const canvasWidth = 540;
      const canvasHeight = 960;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = rawImage;
      });

      const zoomFactor = zoom / 100;
      const scaleX = canvasWidth / img.width;
      const scaleY = canvasHeight / img.height;
      const baseScale = Math.max(scaleX, scaleY);
      const scale = baseScale * zoomFactor;

      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const excessWidth = scaledWidth - canvasWidth;
      const excessHeight = scaledHeight - canvasHeight;
      const offsetX = -excessWidth * (position.x / 100);
      const offsetY = -excessHeight * (position.y / 100);

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', blob, 'poster.jpg');

      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      onChange(data.fileUrl || data.url);
      setRawImage(null);
      
      toast({
        title: "Poster saved",
        description: "Your tournament poster has been saved.",
      });
    } catch (error) {
      toast({
        title: "Save failed",
        description: "Failed to save the poster.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setRawImage(null);
    setZoom(100);
    setPosition({ x: 50, y: 50 });
  };

  const handleRemoveImage = () => {
    onChange("");
    setRawImage(null);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Editing mode - show inline editor with homepage poster preview
  if (rawImage) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">Preview shows how your poster will appear on the homepage</p>
        
        <div 
          className="relative rounded-lg border overflow-hidden bg-black cursor-move select-none mx-auto"
          style={{ aspectRatio: '9/16', maxHeight: '320px' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="poster-editor"
        >
          {/* Background image with zoom/pan */}
          <img 
            src={rawImage} 
            alt="Edit Poster" 
            className="absolute pointer-events-none"
            style={{
              width: `${zoom}%`,
              height: `${zoom}%`,
              objectFit: 'cover',
              left: `${50 - position.x}%`,
              top: `${50 - position.y}%`,
              transform: 'translate(-50%, -50%)',
              minWidth: '100%',
              minHeight: '100%',
            }}
            draggable={false}
          />
          
          {/* Overlay gradient like homepage */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30 pointer-events-none" />
          
          {/* Mock poster content overlay */}
          <div className="absolute inset-0 flex flex-col justify-between text-center text-white px-3 py-4 pointer-events-none">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30" />
              <span className="text-[10px] text-white/70">Server Name</span>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-bold">Tournament Title</div>
              <div className="flex justify-center gap-4 text-[10px]">
                <div className="flex flex-col items-center">
                  <span className="font-bold">Prize</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-bold">Entry</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Drag hint */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
            <Move className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Drag to reposition</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            min={100}
            max={200}
            step={5}
            className="flex-1"
            data-testid="slider-zoom"
          />
          <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-xs text-muted-foreground w-12">{zoom}%</span>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelEdit}
            className="flex-1"
            data-testid="button-cancel-edit"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSaveEdited}
            disabled={isSaving}
            className="flex-1"
            data-testid="button-save-poster"
          >
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isSaving ? "Saving..." : "Save Poster"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-poster-upload"
      />

      {!value ? (
        <Button
          type="button"
          variant="outline"
          onClick={handleUploadClick}
          disabled={isUploading}
          className="w-full h-24 border-dashed"
          data-testid="poster-upload-dropzone"
        >
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6" />
            <span className="text-sm">Upload Tournament Poster</span>
          </div>
        </Button>
      ) : (
        <div className="space-y-2">
          <div 
            className="relative rounded-lg border overflow-hidden bg-muted h-32"
            data-testid="poster-preview"
          >
            <img 
              src={value} 
              alt="Tournament Poster" 
              className="w-full h-full object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
              data-testid="button-remove-poster"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            className="w-full"
            data-testid="button-change-poster"
          >
            <Upload className="w-4 h-4 mr-2" />
            Change Poster
          </Button>
        </div>
      )}
    </div>
  );
}
