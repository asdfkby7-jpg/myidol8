import { ALBUM_CONCEPTS, COMPOSERS, INITIAL_FACILITIES, NPC_CHART_SONGS } from '../data/initialData';
import { Album, ChartSong, Composer, GameState, Group, MonthlyRecord, MonthlyReportData, NewsItem, Trainee, TraineeReportStat } from '../types';

export function getTraineeDisplayName(trainee: { name: string; stageName?: string }): string {
  if (trainee.stageName && trainee.stageName.trim().length > 0) {
    return trainee.stageName.trim();
  }
  return trainee.name;
}

export function syncFandoms(state: GameState, customTrainees?: Trainee[]): GameState {
  const trainees = customTrainees || state.trainees;
  const traineeMap = new Map<string, Trainee>();
  trainees.forEach(t => traineeMap.set(t.id, t));

  const updatedGroups = state.groups.map(g => {
    const groupMemberFandomSum = g.memberIds.reduce((sum, memberId) => {
      const member = traineeMap.get(memberId);
      return sum + (member?.fandom || 0);
    }, 0);
    return {
      ...g,
      fandom: groupMemberFandomSum,
    };
  });

  const totalCompanyFandom = trainees.reduce((sum, t) => sum + (t.fandom || 0), 0);

  return {
    ...state,
    trainees,
    groups: updatedGroups,
    fandom: totalCompanyFandom,
  };
}

export function distributeFandomToTrainees(
  state: GameState,
  participatingIds: string[],
  totalFanGain: number
): GameState {
  const participants = state.trainees.filter(t => participatingIds.includes(t.id));
  if (participants.length === 0) return state;

  const statsMap = new Map<string, number>();
  let totalStatSum = 0;

  participants.forEach(p => {
    const statSum = p.vocal + p.dance + p.charisma + p.visual;
    statsMap.set(p.id, statSum);
    totalStatSum += statSum;
  });

  const updatedTrainees = state.trainees.map(t => {
    if (participatingIds.includes(t.id)) {
      const pStat = statsMap.get(t.id) || 1;
      const ratio = totalStatSum > 0 ? (pStat / totalStatSum) : (1 / participants.length);
      const gained = Math.round(totalFanGain * ratio);
      const currentFandom = t.fandom || 0;
      return {
        ...t,
        fandom: Math.max(0, currentFandom + gained),
      };
    }
    return t;
  });

  return syncFandoms(state, updatedTrainees);
}

export const INITIAL_GAME_STATE: GameState = {
  companyName: '',
  repName: '대표 프로듀서',
  money: 30000000, // 초기 보유자금 3000만원 (30,000,000 KRW)
  fandom: 0,        // 초기 팬클럽 0명
  week: 1,
  reputation: 10,   // 명성
  trainees: [],     // 처음 시작시에는 연습생이 없음
  groups: [],
  albums: [],
  facilities: INITIAL_FACILITIES,
  newsList: [
    {
      id: 'n_0',
      week: 1,
      type: 'EVENT',
      title: '🎮 [내맘대로 아이돌 만들기] 기획사 개업!',
      content: '연예 기획사가 설립되었습니다! 3,000만원의 초기 자금으로 오디션을 진행하고 글로벌 아이돌로 육성하세요.',
    }
  ],
  currentChart: NPC_CHART_SONGS,
  weeklyRevenue: 0,
  weeklyExpense: 0,
  currentMonthRevenue: 0,
  currentMonthExpense: 0,
  monthlyHistory: [
    { year: 1, month: 1, money: 30000000, revenue: 0, expense: 0, netProfit: 0 }
  ],
  prevMonthTraineeFandoms: {},
  pendingMonthlyReport: null,
  showMonthlyReportModal: false,
  isSetupCompleted: false,
};

/**
 * Calculates album production failure probability based on participating idols' stamina & mental
 * Strict balance specs:
 * 1. Stamina = 100 & Mental = 100 -> Min 40% failure chance.
 * 2. Stamina <= 90 or Mental <= 90 -> Min 50% failure chance.
 * 3. Stamina <= 80 or Mental <= 80 -> Min 90% failure chance.
 */
