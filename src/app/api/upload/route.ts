import { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  unauthorizedResponse,
  errorResponse,
  successResponse,
  handlePrismaError,
  logActivity,
} from '@/lib/api'

// Allowed file types for upload
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * POST /api/upload - Upload an image to Supabase Storage
 * Accepts multipart/form-data with a 'file' field
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const folder = formData.get('folder') as string || 'products'

    if (!file) {
      return errorResponse('No file provided', 400)
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse(
        `Invalid file type. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        400
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('File size exceeds 5MB limit', 400)
    }

    const supabase = await createServerSupabaseClient()

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const extension = file.name.split('.').pop() || 'jpg'
    const fileName = `${timestamp}-${randomStr}.${extension}`
    const filePath = `${user.tenantId}/${folder}/${fileName}`

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Supabase storage error:', error)
      return errorResponse('Failed to upload file', 500)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(data.path)

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'IMAGE_UPLOAD',
      module: 'UPLOAD',
      entityType: 'Storage',
      entityId: data.path,
      metadata: { folder, fileName, size: file.size }
    })

    return successResponse({
      url: urlData.publicUrl,
      path: data.path,
    })
  } catch (error) {
    return handlePrismaError(error)
  }
}

/**
 * DELETE /api/upload - Delete an image from Supabase Storage
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser()
    if (!user) return unauthorizedResponse()

    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')

    if (!path) {
      return errorResponse('File path is required', 400)
    }

    // Verify the path belongs to this tenant
    if (!path.startsWith(user.tenantId + '/')) {
      return errorResponse('Unauthorized', 403)
    }

    const supabase = await createServerSupabaseClient()

    const { error } = await supabase.storage
      .from('images')
      .remove([path])

    if (error) {
      console.error('Supabase storage delete error:', error)
      return errorResponse('Failed to delete file', 500)
    }

    await logActivity({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'IMAGE_DELETE',
      module: 'UPLOAD',
      entityType: 'Storage',
      entityId: path,
    })

    return successResponse({ deleted: true })
  } catch (error) {
    return handlePrismaError(error)
  }
}