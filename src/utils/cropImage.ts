import type { Area } from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.crossOrigin = "anonymous";
    image.src = url;
  });

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Rotate + crop to a Blob using pixel crop from react-easy-crop. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  mimeType = "image/jpeg",
  quality = 0.92,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");

  const rotRad = toRad(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = (() => {
    const cos = Math.abs(Math.cos(rotRad));
    const sin = Math.abs(Math.sin(rotRad));
    return {
      width: image.width * cos + image.height * sin,
      height: image.width * sin + image.height * cos,
    };
  })();

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.putImageData(data, 0, 0);

  const outputType = mimeType.startsWith("image/") ? mimeType : "image/jpeg";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create cropped image"));
          return;
        }
        resolve(blob);
      },
      outputType === "image/png" ? "image/png" : "image/jpeg",
      quality,
    );
  });
}

export async function getCroppedImageFile(
  imageSrc: string,
  pixelCrop: Area,
  fileName: string,
  rotation = 0,
  mimeType = "image/jpeg",
): Promise<File> {
  const blob = await getCroppedImageBlob(imageSrc, pixelCrop, rotation, mimeType);
  const base = String(fileName || "drawing").replace(/\.[^.]+$/, "") || "drawing";
  const ext = blob.type === "image/png" ? "png" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: blob.type || mimeType });
}
