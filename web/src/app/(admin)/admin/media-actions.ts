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

async function requireAdmin() {
  const s = await requireUser()
  if (s.role !== 'admin') throw new Error('Only admins can perform this action.')
  return s
}

async function audit(userEmail: string, action: string, entity: string, label: string) {
  await prisma.auditLog.create({ data: { userEmail, action, entity, label } }).catch(() => {})
}

export type MediaItem = { id: number; url: string; alt: string; filename: string; mime: string; folder: string; tags: string[] }
const toItem = (m: { id: number; url: string; alt: string; filename: string; mime: string; folder: string; tags: string[] }): MediaItem => ({
  id: m.id, url: m.url, alt: m.alt, filename: m.filename, mime: m.mime, folder: m.folder, tags: m.tags,
})

/** Validate + optimise an uploaded file; returns the processed buffer + meta. */
async function processUpload(file: File): Promise<{ buf: Buffer; mime: string; width?: number; height?: number; hash: string }> {
  if (file.size > MAX_BYTES) throw new Error('File is too large (max 50 MB).')
  const original = Buffer.from(await file.arrayBuffer())
  const mime = sniffMime(original)
  if (!mime || !ALLOWED.test(mime)) throw new Error('Unsupported or unrecognised file. Use a JPG, PNG, WebP, GIF, or MP4.')
  const hash = crypto.createHash('sha256').update(original).digest('hex')
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
  return { buf, mime, width, height, hash }
}

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

const parseTags = (s?: string | null) => (s ? s.split(',').map((t) => t.trim()).filter(Boolean) : [])

export async function uploadMedia(formData: FormData): Promise<MediaItem> {
  const user = await requireUser()
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')
  const { buf, mime, width, height, hash } = await processUpload(file)

  // Duplicate detection — re-uploading identical bytes reuses the existing asset.
  const dupe = await prisma.media.findFirst({ where: { hash } }).catch(() => null)
  if (dupe) return toItem(dupe)

  const folder = (formData.get('folder')?.toString() || '').trim()
  const tags = parseTags(formData.get('tags')?.toString())
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
    data: { url, filename, alt: formData.get('alt')?.toString() || file.name, mime, width, height, hash, folder, tags },
  })
  await audit(user.email, 'create', `media:${media.id}`, media.filename)
  return toItem(media)
}

/** Replace a file in place — writes to the SAME storage path so the URL (and every
 *  content reference to it) stays valid. */
