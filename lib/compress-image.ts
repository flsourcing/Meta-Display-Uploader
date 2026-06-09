export async function compressImageIfNeeded(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (file.size < 400_000) {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const largestSide = Math.max(bitmap.width, bitmap.height);
  const scale = Math.min(1, maxWidth / largestSide);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    return file;
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Could not compress image."));
      },
      "image/jpeg",
      quality
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
