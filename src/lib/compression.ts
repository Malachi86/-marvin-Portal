'use client';

/**
 * NEURAL COMPRESSION UTILITY
 * Handles on-the-fly image optimization to save storage space (GB).
 * Reduces dimensions and applies JPEG compression before cloud transmission.
 */

export async function compressImage(
  base64Str: string, 
  maxWidth = 1200, 
  maxHeight = 1200, 
  quality = 0.6
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Maintain Aspect Ratio while respecting Max Bounds
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64Str); // Fallback to original if canvas fails
        return;
      }

      // Fill white background for JPEGs (removes transparency artifacts)
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Export as compressed JPEG
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };

    img.onerror = (e) => {
      console.error("Compression failed:", e);
      resolve(base64Str); // Return original if error
    };
  });
}
