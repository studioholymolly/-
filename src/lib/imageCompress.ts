const SUPPORTED = new Set(['image/jpeg', 'image/png', 'image/webp'])

export async function compressImageFile(
  file: File,
  opts: { maxDim?: number; quality?: number } = {}
): Promise<File> {
  const maxDim = opts.maxDim ?? 2400
  const quality = opts.quality ?? 0.82

  if (!SUPPORTED.has(file.type)) return file

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    return file
  }

  const { width, height } = bitmap
  const longest = Math.max(width, height)
  const scale = longest > maxDim ? maxDim / longest : 1
  const targetW = Math.round(width * scale)
  const targetH = Math.round(height * scale)

  if (scale === 1 && file.type === 'image/jpeg') {
    bitmap.close?.()
    return file
  }

  const canvas =
    typeof OffscreenCanvas !== 'undefined'
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement('canvas'), { width: targetW, height: targetH })

  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null
  if (!ctx) {
    bitmap.close?.()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, targetW, targetH)
  bitmap.close?.()

  const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'

  let blob: Blob | null = null
  try {
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({ type: outType, quality })
    } else {
      blob = await new Promise<Blob | null>((resolve) =>
        (canvas as HTMLCanvasElement).toBlob(resolve, outType, quality)
      )
    }
  } catch {
    return file
  }

  if (!blob || blob.size >= file.size) return file

  const newName =
    outType === 'image/jpeg' && !/\.jpe?g$/i.test(file.name)
      ? file.name.replace(/\.[^.]+$/, '') + '.jpg'
      : file.name

  return new File([blob], newName, { type: outType, lastModified: Date.now() })
}