export function calculateAlbumFailureRate(participatingTrainees: Trainee[], composer: Composer): number {
  if (participatingTrainees.length === 0) return 100;
  
  const avgStamina = participatingTrainees.reduce((acc, t) => acc + t.stamina, 0) / participatingTrainees.length;
  const avgMental = participatingTrainees.reduce((acc, t) => acc + t.mental, 0) / participatingTrainees.length;
  
  let baseFailRate = 40; // Default minimum 40% fail rate for perfect condition (100 stamina & 100 mental)
  
  if (avgStamina <= 80 || avgMental <= 80) {
    baseFailRate = 90; // Min 90% fail rate
  } else if (avgStamina <= 90 || avgMental <= 90) {
    baseFailRate = 50; // Min 50% fail rate
  }
  
  // Composer hit chance bonus reduces failure rate slightly (up to -15%), but minimum cap remains
  const composerMitigation = Math.min(15, composer.hitChanceBonus * 0.5);
  const finalFailRate = Math.max(baseFailRate - composerMitigation, baseFailRate);
  
  return Math.min(99, Math.round(finalFailRate));
}

export interface AlbumProductionParams {
  group: Group;
  title: string;
  conceptId: string;
  composer: Composer;
  mvBudget: number; // ₩
  participatingTraineeIds: string[];
}

