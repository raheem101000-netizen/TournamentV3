import { useState } from "react";

interface ImageGridProps {
    images: Array<{ id: string; url: string }>;
    onImageClick: (index: number) => void;
    isOwnMessage: boolean;
}

export function ImageGrid({ images, onImageClick, isOwnMessage }: ImageGridProps) {
    if (images.length === 0) return null;

    // Single image - full width
    if (images.length === 1) {
        return (
            <button
                onClick={() => onImageClick(0)}
                className="p-0 border-0 bg-transparent cursor-pointer rounded-[16px] overflow-hidden w-full block max-w-[280px]"
            >
                <img
                    src={images[0].url}
                    alt="Shared image"
                    className="w-full h-auto max-h-[280px] object-cover rounded-[16px]"
                />
            </button>
        );
    }

    // Two images - side by side
    if (images.length === 2) {
        return (
            <div className="flex gap-0.5 rounded-[16px] overflow-hidden max-w-[280px]">
                <button
                    onClick={() => onImageClick(0)}
                    className="flex-1 p-0 border-0 bg-transparent cursor-pointer overflow-hidden"
                >
                    <img
                        src={images[0].url}
                        alt="Shared image"
                        className="w-full h-full max-h-[200px] object-cover"
                    />
                </button>
                <button
                    onClick={() => onImageClick(1)}
                    className="flex-1 p-0 border-0 bg-transparent cursor-pointer overflow-hidden"
                >
                    <img
                        src={images[1].url}
                        alt="Shared image"
                        className="w-full h-full max-h-[200px] object-cover"
                    />
                </button>
            </div>
        );
    }

    // Three or more images - 2x2 grid with overlay
    return (
        <div className="grid grid-cols-2 gap-0.5 rounded-[16px] overflow-hidden max-w-[280px]">
            {images.slice(0, 3).map((img, idx) => (
                <button
                    key={img.id}
                    onClick={() => onImageClick(idx)}
                    className="p-0 border-0 bg-transparent cursor-pointer overflow-hidden aspect-square"
                >
                    <img
                        src={img.url}
                        alt="Shared image"
                        className="w-full h-full object-cover"
                    />
                </button>
            ))}

            {/* Fourth slot - either last image or overlay */}
            {images.length === 3 ? (
                <div className="aspect-square" />
            ) : (
                <button
                    onClick={() => onImageClick(3)}
                    className="relative p-0 border-0 bg-transparent cursor-pointer overflow-hidden aspect-square"
                >
                    <img
                        src={images[3].url}
                        alt="Shared image"
                        className="w-full h-full object-cover"
                    />
                    {images.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white text-2xl font-semibold">
                                +{images.length - 4}
                            </span>
                        </div>
                    )}
                </button>
            )}
        </div>
    );
}
