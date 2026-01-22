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
const pendingRequests = new Map<string, Promise<string>>(); // Track in-flight requests


function getThumbnailUrl(src: string, size: "sm" | "md" | "lg"): string {
  if (!src) return "";

  // Handle local uploads (legacy / API-based)
  if (src.startsWith("/api/uploads/")) {
    const parts = src.split("/");
    const fileId = parts[parts.length - 1];
    return `/api/uploads/${fileId}/thumbnail?size=${THUMBNAIL_SIZES[size]}`;
  }

  // Handle external URLs (Vercel Blob, etc) using wsrv.nl for on-the-fly optimization
  // Skip optimization for localhost, private IPs, or if explicitly disabled
  if (src.startsWith("http") && !src.includes("localhost") && !src.includes("127.0.0.1") && !src.includes("192.168.")) {
    try {
      const url = new URL("https://wsrv.nl/");
      url.searchParams.set("url", src);
      url.searchParams.set("w", THUMBNAIL_SIZES[size].toString());
      url.searchParams.set("q", "80"); // Quality 80%
      url.searchParams.set("output", "webp"); // Convert to WebP
      return url.toString();
    } catch {
      return src;
    }
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
  const thumbnailUrl = src ? getThumbnailUrl(src, thumbnailSize) : null;
  const fullUrl = src || null;

  const [isVisible, setIsVisible] = useState(priority);
  const [isLoaded, setIsLoaded] = useState(priority); // Assume loaded if priority (browser handles it)
  const [showFull, setShowFull] = useState(false);
  const [error, setError] = useState(false);

  // CRITICAL FIX: Initialize state directly for priority images so <img> tag exists on first render
  const [currentSrc, setCurrentSrc] = useState<string | null>(
    priority && thumbnailUrl ? thumbnailUrl : null
  );

  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!imgRef.current || priority) return; // Skip observer if priority (already visible)

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

    const loadThumbnail = async () => {
      // Check cache first
      if (imageCache.has(thumbnailUrl)) {
        setCurrentSrc(imageCache.get(thumbnailUrl)!);
        setIsLoaded(true);
        if (shouldAutoUpgrade) setShowFull(true);
        return;
      }

      // Check if request is already in-flight (deduplication)
      if (pendingRequests.has(thumbnailUrl)) {
        try {
          const cachedUrl = await pendingRequests.get(thumbnailUrl);
          setCurrentSrc(cachedUrl || thumbnailUrl);
          setIsLoaded(true);
          if (shouldAutoUpgrade) setShowFull(true);
        } catch {
          setError(true);
        }
        return;
      }

      // Create new request and track it
      const loadPromise = new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          imageCache.set(thumbnailUrl, thumbnailUrl);
          resolve(thumbnailUrl);
        };
        img.onerror = () => {
          if (fullUrl && fullUrl !== thumbnailUrl) {
            const fallbackImg = new Image();
            fallbackImg.onload = () => {
              imageCache.set(thumbnailUrl, fullUrl);
              resolve(fullUrl);
            };
            fallbackImg.onerror = () => reject(new Error('Failed to load image'));
            fallbackImg.src = fullUrl;
          } else {
            reject(new Error('Failed to load image'));
          }
        };
        img.src = thumbnailUrl;
      });

      pendingRequests.set(thumbnailUrl, loadPromise);

      try {
        const loadedUrl = await loadPromise;
        setCurrentSrc(loadedUrl);
        setIsLoaded(true);
        if (shouldAutoUpgrade) setShowFull(true);
      } catch {
        setError(true);
      } finally {
        pendingRequests.delete(thumbnailUrl);
      }
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
          //@ts-ignore - React expects lowercase for custom attributes but types might lag
          fetchpriority={priority ? "high" : "auto"}
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
