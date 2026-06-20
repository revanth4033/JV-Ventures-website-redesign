'use server'

import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { del, put } from '@vercel/blob'
import sharp from 'sharp'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID)

async function requireUser() {
  const s = await getSession()
  if (!s) throw new Error('Not authenticated')
  return s
}

async function audit(userEmail: string, action: string, entity: string, label: string) {
  await prisma.auditLog.create({ data: { userEmail, action, entity, label } }).catch(() => {})
}

export type MediaItem = { id: number; url: string; alt: string; filename: string; mime: string }
const toItem = (m: { id: number; url: string; alt: string; filename: string; mime: string }): MediaItem => ({
  id: m.id, url: m.url, alt: m.alt, filename: m.filename, mime: m.mime,
})

const MAX_BYTES = 50 * 1024 * 1024 // 50 MB (hero videos)
// SVG intentionally excluded — it can carry script and is served same-origin.
const ALLOWED = /^(image\/(jpeg|png|webp|gif)|video\/mp4)$/
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'video/mp4': 'mp4' }

/** Validate the file by its real magic bytes, not the client-supplied MIME. */
function sniffMime(b: Buffer): string | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg'
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'image/png'
  if (b.length >= 4 && b.toString('ascii', 0, 4) === 'GIF8') return 'image/gif'
  if (b.length >= 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (b.length >= 12 && b.toString('ascii', 4, 8) === 'ftyp') return 'video/mp4'
  return null
}

export async function uploadMedia(formData: FormData): Promise<MediaItem> {
  const user = await requireUser()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')
  if (file.size > MAX_BYTES) throw new Error('File is too large (max 50 MB).')

  const original = Buffer.from(await file.arrayBuffer())
  const mime = sniffMime(original)
  if (!mime || !ALLOWED.test(mime)) throw new Error('Unsupported or unrecognised file. Use a JPG, PNG, WebP, GIF, or MP4.')

  // Duplicate detection — re-uploading identical bytes reuses the existing asset.
  const hash = crypto.createHash('sha256').update(original).digest('hex')
  const dupe = await prisma.media.findFirst({ where: { hash } }).catch(() => null)
  if (dupe) return toItem(dupe)

  // Optimise & re-encode raster images (caps size, strips metadata, defangs polyglots).
  let buf: Buffer = original
  let width: number | undefined
  let height: number | undefined
  if (mime !== 'video/mp4') {
    try {
      const pipe = sharp(original, { failOn: 'none', animated: mime === 'image/gif' }).rotate()
      const meta = await pipe.metadata()
      let p = (meta.width ?? 0) > 2400 ? pipe.resize({ width: 2400, withoutEnlargement: true }) : pipe
      if (mime === 'image/jpeg') p = p.jpeg({ quality: 82, mozjpeg: true })
      else if (mime === 'image/png') p = p.png({ compressionLevel: 9 })
      else if (mime === 'image/webp') p = p.webp({ quality: 82 })
      buf = await p.toBuffer()
      const out = await sharp(buf).metadata()
      width = out.width
      height = out.height
    } catch {
      buf = original
    }
  }

  const safe = (file.name.replace(/\.[^.]+$/, '') || 'file').toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-').replace(/-+/g, '-')
  const filename = `${Date.now()}-${safe}.${EXT[mime]}`

  let url: string
  if (useBlob) {
    const blob = await put(`media/${filename}`, buf, { access: 'public', contentType: mime, addRandomSuffix: false })
    url = blob.url
  } else {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buf)
    url = `/uploads/${filename}`
  }

  const media = await prisma.media.create({
    data: { url, filename, alt: formData.get('alt')?.toString() || file.name, mime, width, height, hash },
  })
  await audit(user.email, 'create', `media:${media.id}`, media.filename)
  return toItem(media)
}

export async function updateMedia(id: number, patch: { alt?: string; filename?: string }): Promise<MediaItem> {
  const user = await requireUser()
  const data: { alt?: string; filename?: string } = {}
  if (typeof patch.alt === 'string') data.alt = patch.alt
  if (typeof patch.filename === 'string' && patch.filename.trim()) data.filename = patch.filename.trim()
  const m = await prisma.media.update({ where: { id }, data })
  await audit(user.email, 'update', `media:${id}`, m.filename)
  return toItem(m)
}

export async function deleteMedia(id: number): Promise<void> {
  const user = await requireUser()
  const m = await prisma.media.findUnique({ where: { id } })
  if (!m) return
  if (m.url.startsWith('http')) {
    if (useBlob) await del(m.url).catch(() => {})
  } else if (m.url.startsWith('/uploads/')) {
    await fs.rm(path.join(process.cwd(), 'public', m.url), { force: true }).catch(() => {})
  }
  await prisma.media.delete({ where: { id } })
  await audit(user.email, 'delete', `media:${id}`, m.filename)
}

export async function listMedia(opts?: { q?: string; take?: number; skip?: number }): Promise<MediaItem[]> {
  await requireUser()
  const q = opts?.q?.trim()
  const rows = await prisma.media.findMany({
    where: q
      ? { OR: [{ filename: { contains: q, mode: 'insensitive' } }, { alt: { contains: q, mode: 'insensitive' } }] }
      : undefined,
    orderBy: { createdAt: 'desc' },
    take: opts?.take ?? 200,
    skip: opts?.skip ?? 0,
  })
  return rows.map(toItem)
}
