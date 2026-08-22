import { Trainee } from '../types';
import { isCelebrityName, sanitizeTraineeName } from './celebrityNameFilter';

const LAST_NAMES = [
  '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  '한', '오', '서', '신', '권', '황', '안', '송', '류', '전',
  '홍', '고', '문', '양', '손', '배', '백', '허', '유', '남'
];

const MALE_FIRST_NAMES = [
  '민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서',
  '준우', '현우', '도헌', '건우', '우진', '선우', '서진', '유준', '정우', '승우',
  '승현', '시현', '민재', '은우', '유찬', '지환', '승민', '지우', '유호', '태민',
  '재성', '강민', '동현', '준혁', '태현', '세준', '하민', '지안', '은찬', '현준'
];

const FEMALE_FIRST_NAMES = [
  '서연', '서윤', '지우', '서현', '하은', '하윤', '민서', '지유', '윤서', '채원',
  '지아', '은서', '다은', '소율', '예은', '수아', '지안', '소윤', '예린',
  '유나', '사랑', '하린', '예원', '지원', '혜원', '채은', '나은', '가은',
  '아영', '서아', '채아', '다인', '연우', '소은', '유주', '보민', '지율'
];

const PERSONALITIES = [
  '밝고 긍정적이며 팀의 사기를 북돋움',
  '완벽주의 보컬리스트, 솔로 능력 출중',
  '파워풀한 메인댄서, 열정 과다',
  '엉뚱하지만 상큼한 매력, 덕후 몰이형',
  '절대음감을 지닌 천재 연습생',
  'SNS 인플루언서 출신의 카리스마 래퍼',
  '비주얼 센터, 광고계의 러브콜 집중',
  '자작곡 능력을 보유한 든든한 리더형',
  '감성적인 미성 보컬과 섬세한 표현력',
  '칼군무 중심의 차세대 댄스 신동',
  '무대 위에서 스위치가 켜지는 반전 카리스마',
  '어떤 컨셉이든 소화해내는 꿀음색 보컬'
];

const AVATAR_COLORS = [
  'bg-rose-500', 'bg-amber-500', 'bg-indigo-500', 'bg-emerald-500',
  'bg-cyan-500', 'bg-orange-500', 'bg-purple-500', 'bg-teal-500',
  'bg-pink-500', 'bg-violet-500', 'bg-sky-500', 'bg-lime-500'
];

const AVATAR_ICONS = ['Sparkles', 'Mic', 'Flame', 'Star', 'Music', 'Zap', 'Heart', 'Disc'];

export function getAllExistingNames(
  existingTrainees: Trainee[] = [],
  existingPool: Omit<Trainee, 'id' | 'joinedWeek'>[] = []
): Set<string> {
  const namesSet = new Set<string>();

  existingTrainees.forEach(t => {
    if (t.name) namesSet.add(sanitizeTraineeName(t.name.trim()));
    if (t.stageName) namesSet.add(sanitizeTraineeName(t.stageName.trim()));
  });

  existingPool.forEach(p => {
    if (p.name) namesSet.add(sanitizeTraineeName(p.name.trim()));
    if (p.stageName) namesSet.add(sanitizeTraineeName(p.stageName.trim()));
  });

  return namesSet;
}

export function generateUniqueTraineeName(
  existingNames: Set<string>,
  gender: 'MALE' | 'FEMALE'
): string {
  const firstNames = gender === 'MALE' ? MALE_FIRST_NAMES : FEMALE_FIRST_NAMES;

  let attempts = 0;
  while (attempts < 1000) {
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    let fullName = `${lastName}${firstName}`;

    // Auto convert '윤도현' -> '윤도헌'
    fullName = sanitizeTraineeName(fullName);

    // Reject real celebrity names or already existing names
    if (!existingNames.has(fullName) && !isCelebrityName(fullName)) {
      existingNames.add(fullName);
      return fullName;
    }
    attempts++;
  }

  // Fallback in case of collision extreme overflow
  let counter = 1;
  while (true) {
    const fallbackName = `연습생${counter}`;
    if (!existingNames.has(fallbackName)) {
      existingNames.add(fallbackName);
      return fallbackName;
    }
    counter++;
  }
}

