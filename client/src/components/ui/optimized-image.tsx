import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  thumbnailSize?: "sm" | "md" | "lg";
  fallback?: React.ReactNode;
  onClick?: () => void;
  loadFullOnTap?: boolean;
  priority?: boolean;
}

const THUMBNAIL_SIZES = {
  sm: 64,
  md: 150,
  lg: 300,
};

const imageCache = new Map<string, string>();

function getThumbnailUrl(src: string, size: "sm" | "md" | "lg"): string {
  if (!src) return "";
  
  if (src.startsWith("/api/uploads/")) {
    const parts = src.split("/");
    const fileId = parts[parts.length - 1];
    return `/api/uploads/${fileId}/thumbnail?size=${THUMBNAIL_SIZES[size]}`;
  }
  
  return src;
}

export function OptimizedImage({
  src,
  alt,
  className,
  thumbnailSize = "md",
  fallback,
  onClick,
  loadFullOnTap = true,
  priority = false,
}: OptimizedImageProps) {
  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFull, setShowFull] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLDivElement>(null);

  const thumbnailUrl = src ? getThumbnailUrl(src, thumbnailSize) : null;
  const fullUrl = src || null;

  useEffect(() => {
    if (!imgRef.current || priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "100px",
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [priority]);

  useEffect(() => {
    if (!isVisible || !thumbnailUrl) return;

    const shouldAutoUpgrade = priority || !loadFullOnTap;
    
    const loadThumbnail = () => {
      if (imageCache.has(thumbnailUrl)) {
        setCurrentSrc(imageCache.get(thumbnailUrl)!);
        setIsLoaded(true);
        if (shouldAutoUpgrade) setShowFull(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        imageCache.set(thumbnailUrl, thumbnailUrl);
        setCurrentSrc(thumbnailUrl);
        setIsLoaded(true);
        if (shouldAutoUpgrade) setShowFull(true);
      };
      img.onerror = () => {
        if (fullUrl && fullUrl !== thumbnailUrl) {
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            imageCache.set(thumbnailUrl, fullUrl);
            setCurrentSrc(fullUrl);
            setIsLoaded(true);
          };
          fallbackImg.onerror = () => setError(true);
          fallbackImg.src = fullUrl;
        } else {
          setError(true);
        }
      };
      img.src = thumbnailUrl;
    };

    loadThumbnail();
  }, [isVisible, thumbnailUrl, fullUrl, priority, loadFullOnTap]);

  useEffect(() => {
    if (!showFull || !fullUrl || fullUrl === currentSrc) return;

    if (imageCache.has(fullUrl)) {
      setCurrentSrc(imageCache.get(fullUrl)!);
      return;
    }

    const img = new Image();
    img.onload = () => {
      imageCache.set(fullUrl, fullUrl);
      setCurrentSrc(fullUrl);
    };
    img.src = fullUrl;
  }, [showFull, fullUrl, currentSrc]);

  const handleClick = useCallback(() => {
    if (loadFullOnTap && !showFull) {
      setShowFull(true);
    }
    onClick?.();
  }, [loadFullOnTap, showFull, onClick]);

  if (!src) {
    return fallback ? <>{fallback}</> : null;
  }

  if (error) {
    return fallback ? <>{fallback}</> : null;
  }

  return (
    <div
      ref={imgRef}
      className={cn("relative overflow-hidden", className)}
      onClick={handleClick}
      role={onClick || loadFullOnTap ? "button" : undefined}
      tabIndex={onClick || loadFullOnTap ? 0 : undefined}
      data-testid="optimized-image"
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
    </div>
  );
}

export function clearImageCache(): void {
  imageCache.clear();
}

export function preloadImage(src: string, size: "sm" | "md" | "lg" = "md"): void {
  const url = getThumbnailUrl(src, size);
  if (imageCache.has(url)) return;
  
  const img = new Image();
  img.onload = () => imageCache.set(url, url);
  img.src = url;
}
