/**
 * AI Helper for generating dynamic music critic reviews, netizen comments, and news articles
 */

export async function fetchAiNews(prompt: string, type: 'NEWS' | 'REVIEW' | 'SCANDAL'): Promise<string> {
  try {
    const res = await fetch('/api/gemini/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type }),
    });
    
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.text) {
        return data.text.trim();
      }
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to local news generator:', err);
  }
  
  // Local Rule-Based Fallback
  if (type === 'REVIEW') {
    return `[음악 평론가 리포트] 트렌디한 비트와 완성도 높은 아티스트의 전달력이 돋보이는 수작입니다. K-Pop 시장의 기대를 한 몸에 받고 있습니다.`;
  } else if (type === 'SCANDAL') {
    return `[긴급 속보] 팬들의 관심 속에 세간의 눈길을 끌고 있는 소식이 전해졌습니다. 소속사는 조속한 대응을 준비 중입니다.`;
  }
  return `[엔터 뉴스] 글로벌 K-Pop 시장에서 괄목할 만한 성과를 이끌어내며 대중의 호평이 이어지고 있습니다.`;
}
