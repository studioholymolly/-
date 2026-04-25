import JSZip from 'jszip'

export type ZipItem = { url: string; filename: string }

export async function downloadPhotosAsZip(
  items: ZipItem[],
  zipName: string,
  onProgress?: (loaded: number, total: number) => void
) {
  if (items.length === 0) return

  const zip = new JSZip()
  let loaded = 0
  const usedNames = new Set<string>()

  for (const item of items) {
    const res = await fetch(item.url)
    if (!res.ok) throw new Error(`download failed: ${item.filename}`)
    const blob = await res.blob()

    let name = item.filename || `photo-${loaded + 1}`
    if (usedNames.has(name)) {
      const dot = name.lastIndexOf('.')
      const base = dot > 0 ? name.slice(0, dot) : name
      const ext = dot > 0 ? name.slice(dot) : ''
      let n = 2
      while (usedNames.has(`${base} (${n})${ext}`)) n++
      name = `${base} (${n})${ext}`
    }
    usedNames.add(name)

    zip.file(name, blob)
    loaded += 1
    onProgress?.(loaded, items.length)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = zipName.endsWith('.zip') ? zipName : `${zipName}.zip`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(objectUrl)
}
