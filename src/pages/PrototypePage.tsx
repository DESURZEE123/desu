import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteHeader } from '../components/SiteHeader'
import { Icon } from '../components/Icon'
import { prototypes, prototypesPage } from '../data/prototypes'
import { profile } from '../data/profile'
import './PrototypePage.less'

export function PrototypePage() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  return (
    <div className="prototype-page font-body-md selection:bg-primary/10">
      <SiteHeader />

      <div className="prototype-page__container">
        <div className="prototype-page__breadcrumb">
          <Link to="/">首页</Link>
          <span className="sep">/</span>
          <span className="current">产品原型</span>
        </div>

        <section className="prototype-page__card">
          <div className="prototype-page__hero">
            <img src={prototypesPage.cover} alt="" />
            <div className="mask" />
            <div className="hero-content">
              <Icon name="draw" className="hero-icon material-symbols-outlined" />
              <h1>{prototypesPage.title}</h1>
              <div className="meta">
                <span className="meta-item">
                  <Icon name="person" className="text-[14px]" />
                  {prototypesPage.author}
                </span>
                <span className="meta-item">
                  <Icon name="layers" className="text-[14px]" />
                  {prototypes.length} 个
                </span>
              </div>
            </div>
          </div>

          <div className="prototype-page__body">
            {prototypesPage.description ? (
              <p className="desc">{prototypesPage.description}</p>
            ) : null}

            <div className="prototype-page__list">
              {prototypes.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className="prototype-item"
                  onClick={() => setLightboxIndex(index)}
                >
                  <div className="prototype-item__thumb">
                    <img src={item.cover} alt={item.title} />
                  </div>
                  <div className="prototype-item__content">
                    <h2>{item.title}</h2>
                    <p>{item.description}</p>
                    <div className="prototype-item__meta">
                      <span className="tools">{item.tools}</span>
                      <div className="tags">
                        {item.tags.map((tag) => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        <footer className="prototype-page__footer">
          <div className="name">
            {profile.name} {profile.nameEn}
          </div>
          <p className="copy">
            © 2026 {profile.name}. Built with Product Thinking & Professional Excellence.
          </p>
        </footer>
      </div>

      {lightboxIndex !== null && (
        <div className="prototype-lightbox" onClick={() => setLightboxIndex(null)}>
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
                i === null ? null : (i - 1 + prototypes.length) % prototypes.length,
              )
            }}
            aria-label="上一张"
          >
            <Icon name="chevron_left" />
          </button>
          <img
            className="lb-img"
            src={prototypes[lightboxIndex].cover}
            alt={prototypes[lightboxIndex].title}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className="lb-next"
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((i) =>
                i === null ? null : (i + 1) % prototypes.length,
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