export function executeAlbumRelease(
  state: GameState,
  params: AlbumProductionParams
): { updatedState: GameState; newAlbum: Album; isSuccess: boolean; newsReport: NewsItem } {
  const { group, title, conceptId, composer, mvBudget, participatingTraineeIds } = params;
  
  const participants = state.trainees.filter(t => participatingTraineeIds.includes(t.id));
  const conceptObj = ALBUM_CONCEPTS.find(c => c.id === conceptId) || ALBUM_CONCEPTS[0];
  
  const totalCost = composer.cost + mvBudget;
  const failureRate = calculateAlbumFailureRate(participants, composer);
  const roll = Math.random() * 100;
  const isSuccess = roll >= failureRate;
  
  let updatedTrainees = [...state.trainees];
  let updatedFandom = state.fandom;
  let updatedMoney = state.money - totalCost;
  let salesCount = 0;
  let settlementAmount = 0;
  let fandomGained = 0;
  let chartRank = 100;
  let failReason = '';
  let criticReview = '';
  
  if (!isSuccess) {
    // === ALBUM FAILURE PENALTIES ===
    // 1. Extra financial loss due to refund/uncollected investments
    const deficitLoss = Math.floor(totalCost * 0.3);
    updatedMoney -= deficitLoss;
    
    // 2. Participating idols' Mental reduced by 30
    // 3. Popularity reduced randomly by 10 ~ 30
    updatedTrainees = updatedTrainees.map(t => {
      if (participatingTraineeIds.includes(t.id)) {
        const popLoss = Math.floor(Math.random() * 21) + 10; // 10~30
        return {
          ...t,
          mental: Math.max(0, t.mental - 30),
          stamina: Math.max(0, t.stamina - 20),
          popularity: Math.max(0, t.popularity - popLoss),
        };
      }
      return t;
    });
    
    // 4. Official Fanclub reduced by 10%
    const lostFans = Math.floor(updatedFandom * 0.1);
    updatedFandom = Math.max(100, updatedFandom - lostFans);
    
    failReason = `멤버들의 스태미나/멘탈 난조 및 콘셉트 조율 실패 (실패 확률 ${failureRate}% 판정)`;
    criticReview = `[참패 리뷰] 컨셉의 방향성을 잃은 무리한 컴백. 멤버들의 피로감이 무대 위에서 노출되었으며 대중의 반응은 냉담하다. (팬클럽 -10% 하락)`;
    chartRank = Math.floor(Math.random() * 20) + 80; // 80~90위권 밖 겉돎
  } else {
    // === ALBUM SUCCESS CALCULATIONS (BALANCE REALIZED) ===
    // Base ability average
    const avgVocal = participants.reduce((a, b) => a + b.vocal, 0) / (participants.length || 1);
    const avgDance = participants.reduce((a, b) => a + b.dance, 0) / (participants.length || 1);
    const avgVisual = participants.reduce((a, b) => a + b.visual, 0) / (participants.length || 1);
    const avgCharisma = participants.reduce((a, b) => a + b.charisma, 0) / (participants.length || 1);
    
    // Recording Facility & Manager 130%~150% bonus
    const recFac = state.facilities.recording;
    const recLevel = recFac?.level || 1;
    const recManagerMult = recFac?.hasManager ? (1.3 + Math.random() * 0.2) : 1;
    const recBonus = (recLevel * 3) * recManagerMult;

    const qualityScore = (avgVocal * 0.3 + avgDance * 0.25 + avgVisual * 0.25 + avgCharisma * 0.2 + recBonus) + composer.hitChanceBonus;
    
    // 1. Fandom growth reduced to 40% of legacy standard
    const baseFandomGain = Math.floor((qualityScore * 12 + mvBudget / 500000) * 0.4);
    fandomGained = Math.max(150, baseFandomGain);
    updatedFandom += fandomGained;
    
    // 2. Physical Album Sales reduced to 25% of standard
    let rawSales = Math.floor((updatedFandom * 1.5 + qualityScore * 300 + mvBudget / 1000) * 0.25);
    
    // Rule: If official fanclub >= 100,000, sales CANNOT exceed 50% (half) of fanclub
    if (updatedFandom >= 100000) {
      const maxAllowedSales = Math.floor(updatedFandom * 0.5);
      rawSales = Math.min(rawSales, maxAllowedSales);
    }
    salesCount = Math.max(500, rawSales);
    
    // 3. Album settlement profit reduced to 25% (payout approx 10% of revenue)
    const grossRevenue = salesCount * 18000; // 18,000 KRW per CD
    settlementAmount = Math.floor(grossRevenue * 0.10); // 10% net settlement payout
    updatedMoney += settlementAmount;
    
    // Chart Rank (1 ~ 50)
    chartRank = Math.max(1, Math.floor(50 - (qualityScore / 2.5) - (salesCount / 5000)));
    
    // Upgrade idols' stats, upkeep & personal fandom on success (20% upkeep raise if chartRank <= 8)
    const isTop8Rank = chartRank <= 8;
    const totalParticipantStats = participants.reduce((acc, p) => acc + p.vocal + p.dance + p.charisma + p.visual, 0);

    updatedTrainees = updatedTrainees.map(t => {
      if (participatingTraineeIds.includes(t.id)) {
        const pStat = t.vocal + t.dance + t.charisma + t.visual;
        const ratio = totalParticipantStats > 0 ? (pStat / totalParticipantStats) : (1 / participants.length);
        const traineeFanGain = Math.round(fandomGained * ratio);
        const newUpkeep = isTop8Rank ? Math.round(t.upkeep * 1.20) : t.upkeep;
        return {
          ...t,
          upkeep: newUpkeep,
          popularity: Math.min(100, t.popularity + Math.floor(Math.random() * 8) + 5),
          fandom: (t.fandom || 0) + traineeFanGain,
          stamina: Math.max(10, t.stamina - 15),
          mental: Math.max(10, t.mental - 10),
        };
      }
      return t;
    });
    
    const top8Notice = isTop8Rank ? ' (차트 TOP 8 진입으로 참여 멤버 주급 20% 인상!)' : '';
    criticReview = `[호평 리뷰] '${conceptObj.name}' 컨셉을 완벽히 소화해낸 완성도 높은 신보. 차트 ${chartRank}위에 오르며 무서운 기세로 팬덤을 끌어모으고 있다!${top8Notice}`;
  }
  
  const newAlbum: Album = {
    id: `alb_${Date.now()}`,
    groupId: group.id,
    groupName: group.name,
    title,
    concept: conceptObj.name,
    composerName: composer.name,
    mvBudget,
    releaseWeek: state.week,
    isSuccess,
    failReason: isSuccess ? undefined : failReason,
    salesCount,
    settlementAmount,
    fandomGained,
    chartRank,
    criticReview,
  };
  
  const newsReport: NewsItem = {
    id: `news_${Date.now()}`,
    week: state.week,
    type: 'ALBUM',
    title: isSuccess 
      ? `🎉 [신보 발매] ${group.name} 신곡 '${title}' 흥행 성공! (판매량: ${salesCount.toLocaleString()}장)`
      : `⚠️ [차트 참패] ${group.name} 신곡 '${title}' 흥행 실패... 자금 및 멘탈 타격`,
    content: isSuccess 
      ? `${group.name}의 컴백 타이틀곡 '${title}'이(가) 차트 ${chartRank}위에 오르며 음반 ${salesCount.toLocaleString()}장 판매와 정산금 ₩${settlementAmount.toLocaleString()}을 기록했습니다.`
      : `${group.name}의 신곡 '${title}' 활동이 대중의 외면을 받으며 무산되었습니다. 아이돌 멘탈 감소(-30) 및 팬클럽 -10% 하락.`,
    isNegative: !isSuccess,
  };

  // Chart Song update
  let updatedChart = [...state.currentChart];
  if (isSuccess) {
    const userSong: ChartSong = {
      rank: chartRank,
      title,
      artist: group.name,
      albumId: newAlbum.id,
      isUserGroup: true,
      score: 100 - chartRank,
      weeksOnChart: 1,
    };
    updatedChart.push(userSong);
    updatedChart.sort((a, b) => b.score - a.score);
    updatedChart = updatedChart.slice(0, 10).map((s, idx) => ({ ...s, rank: idx + 1 }));
  }
  
  const rawUpdatedState: GameState = {
    ...state,
    money: updatedMoney,
    fandom: updatedFandom,
    trainees: updatedTrainees,
    groups: state.groups.map(g => {
      if (g.id === group.id) {
        return {
          ...g,
          totalAlbumSales: g.totalAlbumSales + salesCount,
          reputation: isSuccess ? Math.min(100, g.reputation + 5) : Math.max(0, g.reputation - 10),
        };
      }
      return g;
    }),
    albums: [newAlbum, ...state.albums],
    newsList: [newsReport, ...state.newsList],
    currentChart: updatedChart,
    weeklyRevenue: state.weeklyRevenue + settlementAmount,
    weeklyExpense: state.weeklyExpense + totalCost + (isSuccess ? 0 : Math.floor(totalCost * 0.3)),
  };

  // Ensure group fandom is strictly equal to the sum of its members' individual fandoms
  const updatedState = syncFandoms(rawUpdatedState);
  
  return { updatedState, newAlbum, isSuccess, newsReport };
}

