'use client'

import { useState, useRef } from 'react'
import { confirmPhotoUpload } from '@/lib/actions/photos'
import { compressImageFile } from '@/lib/imageCompress'

interface UploadedFile {
  id: string
  filename: string
  preview: string
  progress: number
  done: boolean
  error?: string
}

interface UploadZoneProps {
  projectId: string
  bucket: 'originals' | 'retouched'
  onUploadComplete?: () => void
}

export default function UploadZone({ projectId, bucket, onUploadComplete }: UploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function uploadFile(originalFile: File, index: number) {
    const id = `${Date.now()}-${index}`

    setFiles(prev => [...prev, {
      id, filename: originalFile.name,
      preview: URL.createObjectURL(originalFile),
      progress: 0, done: false,
    }])

    try {
      const file = await compressImageFile(originalFile)

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 15 } : f))

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, filename: file.name, bucket }),
      })
      const { signedUrl, storagePath, error } = await res.json()
      if (error) throw new Error(error)

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 30 } : f))

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 80 } : f))

      const sortOrder = index
      await confirmPhotoUpload(projectId, storagePath, file.name, bucket, sortOrder)

      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: 100, done: true } : f))
      onUploadComplete?.()
    } catch {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, error: '업로드 실패' } : f))
    }
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    Array.from(fileList).forEach((file, i) => uploadFile(file, i))
  }

  return (
    <div>
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files) }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--vio)' : 'var(--bd2)'}`,
          background: dragging ? 'rgba(124,58,237,0.05)' : 'var(--s2)',
          borderRadius: 12, padding: '32px 20px',
          textAlign: 'center', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        <input ref={inputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={e => handleFiles(e.target.files)} />
        <div style={{ fontSize: 36, marginBottom: 8 }}>🖼</div>
        <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>여기에 사진을 드래그하거나 클릭하세요</h4>
        <p style={{ fontSize: 12, color: 'var(--mu)' }}>JPG, PNG, WEBP · 여러 장 동시 업로드 가능</p>
      </div>

      {files.length > 0 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
          gap: 8, marginTop: 14,
        }}>
          {files.map(f => (
            <div key={f.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', background: 'var(--s3)', border: '1px solid var(--bd)' }}>
              <img src={f.preview} alt={f.filename} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {!f.done && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'flex-end', padding: 6 }}>
                  <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2 }}>
                    <div style={{ width: `${f.progress}%`, height: '100%', background: 'var(--vio)', borderRadius: 2, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}
              {f.done && (
                <div style={{ position: 'absolute', top: 4, right: 4, background: 'var(--grn)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900 }}>✓</div>
              )}
              {f.error && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>✗</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
