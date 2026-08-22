/**
 * List of famous real-life South Korean celebrities (idols, singers, actors, TV personalities, producers).
 * Trainee names must NOT overlap with real celebrities.
 * Special Rule: '윤도현' is explicitly sanitized to '윤도헌'.
 */

export const REAL_CELEBRITY_NAMES = new Set<string>([
  // Explicitly blocked celebrity names
  '윤도현', // Note: Will be auto-converted to '윤도헌'
  '이지은', // IU
  '김민지', // NewJeans Minji
  '박준형', // g.o.d Park Joon-hyung
  '최유나', // GFRIEND Yuju
  '강태양', // Taeyang
  '정수빈',
  '서아린', // Oh My Girl Arin
  '아이유',
  '이수만',
  '박진영',
  '방시혁',
  '양현석',
  '임영웅',
  '영탁',
  '이찬원',
  '김호중',
  '장민호',
  '정동원',
  '송가인',
  '장윤정',
  '홍진영',
  '유재석',
  '신동엽',
  '강호동',
  '이효리',
  '성시경',
  '신승훈',
  '조용필',
  '박보검',
  '변우석',
  '김수현',
  '차은우',
  '송중기',
  '현빈',
  '공유',
  '이민호',
  '지창욱',
  '박서준',
  '안효섭',
  '이종석',
  '남주혁',
  '정해인',
  '임시완',
  '도경수',
  '박형식',
  '옥택연',
  '이준호',
  '육성재',
  '차학연',
  '서강준',
  '강태오',
  '송강',
  '이도현',
  '황인엽',
  '로운',
  '김영대',
  '이재욱',
  '황민현',
  '강다니엘',
  '옹성우',
  '박지훈',
  '김재환',
  '하성운',
  '배진영',
  '이대휘',
  '박우진',
  '윤지성',
  '카리나',
  '윈터',
  '닝닝',
  '지젤',
  '안유진',
  '장원영',
  '설윤',
  '해원',
  '지수',
  '제니',
  '로제',
  '리사',
  '나연',
  '정연',
  '모모',
  '사나',
  '지효',
  '미나',
  '다현',
  '채영',
  '쯔위',
  '태연',
  '써니',
  '티파니',
  '효연',
  '유리',
  '수영',
  '윤아',
  '서현',
  '수지',
  '아이린',
  '슬기',
  '웬디',
  '조이',
  '예리',
  '유아',
  '미미',
  '승희',
  '아린',
  '설현',
  '청하',
  '세정',
  '소미',
  '은하',
  '신비',
  '소원',
  '예린',
  '엄지',
  '유주',
  '혜리',
  '선미',
  '현아',
  '지연',
  '은정',
  '효민',
  '보아',
  '엄정화',
  '이소라',
  '백지영',
  '거미',
  '소향',
  '박정현',
  '윤하',
  '권진아',
  '정은지',
  '안지영',
  '백예린',
  '이하이',
  '지코',
  '딘',
  '크러쉬',
  '그레이',
  '로꼬',
  '박재범',
  '창모',
  '비와이',
  '빈지노',
  '스윙스',
  '지드래곤',
  '태양',
  '대성',
  '슈가',
  '정국',
  '백현',
  '카이',
  '수호',
  '시우민',
  '첸',
  '찬열',
  '태용',
  '마크',
  '재현',
  '도영',
  '해찬',
  '재민',
  '원빈',
  '은석',
  '앤톤',
  '최산',
  '홍중',
  '방찬',
  '리노',
  '창빈',
  '현진',
  '필릭스',
  '승민',
  '서은광',
  '이민혁',
  '이창섭',
  '임현식',
  '육성재',
  '윤두준',
  '양요섭',
  '이기광',
  '손동운',
  '정용화',
  '이홍기',
  '이특',
  '은혁',
  '동해',
  '규현',
  '강타',
  '김태우',
  '윤계상',
  '손호영',
]);

/**
 * Sanitizes trainee name:
 * Explicit rule: '윤도현' -> '윤도헌'
 */
export function sanitizeTraineeName(rawName: string): string {
  if (!rawName) return '';
  let name = rawName.trim();
  if (name.includes('윤도현')) {
    name = name.replace(/윤도현/g, '윤도헌');
  }
  return name;
}

/**
 * Checks if a name is a real celebrity name (excluding '윤도헌').
 */
export function isCelebrityName(name: string): boolean {
  if (!name) return false;
  const sanitized = sanitizeTraineeName(name);
  
  // If original name was '윤도현', it is converted to '윤도헌' which is allowed!
  if (name.trim() === '윤도현') return false;

  return REAL_CELEBRITY_NAMES.has(sanitized);
}

/**
 * Validates and converts input name.
 */
export function validateAndSanitizeName(inputName: string): {
  finalName: string;
  isCelebrity: boolean;
  wasConverted: boolean;
  originalName: string;
} {
  const originalName = inputName ? inputName.trim() : '';
  const sanitized = sanitizeTraineeName(originalName);
  const wasConverted = originalName.includes('윤도현');
  
  const isCeleb = isCelebrityName(originalName);

  return {
    finalName: sanitized,
    isCelebrity: isCeleb,
    wasConverted,
    originalName,
  };
}

/**
 * Sanitizes an array of Trainees (e.g. from existing save state or initial load):
 * - Replaces '윤도현' with '윤도헌'
 * - Replaces real celebrity names with safe non-celebrity names
 */
export function sanitizeTraineesList<T extends { name: string; stageName?: string }>(trainees: T[]): T[] {
  if (!trainees || trainees.length === 0) return trainees;

  return trainees.map((t) => {
    let newName = t.name;
    let newStageName = t.stageName;

    if (newName && newName.includes('윤도현')) {
      newName = newName.replace(/윤도현/g, '윤도헌');
    }
    if (newStageName && newStageName.includes('윤도현')) {
      newStageName = newStageName.replace(/윤도현/g, '윤도헌');
    }

    if (isCelebrityName(newName)) {
      if (newName === '이지은') newName = '이지우';
      else if (newName === '김민지') newName = '김서연';
      else if (newName === '박준형') newName = '박준민';
      else if (newName === '최유나') newName = '최유아';
      else if (newName === '정수빈') newName = '정수아';
      else if (newName === '강태양') newName = '강태민';
      else if (newName === '서아린') newName = '서아경';
      else newName = '연습생' + Math.floor(Math.random() * 899 + 100);
    }

    if (newStageName && isCelebrityName(newStageName)) {
      newStageName = undefined;
    }

    if (newName !== t.name || newStageName !== t.stageName) {
      return { ...t, name: newName, stageName: newStageName };
    }
    return t;
  });
}