export function createUniqueCandidate(
  existingTrainees: Trainee[],
  existingPool: Omit<Trainee, 'id' | 'joinedWeek'>[],
  forcedGender?: 'MALE' | 'FEMALE'
): Omit<Trainee, 'id' | 'joinedWeek'> {
  const existingNames = getAllExistingNames(existingTrainees, existingPool);
  const gender: 'MALE' | 'FEMALE' = forcedGender || (Math.random() > 0.5 ? 'FEMALE' : 'MALE');
  const name = generateUniqueTraineeName(existingNames, gender);

  const vocal = Math.floor(Math.random() * 35) + 48; // 48 ~ 82 (모든 능력치 7 적게 시작)
  const dance = Math.floor(Math.random() * 35) + 48; // 48 ~ 82
  const charisma = Math.floor(Math.random() * 35) + 48; // 48 ~ 82
  const visual = Math.floor(Math.random() * 35) + 48; // 48 ~ 82

  return {
    name,
    age: Math.floor(Math.random() * 6) + 17, // 17 ~ 22세
    gender,
    avatarBg: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    avatarIcon: AVATAR_ICONS[Math.floor(Math.random() * AVATAR_ICONS.length)],
    personality: PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)],
    vocal,
    dance,
    charisma,
    visual,
    stamina: 90 + Math.floor(Math.random() * 10), // 90 ~ 99
    mental: 85 + Math.floor(Math.random() * 15),  // 85 ~ 99
    popularity: Math.floor(Math.random() * 30) + 10,
    fandom: Math.floor(Math.random() * 50) + 10,
    upkeep: 220000 + Math.floor(Math.random() * 20000),
    status: 'TRAINING',
  };
}

export function createSpecialCandidate(
  existingTrainees: Trainee[],
  existingPool: Omit<Trainee, 'id' | 'joinedWeek'>[],
  forcedGender?: 'MALE' | 'FEMALE'
): Omit<Trainee, 'id' | 'joinedWeek'> {
  const existingNames = getAllExistingNames(existingTrainees, existingPool);
  const gender: 'MALE' | 'FEMALE' = forcedGender || (Math.random() > 0.5 ? 'FEMALE' : 'MALE');
  const name = generateUniqueTraineeName(existingNames, gender);

  // 1. Basic stats 73~80 (모든 능력치 7 적게 시작)
  const stats = {
    vocal: Math.floor(Math.random() * 8) + 73, // 73 ~ 80
    dance: Math.floor(Math.random() * 8) + 73,
    charisma: Math.floor(Math.random() * 8) + 73,
    visual: Math.floor(Math.random() * 8) + 73,
  };

  // 2. One stat is 81 ~ 85 (7 적게 적용)
  const statKeys: ('vocal' | 'dance' | 'charisma' | 'visual')[] = ['vocal', 'dance', 'charisma', 'visual'];
  const primaryStat = statKeys[Math.floor(Math.random() * statKeys.length)];
  stats[primaryStat] = Math.floor(Math.random() * 5) + 81; // 81 ~ 85

  // 3. Fandom 300 ~ 1900
  const fandom = Math.floor(Math.random() * 1601) + 300; // 300 ~ 1900

  // 4. Upkeep proportional to fandom: ₩380,000 ~ ₩750,000
  const progress = (fandom - 300) / 1600; // 0.0 ~ 1.0
  const upkeep = Math.round(380000 + progress * 370000);

  // 5. Scout Cost: ₩10,000,000 ~ ₩100,000,000
  const scoutCost = Math.round(10000000 + progress * 90000000);

  const statNamesMap: Record<string, string> = {
    vocal: '천상의 보컬',
    dance: '칼군무 메인댄서',
    charisma: '무대 폭발 카리스마',
    visual: '독보적 비주얼 센터',
  };

  return {
    name,
    age: Math.floor(Math.random() * 5) + 19, // 19 ~ 23세 (만19세 이상)
    gender,
    avatarBg: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    avatarIcon: AVATAR_ICONS[Math.floor(Math.random() * AVATAR_ICONS.length)],
    personality: `★ [특별 연습생: ${statNamesMap[primaryStat]}] ${PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)]}`,
    vocal: stats.vocal,
    dance: stats.dance,
    charisma: stats.charisma,
    visual: stats.visual,
    stamina: 95 + Math.floor(Math.random() * 5), // 95 ~ 99
    mental: 90 + Math.floor(Math.random() * 10),  // 90 ~ 99
    popularity: Math.floor(Math.random() * 20) + 50,
    fandom,
    upkeep,
    scoutCost,
    status: 'TRAINING',
  };
}