/**
 * Progresses turn to Next Week
 * Calculates trainees upkeep, facility maintenance, stamina/mental recovery, random events
 */
export function advanceNextWeek(state: GameState): GameState {
  const nextWeek = state.week + 1;
  
  // 1. Calculate Upkeep Expense
  let totalTraineeUpkeep = 0;
  const updatedTrainees = state.trainees.map(t => {
    // Preserve current upkeep (with album, concert, and stat training bonuses)
    const skillSum = t.vocal + t.dance + t.charisma + t.visual;
    const ratio = Math.min(1, skillSum / 400);
    const fallbackUpkeep = Math.floor(150000 + ratio * 100000);
    const actualUpkeep = t.upkeep || fallbackUpkeep;
    totalTraineeUpkeep += actualUpkeep;
    
    // Natural Stamina/Mental passive recovery or fatigue
    const restFacility = state.facilities.rest;
    const restFacilityLevel = restFacility?.level || 1;
    const restManagerMult = restFacility?.hasManager ? (1.3 + Math.random() * 0.2) : 1; // 130%~150%
    const staminaRestBonus = Math.round(restFacilityLevel * 3 * restManagerMult);
    const mentalRestBonus = Math.round(restFacilityLevel * 3 * restManagerMult);
    
    let newStamina = Math.min(100, t.stamina + 5 + staminaRestBonus);
    let newMental = Math.min(100, t.mental + 5 + mentalRestBonus);
    
    return {
      ...t,
      upkeep: actualUpkeep,
      stamina: newStamina,
      mental: newMental,
    };
  });
  
  // 2. Facility Maintenance (기획사 시설 고정비 지출 - 레벨 1은 무료, 실장 고용 시 2배 적용)
  const totalFacilityUpkeep = Object.values(state.facilities).reduce((sum, f) => {
    const baseUpkeep = f.level <= 1 ? 0 : f.weeklyUpkeep * f.level;
    const managerMultiplier = f.hasManager ? 2 : 1;
    return sum + (baseUpkeep * managerMultiplier);
  }, 0);

  const totalWeeklyExpense = totalTraineeUpkeep + totalFacilityUpkeep;
  const newMoney = state.money - totalWeeklyExpense;
  
  // 3. Passive Fan Change
  const marketingFacility = state.facilities.marketing;
  const marketingLevel = marketingFacility?.level || 1;
  const mktManagerMult = marketingFacility?.hasManager ? (1.3 + Math.random() * 0.2) : 1; // 130%~150%
  const passiveFanGrowth = Math.floor(50 + state.reputation * 5 + marketingLevel * 100 * mktManagerMult);

  // Distribute passive fan growth across trainees proportional to stats
  const totalTraineeStats = updatedTrainees.reduce((acc, t) => acc + t.vocal + t.dance + t.charisma + t.visual, 0);
  const traineesWithPassiveFan = updatedTrainees.map(t => {
    const pStat = t.vocal + t.dance + t.charisma + t.visual;
    const ratio = totalTraineeStats > 0 ? (pStat / totalTraineeStats) : (1 / (updatedTrainees.length || 1));
    const gained = Math.round(passiveFanGrowth * ratio);
    return {
      ...t,
      fandom: (t.fandom || 0) + gained,
    };
  });
  
  // 4. Random Weekly Event
  const newNews: NewsItem[] = [];
  const eventRoll = Math.random();
  
  if (eventRoll < 0.25) {
    // Random viral event or minor scandal
    if (Math.random() > 0.5) {
      newNews.push({
        id: `news_ev_${nextWeek}`,
        week: nextWeek,
        type: 'EVENT',
        title: '🔥 [SNS 바이럴] 연습생들의 연습 비하인드 숏폼 화제!',
        content: '연습실 춤선 영상이 틱톡에서 100만 뷰를 기록하며 팬클럽 수가 급증했습니다. (+300명)',
      });
    } else {
      newNews.push({
        id: `news_ev_${nextWeek}`,
        week: nextWeek,
        type: 'SCANDAL',
        title: '⚡ [주간 리포트] 연습생 스태미나 누적 피로 경고',
        content: '무리한 트레이닝 스케줄로 인해 일부 연습생의 체력이 저하되었습니다. 휴식을 권장합니다.',
        isNegative: true,
      });
    }
  }
  
  // 5. Weekly Chart Decay & Updates
  let updatedChart = state.currentChart.map(song => {
    const weeksOnChart = song.weeksOnChart + 1;
    let score = song.score;
    if (song.isUserGroup) {
      // User songs decay 2~4 points per week
      score = Math.max(10, score - (Math.floor(Math.random() * 3) + 2));
    } else {
      // NPC songs fluctuate slightly
      score = Math.max(10, score + (Math.random() > 0.5 ? 1 : -1));
    }
    return {
      ...song,
      weeksOnChart,
      score,
    };
  });

  updatedChart.sort((a, b) => b.score - a.score);
  updatedChart = updatedChart.slice(0, 10).map((s, idx) => ({ ...s, rank: idx + 1 }));

  // 6. Monthly Financial & Management Report Tracking
  const addedWeeklyRev = state.weeklyRevenue || 0;
  const currentMonthRev = (state.currentMonthRevenue || 0) + addedWeeklyRev;
  const currentMonthExp = (state.currentMonthExpense || 0) + totalWeeklyExpense;

  const prevYear = Math.floor((state.week - 1) / 48) + 1;
  const prevMonth = Math.floor(((state.week - 1) % 48) / 4) + 1;

  const nextYear = Math.floor((nextWeek - 1) / 48) + 1;
  const nextMonth = Math.floor(((nextWeek - 1) % 48) / 4) + 1;
  const nextWeekOfMonth = ((nextWeek - 1) % 4) + 1;

  let monthlyHistory = [...(state.monthlyHistory || [
    { year: 1, month: 1, money: 30000000, revenue: 0, expense: 0, netProfit: 0 }
  ])];
  let pendingReport: MonthlyReportData | null = null;
  let showReportModal = false;
  let nextCurrentMonthRevenue = currentMonthRev;
  let nextCurrentMonthExpense = currentMonthExp;
  let newPrevMonthTraineeFandoms = { ...(state.prevMonthTraineeFandoms || {}) };

  // Trigger monthly report on 1st week of every month EXCEPT week 1 (game start)
  if (nextWeekOfMonth === 1 && nextWeek > 1) {
    const lastMonthProfit = currentMonthRev - currentMonthExp;

    const newRecord: MonthlyRecord = {
      year: prevYear,
      month: prevMonth,
      money: newMoney,
      revenue: currentMonthRev,
      expense: currentMonthExp,
      netProfit: lastMonthProfit,
    };

    const existingIndex = monthlyHistory.findIndex(h => h.year === prevYear && h.month === prevMonth);
    if (existingIndex >= 0) {
      monthlyHistory[existingIndex] = newRecord;
    } else {
      monthlyHistory.push(newRecord);
    }

    // Build Trainee Report Stats (Sorted by upkeep DESC)
    const prevFandoms = state.prevMonthTraineeFandoms || {};
    const traineeStats: TraineeReportStat[] = traineesWithPassiveFan.map(t => {
      const prevFan = prevFandoms[t.id] ?? t.fandom;
      const fandomChange = t.fandom - prevFan;
      const group = state.groups.find(g => g.id === t.groupId);
      return {
        id: t.id,
        name: t.name,
        stageName: t.stageName,
        groupName: group ? group.name : undefined,
        upkeep: t.upkeep || 150000,
        fandom: t.fandom,
        fandomChange,
      };
    });

    // Sort by upkeep DESC
    traineeStats.sort((a, b) => b.upkeep - a.upkeep);

    const topTrainee = traineeStats[0];

    pendingReport = {
      year: nextYear,
      month: nextMonth,
      weekOfMonth: nextWeekOfMonth,
      reportWeek: nextWeek,
      lastMonthRevenue: currentMonthRev,
      lastMonthExpense: currentMonthExp,
      lastMonthProfit: lastMonthProfit,
      history: monthlyHistory,
      traineeStats,
      topUpkeepTraineeName: topTrainee ? (topTrainee.stageName || topTrainee.name) : undefined,
      topUpkeepAmount: topTrainee ? topTrainee.upkeep : undefined,
    };

    showReportModal = true;

    // Reset current month accumulators
    nextCurrentMonthRevenue = 0;
    nextCurrentMonthExpense = 0;

    // Snapshot current fandoms
    newPrevMonthTraineeFandoms = {};
    traineesWithPassiveFan.forEach(t => {
      newPrevMonthTraineeFandoms[t.id] = t.fandom;
    });
  } else if (state.week === 1 && Object.keys(newPrevMonthTraineeFandoms).length === 0) {
    // Save initial snapshot if week 1
    traineesWithPassiveFan.forEach(t => {
      newPrevMonthTraineeFandoms[t.id] = t.fandom;
    });
  }

  const rawState: GameState = {
    ...state,
    week: nextWeek,
    money: newMoney,
    trainees: traineesWithPassiveFan,
    newsList: [...newNews, ...state.newsList],
    currentChart: updatedChart,
    weeklyExpense: totalWeeklyExpense,
    weeklyRevenue: 0,
    currentMonthRevenue: nextCurrentMonthRevenue,
    currentMonthExpense: nextCurrentMonthExpense,
    monthlyHistory: monthlyHistory,
    prevMonthTraineeFandoms: newPrevMonthTraineeFandoms,
    pendingMonthlyReport: pendingReport || state.pendingMonthlyReport,
    showMonthlyReportModal: showReportModal ? true : state.showMonthlyReportModal,
  };

  return syncFandoms(rawState);
}
