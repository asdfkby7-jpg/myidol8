// Image Utility & GIF (움짤) Support Helper Functions

export interface GifSample {
  id: string;
  name: string;
  description: string;
  url: string;
}

/**
 * Check if an image URL or data URL is an animated GIF or animated SVG image
 */
export function isGifImage(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();

  // Check data URL mime types
  if (lower.startsWith('data:image/gif') || lower.startsWith('data:image/svg+xml')) {
    return true;
  }

  // Check file extensions or query parameters
  if (lower.includes('.gif') || lower.includes('format=gif')) {
    return true;
  }

  return false;
}

/**
 * Preset animated GIF samples for K-POP idol trainees
 * (Includes high quality animated vector SVG / GIF data URLs for instant testing)
 */
export const PRESET_SAMPLE_GIFS: GifSample[] = [
  {
    id: 'gif_stage_dance',
    name: '💃 화려한 메인 댄서 무대 움짤',
    description: '칼군무 중심의 네온 스테이지 댄스 퍼포먼스',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="20" fill="%230f172a"/><circle cx="120" cy="120" r="80" fill="%23ec4899" opacity="0.35"><animate attributeName="r" values="70;95;70" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.25;0.6;0.25" dur="1.2s" repeatCount="indefinite"/></circle><text x="120" y="105" font-size="60" text-anchor="middle" dominant-baseline="central">💃<animateTransform attributeName="transform" type="rotate" values="-15 120 105;15 120 105;-15 120 105" dur="0.6s" repeatCount="indefinite"/></text><text x="120" y="175" fill="%23f472b6" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">MAIN DANCER GIF</text></svg>',
  },
  {
    id: 'gif_ending_fairy',
    name: '💖 엔딩 요정 심쿵 하트 움짤',
    description: '음악방송 엔딩 샷 반짝이는 하트와 윙크',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="20" fill="%231e1b4b"/><text x="120" y="100" font-size="65" text-anchor="middle" dominant-baseline="central">💖<animateTransform attributeName="transform" type="scale" values="0.85;1.25;0.85" transform-origin="120 100" dur="0.8s" repeatCount="indefinite"/></text><text x="120" y="175" fill="%23a855f7" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">ENDING FAIRY GIF</text></svg>',
  },
  {
    id: 'gif_spotlight',
    name: '✨ 솔로 무대 스포트라이트 움짤',
    description: '화려한 무대 조명과 반짝이는 스타 아우라',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="20" fill="%23020617"/><polygon points="120,0 50,240 190,240" fill="%2338bdf8" opacity="0.45"><animate attributeName="opacity" values="0.2;0.75;0.2" dur="1s" repeatCount="indefinite"/></polygon><text x="120" y="115" font-size="60" text-anchor="middle" dominant-baseline="central">🌟<animateTransform attributeName="transform" type="scale" values="0.95;1.2;0.95" transform-origin="120 115" dur="0.5s" repeatCount="indefinite"/></text><text x="120" y="180" fill="%2338bdf8" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">SPOTLIGHT GIF</text></svg>',
  },
  {
    id: 'gif_vocal_mic',
    name: '🎤 라이브 보컬 스탠딩 마이크 움짤',
    description: '감성 파워 보컬 소울풀 라이브 퍼포먼스',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" rx="20" fill="%2314532d"/><text x="120" y="100" font-size="65" text-anchor="middle" dominant-baseline="central">🎤<animateTransform attributeName="transform" type="translate" values="0 -8;0 8;0 -8" dur="0.7s" repeatCount="indefinite"/></text><text x="120" y="175" fill="%234ade80" font-size="14" font-weight="900" font-family="sans-serif" text-anchor="middle">VOCAL LIVE GIF</text></svg>',
  },
];
