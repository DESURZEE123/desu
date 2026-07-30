export type AlbumPhoto = {
  id: string
  src: string
  alt: string
  title?: string
}

const CDN =
  'https://assets-cdn-01.marketup.cn/marketup/company/659/2026/0730/cu/5026743922694145'

export const album = {
  title: '相册',
  cover: `${CDN}/20260730210223380-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020590824315q5h3s7lth01h.jpg`,
  author: '王怡阳',
  date: '2026-07-30',
  description: '',
  photos: [
    {
      id: '1',
      src: `${CDN}/20260730210223380-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020590824315q5h3s7lth01h.jpg`,
      alt: '悬崖观景台俯瞰山谷',
      title: '悬崖观景',
    },
    {
      id: '2',
      src: `${CDN}/20260730210223366-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%8720260730205849240159ravnspuvmrl.jpg`,
      alt: '山间草地仰望山峰',
      title: '山间休憩',
    },
    {
      id: '3',
      src: `${CDN}/20260730210223367-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020585924115fd8akrk75w8b.jpg`,
      alt: '竹林绿意',
      title: '竹林',
    },
    {
      id: '4',
      src: `${CDN}/20260730210223369-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020582323915h65eii5rqg3l.jpg`,
      alt: '瀑布与溪水',
      title: '溪瀑',
    },
    {
      id: '5',
      src: `${CDN}/20260730210223370-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020590324215tjhruy0r07w9.jpg`,
      alt: '山脊徒步',
      title: '山脊徒步',
    },
    // {
    //   id: '6',
    //   src: `${CDN}/20260730210223367-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020581823815i0uqyen5vrij.jpg`,
    //   alt: '山径攀登',
    //   title: '山径',
    // },
    {
      id: '7',
      src: `${CDN}/20260730210223375-%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%872026073020591324415skx1cdl4vowo.jpg`,
      alt: '山顶远眺',
      title: '山顶远眺',
    },
  ] satisfies AlbumPhoto[],
}

/** 首页「生活瞬间」预览图（取相册前 4 张） */
export const lifePreviewPhotos = album.photos.slice(0, 4)
