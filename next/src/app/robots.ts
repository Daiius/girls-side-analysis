import type { MetadataRoute } from 'next'

const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /profile はログインユーザ固有のページなのでクロール対象外
      disallow: '/profile',
    },
    sitemap: `${hostUrl}/sitemap.xml`,
  }
}
