import type { MetadataRoute } from 'next'

import { getCharacters } from '@/lib/characters'

const hostUrl = process.env.HOST_URL
  ?? (() => { throw new Error(`process.env.HOST_URL is null`) })();

// ページは 1 日 1 回 revalidate されるため、sitemap も同じ間隔で再生成する
export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const characters = await getCharacters();
  return [
    {
      url: `${hostUrl}/`,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...characters.map(c => ({
      // canonical / 内部リンクと同じく生の日本語 URL に揃える
      url: `${hostUrl}/${c.name}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ];
}
