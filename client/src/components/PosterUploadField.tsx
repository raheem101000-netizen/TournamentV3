import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { X, Upload, Loader2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ImageEditor } from "./ImageEditor";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPendingImage(dataUrl);
      setEditorOpen(true);
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleEditorSave = (imageUrl: string) => {
    onChange(imageUrl);
    setPendingImage(null);
    setEditorOpen(false);
  };

  const handleRemoveImage = () => {
    onChange("");
  };

  const handleEditExisting = () => {
    if (value) {
      setPendingImage(value);
      setEditorOpen(true);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

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
        <div 
          className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer hover-elevate transition-colors h-32"
          onClick={handleUploadClick}
          data-testid="poster-upload-dropzone"
        >
          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">
            Upload tournament poster
          </p>
          <p className="text-xs text-muted-foreground">
            16:9 aspect ratio recommended
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div 
            className="relative rounded-lg border overflow-hidden bg-muted h-36"
            data-testid="poster-preview"
          >
            <img 
              src={value} 
              alt="Tournament Poster" 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={handleEditExisting}
                data-testid="button-edit-poster"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={handleRemoveImage}
                data-testid="button-remove-poster"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleUploadClick}
            className="w-full"
            data-testid="button-change-poster"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Different Image
          </Button>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        You can adjust zoom and position after uploading
      </p>

      <ImageEditor
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setPendingImage(null);
        }}
        onSave={handleEditorSave}
        initialImage={pendingImage || undefined}
      />
    </div>
  );
}
