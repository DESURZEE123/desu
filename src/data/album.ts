export type AlbumPhoto = {
  id: string
  src: string
  alt: string
  title?: string
}

export const album = {
  title: '相册',
  cover: '/photo.jpg',
  author: '王怡阳',
  date: '2026-01-12',
  description: '',
  photos: [
    { id: '1', src: '/photo.jpg', alt: '沙漠与雪山', title: '沙漠与雪山' },
    { id: '2', src: '/photo.jpg', alt: '远山云影', title: '远山云影' },
    { id: '3', src: '/photo.jpg', alt: '旷野光线', title: '旷野光线' },
    { id: '4', src: '/photo.jpg', alt: '旅途随拍', title: '旅途随拍' },
    { id: '5', src: '/photo.jpg', alt: '风沙与路', title: '风沙与路' },
    { id: '6', src: '/photo.jpg', alt: '天空与山脉', title: '天空与山脉' },
  ] satisfies AlbumPhoto[],
}
