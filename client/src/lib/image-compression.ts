export async function compressImage(file: File): Promise<File> {
    // If not an image, return original
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // If small enough (< 200KB), return original
    if (file.size < 200 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };

        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;


            // Max dimension 1920px
            const MAX_SIZE = 1920;
            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(file); // Fallback
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);

            // Convert to WebP, quality 0.8
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        resolve(file); // Fallback
                        return;
                    }

                    // If compressed is larger (unlikely), return original
                    if (blob.size > file.size) {
                        resolve(file);
                        return;
                    }

                    const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
                        type: "image/webp",
                        lastModified: Date.now(),
                    });

                    resolve(compressedFile);
                },
                "image/webp",
                0.8
            );
        };

        img.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
    });
}
