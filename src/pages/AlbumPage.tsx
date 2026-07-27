import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { Icon } from '../components/Icon'
import { album } from '../data/album'
import { profile } from '../data/profile'

export function AlbumPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#eef1f6] font-body-md text-body-md text-on-surface selection:bg-primary/10">
      <SiteHeader />

      <div className="mx-auto max-w-[1280px] space-y-6 px-6 py-8 lg:px-10">
        <div className="text-sm text-on-surface-variant">
          <Link to="/" className="hover:text-primary">
            首页
          </Link>
          <span className="mx-2 text-outline">/</span>
          <span className="text-primary">相册</span>
        </div>

        <section className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(27,43,58,0.06)]">
          <div className="relative h-56 overflow-hidden md:h-72">
            <img
              src={album.cover}
              alt=""
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/80 via-primary/45 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8">
              <Icon name="photo_library" className="mb-3 text-3xl text-white/70" />
              <h1 className="font-headline-xl text-4xl text-white md:text-5xl">{album.title}</h1>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <Icon name="person" className="text-[14px]" />
                  {album.author}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <Icon name="calendar_today" className="text-[14px]" />
                  {album.date}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white backdrop-blur-sm">
                  <Icon name="image" className="text-[14px]" />
                  {album.photos.length} 张
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <p className="mb-6 text-on-surface-variant">{album.description}</p>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {album.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="group overflow-hidden rounded-xl bg-surface-container-low shadow-[0_6px_18px_rgba(27,43,58,0.08)] transition-transform hover:-translate-y-0.5"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={photo.src}
                      alt={photo.alt}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="rounded-2xl bg-white px-8 py-6 shadow-[0_8px_30px_rgba(27,43,58,0.06)]">
          <div className="font-bold text-primary">
            {profile.name} {profile.nameEn}
          </div>
          <p className="text-sm text-on-surface-variant">
            © 2026 {profile.name}. Built with Product Thinking & Professional Excellence.
          </p>
        </footer>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            onClick={() => setLightboxIndex(null)}
            aria-label="关闭"
          >
            <Icon name="close" />
          </button>
          <button
            type="button"
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:left-8"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((i) =>
                i === null ? null : (i - 1 + album.photos.length) % album.photos.length,
              )
            }}
            aria-label="上一张"
          >
            <Icon name="chevron_left" />
          </button>
          <img
            src={album.photos[lightboxIndex].src}
            alt={album.photos[lightboxIndex].alt}
            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="absolute right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 md:right-8"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((i) =>
                i === null ? null : (i + 1) % album.photos.length,
              )
            }}
            aria-label="下一张"
          >
            <Icon name="chevron_right" />
          </button>
        </div>
      )}
    </div>
  )
}
