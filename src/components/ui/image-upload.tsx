'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Loader2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string[]
  onChange: (urls: string[]) => void
  maxImages?: number
  folder?: string
  disabled?: boolean
}

interface UploadingFile {
  file: File
  progress: number
  error?: string
}

export function ImageUpload({
  value = [],
  onChange,
  maxImages = 5,
  folder = 'products',
  disabled = false,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState<UploadingFile[]>([])

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return

    const remainingSlots = maxImages - value.length
    const filesToUpload = acceptedFiles.slice(0, remainingSlots)

    if (filesToUpload.length === 0) {
      return
    }

    // Add files to uploading state
    const newUploading: UploadingFile[] = filesToUpload.map(file => ({
      file,
      progress: 0,
    }))
    setUploading(newUploading)

    // Upload each file
    const uploadedUrls: string[] = []

    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i]
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('folder', folder)

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Upload failed')
        }

        const data = await res.json()
        uploadedUrls.push(data.data.url)

        // Update progress
        setUploading(prev =>
          prev.map(u =>
            u.file === file ? { ...u, progress: 100 } : u
          )
        )
      } catch (error) {
        setUploading(prev =>
          prev.map(u =>
            u.file === file
              ? { ...u, error: error instanceof Error ? error.message : 'Upload failed' }
              : u
          )
        )
      }
    }

    // Clear uploading state after a delay
    setTimeout(() => {
      setUploading([])
    }, 500)

    // Add uploaded URLs
    if (uploadedUrls.length > 0) {
      onChange([...value, ...uploadedUrls])
    }
  }, [value, onChange, maxImages, folder, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: disabled || value.length >= maxImages,
  })

  const removeImage = async (index: number) => {
    const url = value[index]
    const newUrls = value.filter((_, i) => i !== index)
    onChange(newUrls)

    // Try to delete from storage
    try {
      const path = url.split('/').slice(-3).join('/') // Extract tenant/folder/filename
      await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      })
    } catch {
      // Ignore deletion errors
    }
  }

  const hasImages = value.length > 0
  const isUploading = uploading.length > 0

  return (
    <div className="space-y-4">
      {/* Existing images */}
      {hasImages && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {value.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square rounded-lg overflow-hidden border bg-muted"
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="object-cover w-full h-full"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/80"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload area */}
      {value.length < maxImages && (
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
            isDragActive && 'border-primary bg-primary/5',
            disabled && 'opacity-50 cursor-not-allowed',
            !disabled && 'hover:border-primary hover:bg-primary/5'
          )}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Uploading {uploading.length} file{uploading.length > 1 ? 's' : ''}...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 rounded-full bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Drag & drop images here, or click to select
              </p>
              <p className="text-xs text-muted-foreground">
                {maxImages - value.length} slot{maxImages - value.length !== 1 ? 's' : ''} remaining (max 5MB each)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload errors */}
      {uploading.some(u => u.error) && (
        <div className="text-sm text-destructive">
          {uploading.filter(u => u.error).map(u => u.error).join(', ')}
        </div>
      )}
    </div>
  )
}

// Single image upload variant
interface SingleImageUploadProps {
  value?: string
  onChange: (url: string) => void
  folder?: string
  disabled?: boolean
}

export function SingleImageUpload({
  value,
  onChange,
  folder = 'products',
  disabled = false,
}: SingleImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled || acceptedFiles.length === 0) return

    const file = acceptedFiles[0]
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Upload failed')
      }

      const data = await res.json()

      // Delete old image if exists
      if (value) {
        try {
          const path = value.split('/').slice(-3).join('/')
          await fetch(`/api/upload?path=${encodeURIComponent(path)}`, {
            method: 'DELETE',
          })
        } catch {
          // Ignore deletion errors
        }
      }

      onChange(data.data.url)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }, [value, onChange, folder, disabled])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
    },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    disabled,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-lg overflow-hidden cursor-pointer transition-colors',
        isDragActive && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed',
        !disabled && 'hover:border-primary hover:bg-primary/5',
        value ? 'w-32 h-32' : 'w-full p-8'
      )}
    >
      <input {...getInputProps()} />
      {isUploading ? (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : value ? (
        <img
          src={value}
          alt="Uploaded"
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Click or drop to upload</p>
        </div>
      )}
    </div>
  )
}