// Fotos y videos: se comprimen en el propio iPhone antes de guardarse.
// Los archivos viven en IndexedDB (fuera del estado JSON) para que la app siga ligera.

import { createStore, get, set, del, keys } from 'idb-keyval'
import { useEffect, useState } from 'react'
import type { MediaMeta } from '../store/types'
import { uid } from './util'

let _store: ReturnType<typeof createStore> | undefined
const db = () => (_store ??= createStore('alba-media', 'files'))

export type MediaPurpose = 'moment' | 'avatar' | 'person' | 'proof'

/** Tamaño máximo (lado largo) y calidad según dónde se usa la imagen. */
const PRESETS: Record<MediaPurpose, { max: number; quality: number }> = {
  moment: { max: 1600, quality: 0.78 },
  proof: { max: 1280, quality: 0.75 },
  avatar: { max: 512, quality: 0.82 },
  person: { max: 512, quality: 0.8 },
}
const THUMB = { max: 360, quality: 0.7 }

export const VIDEO_MAX_SECONDS = 60
export const VIDEO_MAX_BYTES = 80 * 1024 * 1024

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
    } catch {
      /* algunos formatos no los decodifica; probamos con <img> */
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return img
  } finally {
    URL.revokeObjectURL(url)
  }
}

function sizeOf(src: ImageBitmap | HTMLImageElement | HTMLVideoElement) {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight }
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight }
  return { w: src.width, h: src.height }
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((res) => canvas.toBlob(res, type, quality))
}

/** Redimensiona y re-codifica: WebP si el navegador sabe, si no JPEG. */
async function encode(src: ImageBitmap | HTMLImageElement | HTMLVideoElement, max: number, quality: number) {
  const { w, h } = sizeOf(src)
  const scale = Math.min(1, max / Math.max(w, h))
  const width = Math.max(1, Math.round(w * scale))
  const height = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(src, 0, 0, width, height)
  let blob = await toBlob(canvas, 'image/webp', quality)
  if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality + 0.04)
  canvas.width = canvas.height = 0 // libera memoria en iOS
  if (!blob) throw new Error('No se pudo comprimir la imagen')
  return { blob, width, height }
}

export async function addImage(file: File, purpose: MediaPurpose): Promise<MediaMeta> {
  const p = PRESETS[purpose]
  const src = await decode(file)
  const full = await encode(src, p.max, p.quality)
  const thumb = await encode(src, THUMB.max, THUMB.quality)
  if ('close' in src) src.close()
  const id = uid()
  await set(`${id}:full`, full.blob, db())
  await set(`${id}:thumb`, thumb.blob, db())
  return {
    id,
    kind: 'image',
    mime: full.blob.type,
    width: full.width,
    height: full.height,
    bytes: full.blob.size + thumb.blob.size,
    originalBytes: file.size,
    createdAt: Date.now(),
  }
}

/** Videos: no se recodifican (Safari no lo hace de forma fiable); se limita duración y tamaño y se genera portada. */
export async function addVideo(file: File): Promise<MediaMeta> {
  if (file.size > VIDEO_MAX_BYTES) throw new Error(`El video pesa demasiado (máx. ${VIDEO_MAX_BYTES / 1024 / 1024} MB). Recórtalo en Fotos y vuelve a intentarlo.`)
  const url = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.preload = 'auto'
  video.src = url
  try {
    await new Promise<void>((res, rej) => {
      video.onloadedmetadata = () => res()
      video.onerror = () => rej(new Error('No se pudo leer el video'))
    })
    if (video.duration > VIDEO_MAX_SECONDS + 0.5)
      throw new Error(`Los videos pueden durar hasta ${VIDEO_MAX_SECONDS} segundos. Recórtalo en Fotos y vuelve a intentarlo.`)
    video.currentTime = Math.min(0.5, video.duration / 2)
    await new Promise<void>((res) => {
      video.onseeked = () => res()
      setTimeout(res, 1500)
    })
    const thumb = await encode(video, THUMB.max, THUMB.quality)
    const id = uid()
    await set(`${id}:full`, file, db())
    await set(`${id}:thumb`, thumb.blob, db())
    return {
      id,
      kind: 'video',
      mime: file.type || 'video/mp4',
      width: video.videoWidth,
      height: video.videoHeight,
      bytes: file.size + thumb.blob.size,
      originalBytes: file.size,
      duration: video.duration,
      createdAt: Date.now(),
    }
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function addFile(file: File, purpose: MediaPurpose): Promise<MediaMeta> {
  if (file.type.startsWith('video/')) {
    if (purpose !== 'moment') throw new Error('Aquí solo se pueden poner fotos.')
    return addVideo(file)
  }
  return addImage(file, purpose)
}

export async function removeMediaFiles(id: string) {
  await del(`${id}:full`, db())
  await del(`${id}:thumb`, db())
  urlCache.delete(`${id}:full`)
  urlCache.delete(`${id}:thumb`)
}

export async function getBlob(id: string, size: 'full' | 'thumb'): Promise<Blob | undefined> {
  return get(`${id}:${size}`, db())
}

export async function allMediaKeys(): Promise<string[]> {
  return (await keys(db())).map(String)
}

export async function putBlob(key: string, blob: Blob) {
  await set(key, blob, db())
}

const urlCache = new Map<string, string>()

/** URL de objeto para mostrar una foto. Se cachea para no crear miles de URLs. */
export function useMediaUrl(id: string | undefined, size: 'full' | 'thumb' = 'thumb') {
  const key = id ? `${id}:${size}` : ''
  const [url, setUrl] = useState<string | undefined>(() => (key ? urlCache.get(key) : undefined))
  useEffect(() => {
    if (!key || !id) return setUrl(undefined)
    const cached = urlCache.get(key)
    if (cached) return setUrl(cached)
    let alive = true
    getBlob(id, size).then((b) => {
      if (!b || !alive) return
      const u = URL.createObjectURL(b)
      urlCache.set(key, u)
      setUrl(u)
    })
    return () => {
      alive = false
    }
  }, [key, id, size])
  return url
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export async function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.onerror = rej
    r.readAsDataURL(b)
  })
}

export async function dataUrlToBlob(d: string): Promise<Blob> {
  return (await fetch(d)).blob()
}
