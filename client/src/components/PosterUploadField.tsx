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
      // Convert base64 to blob and upload as-is (no cropping needed)
      const response = await fetch(rawImage);
      const blob = await response.blob();

      const formData = new FormData();
      formData.append('file', blob, 'poster.jpg');

      const uploadResponse = await fetch('/api/objects/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      const data = await uploadResponse.json();
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

  // Editing mode - show preview with 4:5 aspect ratio (matches homepage display)
  if (rawImage) {
    return (
      <div className="space-y-3">
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">Preview - your full image will be displayed with a blurred background fill</p>
        
        <div 
          className="relative rounded-lg border overflow-hidden bg-muted mx-auto"
          style={{ aspectRatio: '1/1', maxWidth: '240px' }}
          data-testid="poster-editor"
        >
          {/* Blurred background fill */}
          <img 
            src={rawImage} 
            alt="" 
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-60"
            aria-hidden="true"
          />
          {/* Actual image - fully visible */}
          <img 
            src={rawImage} 
            alt="Poster Preview" 
            className="relative w-full h-full object-contain z-10"
          />
          
          {/* Server badge preview overlay */}
          <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full pl-1 pr-2 py-0.5 pointer-events-none">
            <div className="w-5 h-5 rounded-full bg-white/20 border border-white/30" />
            <span className="text-[9px] text-white/80">Server</span>
          </div>
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
