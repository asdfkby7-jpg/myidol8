export interface CountryNode {
  id: string;
  name: string;
  flag: string;
  x: number; // 0 ~ 1000
  y: number; // 0 ~ 520
  region: 'ASIA' | 'EUROPE' | 'AMERICA' | 'AFRICA' | 'OCEANIA' | 'MIDDLE_EAST';
  minProfitableFandom: number; // 5000, 10000, 20000, 30000, 100000
  baseCapacity: number;
  baseTicketPrice: number;
  localVenueCost: number;
}

export const HOME_COUNTRY: CountryNode = {
  id: 'KR',
  name: '대한민국',
  flag: '🇰🇷',
  x: 825,
  y: 205,
  region: 'ASIA',
  minProfitableFandom: 0,
  baseCapacity: 15000,
  baseTicketPrice: 110000,
  localVenueCost: 15000000,
};

// Countries capable of >50,000,000 KRW profit if group Stamina & Mental >= 95
export const HIGH_PROFIT_COUNTRY_IDS = [
  'US', 'BR', 'CN', 'JP', 'RU', 'GB', 'DE', 'FR', 'SA', 'LY', 'ZA', 'AU', 'NO'
];

export const WORLD_TOUR_COUNTRIES: CountryNode[] = [
  // --- 3,000 / 5,000 Fandom Profitable Countries (Tier 1) ---
  {
    id: 'JP',
    name: '일본',
    flag: '🇯🇵',
    x: 875,
    y: 205,
    region: 'ASIA',
    minProfitableFandom: 3000,
    baseCapacity: 35000,
    baseTicketPrice: 140000,
    localVenueCost: 25000000,
  },
  {
    id: 'CN',
    name: '중국',
    flag: '🇨🇳',
    x: 760,
    y: 215,
    region: 'ASIA',
    minProfitableFandom: 3000,
    baseCapacity: 40000,
    baseTicketPrice: 130000,
    localVenueCost: 30000000,
  },
  {
    id: 'US',
    name: '미국',
    flag: '🇺🇸',
    x: 210,
    y: 185,
    region: 'AMERICA',
    minProfitableFandom: 5000,
    baseCapacity: 50000,
    baseTicketPrice: 180000,
    localVenueCost: 50000000,
  },
  {
    id: 'GB',
    name: '영국',
    flag: '🇬🇧',
    x: 415,
    y: 145,
    region: 'EUROPE',
    minProfitableFandom: 5000,
    baseCapacity: 30000,
    baseTicketPrice: 170000,
    localVenueCost: 40000000,
  },
  {
    id: 'DE',
    name: '독일',
    flag: '🇩🇪',
    x: 460,
    y: 155,
    region: 'EUROPE',
    minProfitableFandom: 5000,
    baseCapacity: 28000,
    baseTicketPrice: 160000,
    localVenueCost: 35000000,
  },
  {
    id: 'FR',
    name: '프랑스',
    flag: '🇫🇷',
    x: 430,
    y: 170,
    region: 'EUROPE',
    minProfitableFandom: 5000,
    baseCapacity: 28000,
    baseTicketPrice: 165000,
    localVenueCost: 36000000,
  },
  {
    id: 'SA',
    name: '사우디아라비아',
    flag: '🇸🇦',
    x: 560,
    y: 255,
    region: 'MIDDLE_EAST',
    minProfitableFandom: 5000,
    baseCapacity: 32000,
    baseTicketPrice: 175000,
    localVenueCost: 42000000,
  },

  // --- 10,000 Fandom Profitable Countries (Tier 2) ---
  {
    id: 'RU',
    name: '러시아',
    flag: '🇷🇺',
    x: 680,
    y: 110,
    region: 'EUROPE',
    minProfitableFandom: 10000,
    baseCapacity: 25000,
    baseTicketPrice: 140000,
    localVenueCost: 30000000,
  },
  {
    id: 'IN',
    name: '인도',
    flag: '🇮🇳',
    x: 685,
    y: 260,
    region: 'ASIA',
    minProfitableFandom: 10000,
    baseCapacity: 35000,
    baseTicketPrice: 120000,
    localVenueCost: 28000000,
  },
  {
    id: 'BR',
    name: '브라질',
    flag: '🇧🇷',
    x: 320,
    y: 350,
    region: 'AMERICA',
    minProfitableFandom: 10000,
    baseCapacity: 38000,
    baseTicketPrice: 150000,
    localVenueCost: 40000000,
  },
  {
    id: 'CA',
    name: '캐나다',
    flag: '🇨🇦',
    x: 200,
    y: 120,
    region: 'AMERICA',
    minProfitableFandom: 10000,
    baseCapacity: 28000,
    baseTicketPrice: 165000,
    localVenueCost: 38000000,
  },
  {
    id: 'AU',
    name: '오스트레일리아',
    flag: '🇦🇺',
    x: 860,
    y: 390,
    region: 'OCEANIA',
    minProfitableFandom: 10000,
    baseCapacity: 30000,
    baseTicketPrice: 160000,
    localVenueCost: 35000000,
  },
  {
    id: 'ZA',
    name: '남아프리카공화국',
    flag: '🇿🇦',
    x: 520,
    y: 420,
    region: 'AFRICA',
    minProfitableFandom: 10000,
    baseCapacity: 26000,
    baseTicketPrice: 145000,
    localVenueCost: 32000000,
  },

  // --- 20,000 Fandom Profitable Countries (Tier 3) ---
  {
    id: 'IT',
    name: '이탈리아',
    flag: '🇮🇹',
    x: 465,
    y: 190,
    region: 'EUROPE',
    minProfitableFandom: 20000,
    baseCapacity: 24000,
    baseTicketPrice: 155000,
    localVenueCost: 32000000,
  },
  {
    id: 'UA',
    name: '우크라이나',
    flag: '🇺🇦',
    x: 525,
    y: 160,
    region: 'EUROPE',
    minProfitableFandom: 20000,
    baseCapacity: 22000,
    baseTicketPrice: 135000,
    localVenueCost: 28000000,
  },
  {
    id: 'AR',
    name: '아르헨티나',
    flag: '🇦🇷',
    x: 285,
    y: 430,
    region: 'AMERICA',
    minProfitableFandom: 20000,
    baseCapacity: 25000,
    baseTicketPrice: 135000,
    localVenueCost: 28000000,
  },
  {
    id: 'NO',
    name: '노르웨이',
    flag: '🇳🇴',
    x: 455,
    y: 110,
    region: 'EUROPE',
    minProfitableFandom: 20000,
    baseCapacity: 20000,
    baseTicketPrice: 175000,
    localVenueCost: 35000000,
  },
  {
    id: 'MN',
    name: '몽골',
    flag: '🇲🇳',
    x: 740,
    y: 170,
    region: 'ASIA',
    minProfitableFandom: 20000,
    baseCapacity: 18000,
    baseTicketPrice: 120000,
    localVenueCost: 20000000,
  },

  // --- 30,000 Fandom Profitable Countries (Tier 4) ---
  {
    id: 'MA',
    name: '모로코',
    flag: '🇲🇦',
    x: 390,
    y: 230,
    region: 'AFRICA',
    minProfitableFandom: 30000,
    baseCapacity: 20000,
    baseTicketPrice: 130000,
    localVenueCost: 25000000,
  },
  {
    id: 'EG',
    name: '이집트',
    flag: '🇪🇬',
    x: 530,
    y: 250,
    region: 'AFRICA',
    minProfitableFandom: 30000,
    baseCapacity: 22000,
    baseTicketPrice: 135000,
    localVenueCost: 26000000,
  },
  {
    id: 'DZ',
    name: '알제리',
    flag: '🇩🇿',
    x: 425,
    y: 240,
    region: 'AFRICA',
    minProfitableFandom: 30000,
    baseCapacity: 18000,
    baseTicketPrice: 125000,
    localVenueCost: 23000000,
  },
  {
    id: 'MX',
    name: '멕시코',
    flag: '🇲🇽',
    x: 195,
    y: 235,
    region: 'AMERICA',
    minProfitableFandom: 30000,
    baseCapacity: 32000,
    baseTicketPrice: 140000,
    localVenueCost: 30000000,
  },
  {
    id: 'PL',
    name: '폴란드',
    flag: '🇵🇱',
    x: 485,
    y: 150,
    region: 'EUROPE',
    minProfitableFandom: 30000,
    baseCapacity: 20000,
    baseTicketPrice: 140000,
    localVenueCost: 26000000,
  },
  {
    id: 'NG',
    name: '나이지리아',
    flag: '🇳🇬',
    x: 455,
    y: 300,
    region: 'AFRICA',
    minProfitableFandom: 30000,
    baseCapacity: 18000,
    baseTicketPrice: 115000,
    localVenueCost: 21000000,
  },
  {
    id: 'NZ',
    name: '뉴질랜드',
    flag: '🇳🇿',
    x: 940,
    y: 430,
    region: 'OCEANIA',
    minProfitableFandom: 30000,
    baseCapacity: 15000,
    baseTicketPrice: 150000,
    localVenueCost: 25000000,
  },

  // --- 100,000 Fandom Profitable Countries (Tier 5 - All remaining) ---
  {
    id: 'TH',
    name: '태국',
    flag: '🇹🇭',
    x: 750,
    y: 275,
    region: 'ASIA',
    minProfitableFandom: 100000,
    baseCapacity: 22000,
    baseTicketPrice: 115000,
    localVenueCost: 22000000,
  },
  {
    id: 'VN',
    name: '베트남',
    flag: '🇻🇳',
    x: 765,
    y: 275,
    region: 'ASIA',
    minProfitableFandom: 100000,
    baseCapacity: 20000,
    baseTicketPrice: 110000,
    localVenueCost: 20000000,
  },
  {
    id: 'MY',
    name: '말레이시아',
    flag: '🇲🇾',
    x: 765,
    y: 310,
    region: 'ASIA',
    minProfitableFandom: 100000,
    baseCapacity: 19000,
    baseTicketPrice: 120000,
    localVenueCost: 21000000,
  },
  {
    id: 'ID',
    name: '인도네시아',
    flag: '🇮🇩',
    x: 780,
    y: 335,
    region: 'ASIA',
    minProfitableFandom: 100000,
    baseCapacity: 25000,
    baseTicketPrice: 115000,
    localVenueCost: 24000000,
  },
  {
    id: 'KZ',
    name: '카자흐스탄',
    flag: '🇰🇿',
    x: 650,
    y: 175,
    region: 'ASIA',
    minProfitableFandom: 100000,
    baseCapacity: 18000,
    baseTicketPrice: 125000,
    localVenueCost: 22000000,
  },
  {
    id: 'IR',
    name: '이란',
    flag: '🇮🇷',
    x: 590,
    y: 220,
    region: 'MIDDLE_EAST',
    minProfitableFandom: 100000,
    baseCapacity: 18000,
    baseTicketPrice: 120000,
    localVenueCost: 22000000,
  },
  {
    id: 'TR',
    name: '터키',
    flag: '🇹🇷',
    x: 530,
    y: 195,
    region: 'MIDDLE_EAST',
    minProfitableFandom: 100000,
    baseCapacity: 22000,
    baseTicketPrice: 130000,
    localVenueCost: 25000000,
  },
  {
    id: 'SE',
    name: '스웨덴',
    flag: '🇸🇪',
    x: 475,
    y: 115,
    region: 'EUROPE',
    minProfitableFandom: 100000,
    baseCapacity: 18000,
    baseTicketPrice: 165000,
    localVenueCost: 30000000,
  },
  {
    id: 'ES',
    name: '스페인',
    flag: '🇪🇸',
    x: 405,
    y: 195,
    region: 'EUROPE',
    minProfitableFandom: 100000,
    baseCapacity: 22000,
    baseTicketPrice: 150000,
    localVenueCost: 28000000,
  },
  {
    id: 'LY',
    name: '리비아',
    flag: '🇱🇾',
    x: 480,
    y: 245,
    region: 'AFRICA',
    minProfitableFandom: 100000,
    baseCapacity: 15000,
    baseTicketPrice: 120000,
    localVenueCost: 20000000,
  },
  {
    id: 'CD',
    name: '콩고',
    flag: '🇨🇩',
    x: 490,
    y: 330,
    region: 'AFRICA',
    minProfitableFandom: 100000,
    baseCapacity: 16000,
    baseTicketPrice: 110000,
    localVenueCost: 20000000,
  },
];