export async function replaceMedia(id: number, formData: FormData): Promise<MediaItem> {
  const user = await requireUser()
  const existing = await prisma.media.findUnique({ where: { id } })
  if (!existing) throw new Error('Media not found')
  const file = formData.get('file') as File | null
  if (!file || file.size === 0) throw new Error('No file provided')
  const { buf, mime, width, height, hash } = await processUpload(file)

  if (existing.url.startsWith('http')) {
    if (!useBlob) throw new Error('Remote storage not configured')
    const pathname = new URL(existing.url).pathname.replace(/^\//, '')
    await put(pathname, buf, { access: 'public', contentType: mime, addRandomSuffix: false, allowOverwrite: true })
  } else if (existing.url.startsWith('/uploads/')) {
    await fs.writeFile(path.join(process.cwd(), 'public', existing.url), buf)
  }
  const media = await prisma.media.update({ where: { id }, data: { mime, width, height, hash } })
  await audit(user.email, 'update', `media:${id}`, `${media.filename} (replaced)`)
  return toItem(media)
}

/** Crop an image in place (server-side via sharp; keeps the URL stable). `area` is
 *  in the stored image's pixels (from react-easy-crop's croppedAreaPixels). */
export async function cropMedia(id: number, area: { x: number; y: number; width: number; height: number }): Promise<MediaItem> {
  const user = await requireUser()
  const m = await prisma.media.findUnique({ where: { id } })
  if (!m) throw new Error('Media not found')
  if (!m.mime.startsWith('image/')) throw new Error('Only images can be cropped')
  let input: Buffer
  if (m.url.startsWith('http')) {
    input = Buffer.from(await (await fetch(m.url)).arrayBuffer())
  } else {
    input = await fs.readFile(path.join(process.cwd(), 'public', m.url))
  }
  const meta = await sharp(input).metadata()
  const left = Math.max(0, Math.round(area.x))
  const top = Math.max(0, Math.round(area.y))
  const width = Math.max(1, Math.min(Math.round(area.width), (meta.width ?? 99999) - left))
  const height = Math.max(1, Math.min(Math.round(area.height), (meta.height ?? 99999) - top))
  const buf = await sharp(input).extract({ left, top, width, height }).toBuffer()

  if (m.url.startsWith('http')) {
    if (!useBlob) throw new Error('Remote storage not configured')
    const pathname = new URL(m.url).pathname.replace(/^\//, '')
    await put(pathname, buf, { access: 'public', contentType: m.mime, addRandomSuffix: false, allowOverwrite: true })
  } else if (m.url.startsWith('/uploads/')) {
    await fs.writeFile(path.join(process.cwd(), 'public', m.url), buf)
  }
  const updated = await prisma.media.update({ where: { id }, data: { width, height, hash: crypto.createHash('sha256').update(buf).digest('hex') } })
  await audit(user.email, 'update', `media:${id}`, `${updated.filename} (cropped)`)
  return toItem(updated)
}

export async function updateMedia(id: number, patch: { alt?: string; filename?: string; folder?: string; tags?: string[] }): Promise<MediaItem> {
  const user = await requireUser()
  const data: { alt?: string; filename?: string; folder?: string; tags?: string[] } = {}
  if (typeof patch.alt === 'string') data.alt = patch.alt
  if (typeof patch.filename === 'string' && patch.filename.trim()) data.filename = patch.filename.trim()
  if (typeof patch.folder === 'string') data.folder = patch.folder.trim()
  if (Array.isArray(patch.tags)) data.tags = patch.tags.map((t) => t.trim()).filter(Boolean)
  const m = await prisma.media.update({ where: { id }, data })
  await audit(user.email, 'update', `media:${id}`, m.filename)
  return toItem(m)
}

export async function listFolders(): Promise<string[]> {
  await requireUser()
  const rows = await prisma.media.findMany({ where: { folder: { not: '' } }, select: { folder: true }, distinct: ['folder'] })
  return rows.map((r) => r.folder).sort()
}

export async function deleteMedia(id: number): Promise<void> {
  // Permanent + can orphan content references — admins only.
  const user = await requireAdmin()
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

/** Where is this media URL referenced? Powers the delete guard (prevents silent orphans). */
export async function findMediaUsage(url: string): Promise<string[]> {
  await requireUser()
  if (!url) return []
  const hits: string[] = []
  const labels: Record<string, string> = {
    siteSettings: 'Site Settings', homePage: 'Home Page', aboutPage: 'About Page', teamPage: 'Team Page', contactPage: 'Contact Page',
  }
  for (const s of await prisma.singleton.findMany()) {
    const inData = JSON.stringify(s.data ?? '').includes(url)
    const inDraft = s.draft != null && JSON.stringify(s.draft).includes(url)
    if (inData || inDraft) hits.push(labels[s.key] ?? s.key)
  }
  for (const p of await prisma.platform.findMany({ select: { name: true, data: true, draft: true } })) {
    const inData = JSON.stringify(p.data ?? '').includes(url)
    const inDraft = p.draft != null && JSON.stringify(p.draft).includes(url)
    if (inData || inDraft) hits.push(p.name)
  }
  return hits
}

export async function listMedia(opts?: { q?: string; take?: number; skip?: number; folder?: string; tag?: string }): Promise<MediaItem[]> {
  await requireUser()
  const q = opts?.q?.trim()
  const where: Record<string, unknown> = {}
  if (q) where.OR = [{ filename: { contains: q, mode: 'insensitive' } }, { alt: { contains: q, mode: 'insensitive' } }]
  if (opts?.folder) where.folder = opts.folder
  if (opts?.tag) where.tags = { has: opts.tag }
  const rows = await prisma.media.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: opts?.take ?? 200,
    skip: opts?.skip ?? 0,
  })
  return rows.map(toItem)
}
