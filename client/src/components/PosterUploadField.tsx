import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, ZoomIn, ZoomOut, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface PosterUploadFieldProps {
  label?: string;
  value: string;
  onChange: (value: string, width?: number, height?: number) => void;
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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
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
      const dataUrl = e.target?.result as string;
      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setRawImage(dataUrl);
        setZoom(100);
        setPosition({ x: 50, y: 50 });
      };
      img.src = dataUrl;
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
    if (!rawImage || !imageDimensions) return;
    
    setIsSaving(true);
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = rawImage;
      });

      // Calculate canvas size based on image aspect ratio and zoom level
      // Clamp ratio between 0.75 (4:3 portrait max) and 2.0 (2:1 wide) for reasonable display
      // This prevents excessively tall posters
      const aspectRatio = Math.min(2.0, Math.max(0.75, img.width / img.height));
      const maxDimension = 1280;
      // When zoom < 100%, we shrink the canvas proportionally
      const zoomScale = Math.min(1, zoom / 100);
      let canvasWidth: number, canvasHeight: number;
      
      if (aspectRatio >= 1) {
        // Landscape or square
        canvasWidth = Math.round(maxDimension * zoomScale);
        canvasHeight = Math.round((maxDimension / aspectRatio) * zoomScale);
      } else {
        // Portrait
        canvasHeight = Math.round(maxDimension * zoomScale);
        canvasWidth = Math.round((maxDimension * aspectRatio) * zoomScale);
      }
      
      // Ensure minimum dimensions
      canvasWidth = Math.max(canvasWidth, 200);
      canvasHeight = Math.max(canvasHeight, 200);

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Draw the image with zoom/position applied
      // When zoom < 100%, frame shrinks but image fills it completely
      // When zoom >= 100%, frame is full size and we crop into the image
      const effectiveZoom = zoom >= 100 ? zoom / 100 : 1;
      const baseScale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const scale = baseScale * effectiveZoom;
      const scaledW = img.width * scale;
      const scaledH = img.height * scale;
      
      const offsetX = (position.x / 100 - 0.5) * (scaledW - canvasWidth);
      const offsetY = (position.y / 100 - 0.5) * (scaledH - canvasHeight);
      const drawX = (canvasWidth - scaledW) / 2 - offsetX;
      const drawY = (canvasHeight - scaledH) / 2 - offsetY;

      ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

      // Convert to blob and upload
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => b ? resolve(b) : reject(new Error('Failed to create blob')), 'image/jpeg', 0.9);
      });

      const formData = new FormData();
      formData.append('file', blob, 'poster.jpg');

      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const data = await uploadResponse.json();
      onChange(data.fileUrl || data.url, canvasWidth, canvasHeight);
      setRawImage(null);
      setImageDimensions(null);
      setZoom(100);
      setPosition({ x: 50, y: 50 });
      
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
    setImageDimensions(null);
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

  // Editing mode - show preview with zoom/pan controls
  if (rawImage) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">Drag to reposition, use slider to resize</p>
        
        <div 
          className="relative rounded-lg border overflow-hidden bg-muted mx-auto cursor-move select-none"
          style={{ 
            aspectRatio: imageDimensions 
              ? `${Math.min(2.0, Math.max(0.75, imageDimensions.width / imageDimensions.height))}` 
              : '16/9',
            width: `${Math.min(100, zoom)}%`,
            maxWidth: '100%',
            transition: 'width 0.15s ease-out',
            backgroundColor: '#1a1a1a'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="poster-editor"
        >
          {/* Actual image with zoom/position */}
          <img 
            src={rawImage} 
            alt="Poster Preview" 
            className="absolute pointer-events-none z-10"
            style={{
              width: zoom >= 100 ? `${zoom}%` : '100%',
              height: 'auto',
              minWidth: '100%',
              minHeight: '100%',
              left: `${50 - position.x}%`,
              top: `${50 - position.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            draggable={false}
          />
          
          {/* Drag hint */}
          <div className="absolute bottom-2 left-2 right-2 z-20 flex items-center justify-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1">
            <Move className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Drag to reposition</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Slider
            value={[zoom]}
            onValueChange={(v) => setZoom(v[0])}
            min={50}
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