/**
 * Calculates Euclidean distance on map coordinates (0~1000, 0~520).
 * Map units roughly scale to distance.
 */
export function calculateMapDistance(from: CountryNode, to: CountryNode): number {
  const dx = from.x - to.x;
  const dy = from.y - to.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates investment cost for establishing an Agency Overseas Branch in a country.
 * Cheapest is 20억 KRW (2,000,000,000 KRW), most expensive is 100억 KRW (10,000,000,000 KRW)
 * depending on distance from Korea.
 */
export function calculateBranchCost(country: CountryNode): number {
  const distFromKorea = calculateMapDistance(HOME_COUNTRY, country);
  // Min map dist is around 50 (Japan), Max map dist is around 620 (Argentina/Brazil)
  const distRatio = Math.min(1, Math.max(0, (distFromKorea - 50) / 570));
  const minCost = 2000000000; // 20억 KRW
  const maxCost = 10000000000; // 100억 KRW
  const cost = minCost + Math.round(distRatio * (maxCost - minCost));
  return Math.round(cost / 100000000) * 100000000; // Round nicely to 100 million KRW increments
}

/**
 * Calculate fuel surcharge (유류할증료) proportional to distance from South Korea.
 * Distance range: ~50 (Japan) to ~620 (South America/Brazil).
 * Fuel surcharge range: ₩200,000 (20만원) to ₩3,000,000 (300만원).
 */
export function calculateFuelSurcharge(country: CountryNode): number {
  const distFromKorea = calculateMapDistance(HOME_COUNTRY, country);
  const distRatio = Math.min(1, Math.max(0, (distFromKorea - 50) / 570));
  const minFuel = 200000;   // 20만원
  const maxFuel = 3000000;  // 300만원
  return Math.round(minFuel + distRatio * (maxFuel - minFuel));
}

/**
 * Calculate flight cost for a single leg between two countries.
 */
export function calculateLegFlightCost(from: CountryNode, to: CountryNode, numMembers: number): number {
  const dist = calculateMapDistance(from, to);
  
  // Base flight setup fee + distance fee
  const baseFlightFee = 3000000; // 3,000,000 KRW
  const costPerMapUnit = 45000;  // 45,000 KRW per map unit
  const memberMultiplier = 1 + (numMembers - 1) * 0.3; // member scaling
  
  const rawCost = (baseFlightFee + dist * costPerMapUnit) * memberMultiplier;
  return Math.round(rawCost);
}

/**
 * Helper to check if a country is profitable for a given fandom level.
 * Rule:
 * - fandom < 3000: ALL countries are in deficit
 * - 3000 <= fandom < 5000: ONLY China (CN) and Japan (JP) are narrowly profitable
 * - fandom >= 5000: Countries are profitable if fandom >= minProfitableFandom
 */
export function isCountryProfitable(country: CountryNode, fandom: number): boolean {
  if (fandom < 3000) return false;
  if (fandom < 5000) {
    return country.id === 'JP' || country.id === 'CN';
  }
  return fandom >= country.minProfitableFandom;
}

/**
 * Calculate estimated gross concert revenue and net profit for a country given current group fandom and member conditions.
 */
export function calculateCountryConcertResult(
  country: CountryNode,
  fromCountry: CountryNode,
  fandom: number,
  numMembers: number,
  avgStamina: number = 100,
  avgMental: number = 100,
  hasBranch: boolean = false
) {
  const isProfitableTierMet = isCountryProfitable(country, fandom);
  const flightCost = calculateLegFlightCost(fromCountry, country, numMembers);
  const venueCost = country.localVenueCost;
  const fuelSurcharge = calculateFuelSurcharge(country); // 대한민국 기준 거리 비례 유류할증료 (20만 ~ 300만원)
  const totalCost = flightCost + venueCost + fuelSurcharge;

  let netProfit = 0;
  let grossRevenue = 0;
  let expectedAudience = 0;

  if (!isProfitableTierMet) {
    // Deficit case
    const reqFandom = (country.id === 'JP' || country.id === 'CN') ? 3000 : Math.max(5000, country.minProfitableFandom);
    const deficitRatio = Math.min(0.85, Math.max(0.2, fandom / reqFandom));
    grossRevenue = Math.round(totalCost * (0.55 + deficitRatio * 0.35));
    expectedAudience = Math.min(country.baseCapacity, Math.round(grossRevenue / country.baseTicketPrice));
    netProfit = grossRevenue - totalCost;
    if (netProfit >= 0) {
      netProfit = -1500000;
      grossRevenue = totalCost + netProfit;
    }
  } else {
    // Profitable case
    if (fandom < 5000) {
      // 3000 <= fandom < 5000 (China & Japan only)
      // "경비를 제외하고 가까스로 약간의 흑자가 발생"
      const progress = (fandom - 3000) / 2000; // 0 ~ 1
      const baseProfit = Math.round(1000000 + progress * 3500000); // +100만 ~ +450만원 흑자
      grossRevenue = totalCost + baseProfit;
      expectedAudience = Math.min(country.baseCapacity, Math.round(grossRevenue / country.baseTicketPrice));
      netProfit = grossRevenue - totalCost;
    } else {
      // fandom >= 5000
      const fandomRatio = Math.min(2.5, fandom / country.minProfitableFandom);
      const attendanceRatio = Math.min(1.0, 0.70 + (fandomRatio - 1) * 0.20);
      expectedAudience = Math.min(country.baseCapacity, Math.round(country.baseCapacity * attendanceRatio));
      grossRevenue = Math.round(expectedAudience * country.baseTicketPrice);
      netProfit = grossRevenue - totalCost;

      if (netProfit <= 0) {
        netProfit = 2000000;
        grossRevenue = totalCost + netProfit;
      }

      // "그룹 팬클럽 5000명에 도달하더라도 흑자 폭은 크지 않으며..."
      if (fandom < 10000) {
        const sub10kMaxProfit = Math.round(12000000 + ((fandom - 5000) / 5000) * 28000000);
        if (netProfit > sub10kMaxProfit) {
          netProfit = sub10kMaxProfit;
          grossRevenue = totalCost + netProfit;
        }
      }
    }
  }

  const distFromKorea = calculateMapDistance(HOME_COUNTRY, country);

  // --- LOW STAMINA / MENTAL PENALTY (Avg Stamina <= 50 OR Avg Mental <= 50) ---
  const isLowCondition = avgStamina <= 50 || avgMental <= 50;
  if (isLowCondition) {
    const distancePenaltyMultiplier = 1 + (distFromKorea / 300);
    const conditionRatio = Math.min(avgStamina, avgMental) / 100;
    grossRevenue = Math.round(totalCost * (0.4 + conditionRatio * 0.35) / distancePenaltyMultiplier);
    netProfit = grossRevenue - totalCost;
  }

  // --- TOP NET PROFIT HIGH PROFIT COUNTRY CONDITION ---
  // If condition is not fully met (stamina & mental < 95), cap revenue dynamically so net profit is limited,
  // subtracting fuel surcharge & venue costs naturally so it never yields a fixed 5,000만원 flat!
  const isHighProfitCountry = HIGH_PROFIT_COUNTRY_IDS.includes(country.id);
  const isFullConditionMet = avgStamina >= 95 && avgMental >= 95;

  if (isHighProfitCountry && !isFullConditionMet && netProfit > 48000000) {
    const conditionScore = (avgStamina + avgMental) / 200; // 0.5 ~ 0.94
    const scaledProfit = Math.round(30000000 + conditionScore * 16000000); // ~38M - 45M KRW
    netProfit = scaledProfit;
    grossRevenue = totalCost + netProfit;
  }

  // --- WORLD TOUR PROFIT CAP (모든 국가 수익 상한 5,000만원, 지사 설립시 7,000만원 + 마지막 유류할증료 추가 정산) ---
  const maxProfitCap = hasBranch ? 70000000 : 50000000;
  if (netProfit > maxProfitCap) {
    netProfit = maxProfitCap + fuelSurcharge;
    grossRevenue = totalCost + netProfit;
  }

  return {
    flightCost,
    venueCost,
    fuelSurcharge,
    totalCost,
    expectedAudience,
    grossRevenue,
    netProfit,
    isProfitableTierMet,
    isLowCondition,
    isHighProfitCapped: isHighProfitCountry && !isFullConditionMet && (grossRevenue - totalCost > 48000000),
  };
}
