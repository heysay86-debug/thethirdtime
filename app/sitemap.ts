/**
 * sitemap.xml 동적 생성
 *
 * Next.js App Router가 /sitemap.xml 요청 시 이 함수를 호출.
 * 검색엔진에 사이트 구조를 알려준다.
 *
 * 참고: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://saju-api-rough-shadow-6686.fly.dev';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/alt2`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,           // 메인 서비스 페이지 — 최우선
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2026-04-18'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2026-04-18'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/business`,
      lastModified: new Date('2026-04-18'),
      changeFrequency: 'yearly',
      priority: 0.1,
    },
  ];
}
