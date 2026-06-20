'use server'

import fs from 'fs/promises'
import path from 'path'
import sharp from 'sharp'
import { del, put } from '@vercel/blob'

import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
// Use Vercel Blob when a store is connected (BLOB_STORE_ID, OIDC auth) or a
// static token is set; otherwise local disk (dev).
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

async function requireUser() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
  return s
}

export type MediaItem = { id: number; url: string; alt: string; filename: string; mime: string }

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB (accommodates hero videos)
const ALLOWED = /^(image\/(jpeg|png|webp|gif|svg\+xml)|video\/mp4)$/

export async function uploadMedia(formData: FormData): Promise<MediaItem> {
  await requireUser()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')
  if (file.size > MAX_BYTES) throw new Error('File is too large (max 50 MB).')
  if (file.type && !ALLOWED.test(file.type)) throw new Error('Unsupported file type. Use an image or MP4 video.')

  const safe = file.name.toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-')
  const filename = `${Date.now()}-${safe}`
  const buf = Buffer.from(await file.arrayBuffer())

  let width: number | undefined
  let height: number | undefined
  if (file.type.startsWith('image/')) {
    try {
      const meta = await sharp(buf).metadata()
      width = meta.width
      height = meta.height
    } catch {
      /* non-fatal */
    }
  }

  let url: string
  if (useBlob) {
    const blob = await put(`media/${filename}`, buf, {
      access: 'public',
      contentType: file.type || undefined,
      addRandomSuffix: false,
    })
    url = blob.url
  } else {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buf)
    url = `/uploads/${filename}`
  }

  const media = await prisma.media.create({
    data: { url, filename, alt: formData.get('alt')?.toString() || file.name, mime: file.type, width, height },
  })
  return { id: media.id, url: media.url, alt: media.alt, filename: media.filename, mime: media.mime }
}

export async function deleteMedia(id: number): Promise<void> {
  await requireUser()
  const m = await prisma.media.findUnique({ where: { id } })
  if (!m) return
  // remove the underlying file for admin uploads (never the bundled /assets)
  if (m.url.startsWith('http')) {
    if (useBlob) await del(m.url).catch(() => {})
  } else if (m.url.startsWith('/uploads/')) {
    await fs.rm(path.join(process.cwd(), 'public', m.url), { force: true }).catch(() => {})
  }
  await prisma.media.delete({ where: { id } })
}

export async function listMedia(): Promise<MediaItem[]> {
  await requireUser()
  const rows = await prisma.media.findMany({ orderBy: { createdAt: 'desc' } })
  return rows.map((m) => ({ id: m.id, url: m.url, alt: m.alt, filename: m.filename, mime: m.mime }))
}
