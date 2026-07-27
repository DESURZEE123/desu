import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { Icon } from '../components/Icon'
import { album } from '../data/album'
import { profile } from '../data/profile'
import './AlbumPage.less'

export function AlbumPage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="album-page font-body-md selection:bg-primary/10">
      <SiteHeader />

      <div className="album-page__container">
        <div className="album-page__breadcrumb">
          <Link to="/">首页</Link>
          <span className="sep">/</span>
          <span className="current">相册</span>
        </div>

        <section className="album-page__card">
          <div className="album-page__hero">
            <img src={album.cover} alt="" />
            <div className="mask" />
            <div className="hero-content">
              <Icon name="photo_library" className="hero-icon material-symbols-outlined" />
              <h1>{album.title}</h1>
              <div className="meta">
                <span className="meta-item">
                  <Icon name="person" className="text-[14px]" />
                  {album.author}
                </span>
                <span className="meta-item">
                  <Icon name="calendar_today" className="text-[14px]" />
                  {album.date}
                </span>
                <span className="meta-item">
                  <Icon name="image" className="text-[14px]" />
                  {album.photos.length} 张
                </span>
              </div>
            </div>
          </div>

          <div className="album-page__body">
            {album.description ? <p className="desc">{album.description}</p> : null}
            <div className="album-page__grid">
              {album.photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  className="photo-btn"
                  onClick={() => setLightboxIndex(index)}
                >
                  <div className="photo-frame">
                    <img src={photo.src} alt={photo.alt} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="album-page__footer">
          <div className="name">
            {profile.name} {profile.nameEn}
          </div>
          <p className="copy">
            © 2026 {profile.name}. Built with Product Thinking & Professional Excellence.
          </p>
        </footer>
      </div>

      {lightboxIndex !== null && (
        <div className="album-lightbox" onClick={() => setLightboxIndex(null)}>
          <button
            type="button"
            className="lb-close"
            onClick={() => setLightboxIndex(null)}
            aria-label="关闭"
          >
            <Icon name="close" />
          </button>
          <button
            type="button"
            className="lb-prev"
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
            className="lb-img"
            src={album.photos[lightboxIndex].src}
            alt={album.photos[lightboxIndex].alt}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="lb-next"
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
