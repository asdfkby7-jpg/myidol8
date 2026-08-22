import React, { useState, useEffect } from 'react';
import { CONCERT_VENUES } from '../data/initialData';
import { GameState, Venue, Trainee } from '../types';
import { sound } from '../utils/sound';
import { getTraineeDisplayName, syncFandoms } from '../utils/gameEngine';
import { getTraineeChartRank, getChartRankBonusMultiplier, getChartAuraClasses, getParticipantsChartBonusRatio } from '../utils/chartUtils';
import { Tv, Ticket, Radio, Sparkles, X, Zap, Heart, ShieldAlert, Check, AlertTriangle, Users, User, Award, Newspaper, Globe, Plane, Compass } from 'lucide-react';
import { WorldTourModal } from './WorldTourModal';

interface ConcertScheduleViewProps {
  state: GameState;
  onUpdateState: (newState: GameState) => void;
}

interface BroadcastConfig {
  type: 'MUSIC_SHOW' | 'VARIETY' | 'YOUTUBE';
  title: string;
  subTitle: string;
  staminaCost: number;
  mentalCost: number;
  fandomMin: number;
  fandomMax: number;
  minFee: number;
  maxFee: number;
  feeText: string;
  badgeBg: string;
  badgeText: string;
}

const BROADCAST_CONFIGS: Record<'MUSIC_SHOW' | 'VARIETY' | 'YOUTUBE', BroadcastConfig> = {
  MUSIC_SHOW: {
    type: 'MUSIC_SHOW',
    title: '📺 지상파 음악방송 스케줄',
    subTitle: '뮤직 스테이지, 쇼! 멜로디중심 생방송 출연 무대',
    staminaCost: 40,
    mentalCost: 40,
    fandomMin: 200,
    fandomMax: 500,
    minFee: 200000,
    maxFee: 290000,
    feeText: '20만원~29만원 (능력치 비례)',
    badgeBg: 'bg-pink-500/20 border-pink-500/30',
    badgeText: 'text-pink-300',
  },
  VARIETY: {
    type: 'VARIETY',
    title: '🌟 대표 인기 예능 게스트',
    subTitle: '러닌맨, 퀴즈온더블록 등 간판 예능 출연',
    staminaCost: 30,
    mentalCost: 30,
    fandomMin: 300,
    fandomMax: 800,
    minFee: 150000,
    maxFee: 250000,
    feeText: '15만원~25만원 (능력치 비례)',
    badgeBg: 'bg-purple-500/20 border-purple-500/30',
    badgeText: 'text-purple-300',
  },
  YOUTUBE: {
    type: 'YOUTUBE',
    title: '📱 유튜브 라이브 & 숏폼',
    subTitle: '글로벌 플랫폼 라이브 소통 및 바이럴',
    staminaCost: 20,
    mentalCost: 20,
    fandomMin: 150,
    fandomMax: 550,
    minFee: 100000,
    maxFee: 190000,
    feeText: '10만원~19만원 (능력치 비례)',
    badgeBg: 'bg-cyan-500/20 border-cyan-500/30',
    badgeText: 'text-cyan-300',
  },
};

export const ConcertScheduleView: React.FC<ConcertScheduleViewProps> = ({
  state,
  onUpdateState,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    state.groups[0]?.id || ''
  );

  // Broadcast schedule modal state
  const [activeBroadcastType, setActiveBroadcastType] = useState<'MUSIC_SHOW' | 'VARIETY' | 'YOUTUBE' | null>(null);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);

  // Concert host modal state
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [concertGroupSelection, setConcertGroupSelection] = useState<string>(
    state.groups[0]?.id || ''
  );
  const [concertMode, setConcertMode] = useState<'GROUP' | 'INDIVIDUAL'>('GROUP');
  const [concertIndividualIds, setConcertIndividualIds] = useState<string[]>([]);

  // World Tour modal state
  const [isWorldTourModalOpen, setIsWorldTourModalOpen] = useState<boolean>(false);

  // Agency Real-Time News Popup State (50% size, auto-dismiss in 4 seconds)
  const [concertNewsPopup, setConcertNewsPopup] = useState<{
    title: string;
    content: string;
    isNegative?: boolean;
    venueName: string;
  } | null>(null);
  const [popupProgress, setPopupProgress] = useState(100);

  useEffect(() => {
    if (!concertNewsPopup) return;
    setPopupProgress(100);

    const startTime = Date.now();
    const duration = 4000; // 4 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setPopupProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        setConcertNewsPopup(null);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [concertNewsPopup]);

  const activeGroup = state.groups.find(g => g.id === selectedGroupId);

  const handleOpenBroadcastModal = (type: 'MUSIC_SHOW' | 'VARIETY' | 'YOUTUBE') => {
    setActiveBroadcastType(type);
    if (activeGroup && activeGroup.memberIds.length > 0) {
      setSelectedTraineeIds([...activeGroup.memberIds]);
    } else {
      setSelectedTraineeIds(state.trainees.map(t => t.id));
    }
  };

  const handleToggleTrainee = (id: string) => {
    setSelectedTraineeIds(prev =>
      prev.includes(id) ? prev.filter(tId => tId !== id) : [...prev, id]
    );
  };

  const handleSelectGroupTrainees = (groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    if (group) {
      const groupMemberSet = new Set(group.memberIds);
      setSelectedTraineeIds(Array.from(groupMemberSet));
    }
  };

  const handleSelectAllTrainees = () => {
    setSelectedTraineeIds(state.trainees.map(t => t.id));
  };

  const handleDeselectAllTrainees = () => {
    setSelectedTraineeIds([]);
  };

  const handleExecuteBroadcast = () => {
    if (!activeBroadcastType) return;
    const config = BROADCAST_CONFIGS[activeBroadcastType];

    if (selectedTraineeIds.length === 0) {
      alert('스케줄에 출연시킬 아이돌을 최소 1명 이상 선택해주세요!');
      return;
    }

    const selectedTrainees = state.trainees.filter(t => selectedTraineeIds.includes(t.id));
    
    // Check if any selected trainee lacks sufficient condition
    const exhaustedTrainees = selectedTrainees.filter(
      t => t.stamina < config.staminaCost || t.mental < config.mentalCost
    );

    if (exhaustedTrainees.length > 0) {
      const names = exhaustedTrainees.map(t => getTraineeDisplayName(t)).join(', ');
      alert(`⚠️ 체력 또는 멘탈이 부족하여 스케줄을 진행할 수 없는 연습생이 있습니다:\n[${names}]\n\n휴식/케어 후 시도하거나 해당 아이돌을 제외해주세요.\n(필요 체력: ${config.staminaCost}, 멘탈: ${config.mentalCost})`);
      return;
    }

    sound.playClick();
    sound.playCash();

    const baseGain = Math.floor(Math.random() * (config.fandomMax - config.fandomMin + 1)) + config.fandomMin;
    const participantBonus = Math.floor(selectedTrainees.length * 50);
    const totalFanGain = baseGain + participantBonus;

    // Calculate appearance fee for each selected trainee based on stats + top 8 chart rank bonus
    let totalFee = 0;
    selectedTrainees.forEach(t => {
      const skillSum = t.vocal + t.dance + t.charisma + t.visual;
      const ratio = Math.min(1, skillSum / 400);
      let fee = Math.floor(config.minFee + ratio * (config.maxFee - config.minFee));
      
      const rank = getTraineeChartRank(t, state);
      if (rank !== null) {
        const bonusRatio = getChartRankBonusMultiplier(rank);
        fee = Math.floor(fee * (1 + bonusRatio));
      }
      totalFee += fee;
    });

    const totalStatSum = selectedTrainees.reduce((sum, t) => sum + (t.vocal + t.dance + t.charisma + t.visual), 0);

    const updatedTrainees = state.trainees.map(t => {
      if (selectedTraineeIds.includes(t.id)) {
        const statSum = t.vocal + t.dance + t.charisma + t.visual;
        const ratio = totalStatSum > 0 ? (statSum / totalStatSum) : (1 / (selectedTrainees.length || 1));
        const traineeFanGain = Math.round(totalFanGain * ratio);
        return {
          ...t,
          fandom: (t.fandom || 0) + traineeFanGain,
          stamina: Math.max(0, t.stamina - config.staminaCost),
          mental: Math.max(0, t.mental - config.mentalCost),
        };
      }
      return t;
    });

    const participantNames = selectedTrainees.map(t => getTraineeDisplayName(t)).join(', ');

    const rawNewState: GameState = {
      ...state,
      money: state.money + totalFee,
      weeklyRevenue: state.weeklyRevenue + totalFee,
      trainees: updatedTrainees,
      newsList: [
        {
          id: `news_bc_${Date.now()}`,
          week: state.week,
          type: 'EVENT',
          title: `📺 [스케줄 완료] ${config.title} (${participantNames})`,
          content: `${participantNames}이(가) ${config.title} 활동을 성공적으로 마쳤습니다. (출연료 +₩${totalFee.toLocaleString()}, 팬덤 +${totalFanGain}명 기여도 반영 / 각 체력 -${config.staminaCost}, 멘탈 -${config.mentalCost} 소모)`,
        },
        ...state.newsList,
      ],
    };

    onUpdateState(syncFandoms(rawNewState));

    alert(`🎉 ${config.title} 활동 완료!\n출연 아이돌: [${participantNames}]\n총 출연료 수입: +₩${totalFee.toLocaleString()} (능력치 비례)\n체력 -${config.staminaCost}, 멘탈 -${config.mentalCost} 소모\n공식 팬클럽 유입: +${totalFanGain.toLocaleString()} 명 (기여도 반영)`);
    setActiveBroadcastType(null);
  };

  // Open concert host modal
  const handleOpenConcertModal = (venue: Venue) => {
    setSelectedVenue(venue);
    const initialGroup = state.groups[0]?.id || '';
    setConcertGroupSelection(initialGroup);
    
    // For fan meeting hall (v1), default mode can be individual or group
    if (venue.id === 'v1') {
      setConcertMode('INDIVIDUAL');
      setConcertIndividualIds(state.trainees.map(t => t.id));
    } else {
      setConcertMode('GROUP');
      const g = state.groups.find(group => group.id === initialGroup);
      setConcertIndividualIds(g ? [...g.memberIds] : []);
    }
  };

  const getTraineeAvgStat = (t: Trainee) => {
    return (t.vocal + t.dance + t.charisma + t.visual) / 4;
  };

  const getConcertParticipants = (): Trainee[] => {
    if (!selectedVenue) return [];

    if (selectedVenue.id === 'v1' && concertMode === 'INDIVIDUAL') {
      return state.trainees.filter(t => concertIndividualIds.includes(t.id));
    } else {
      const g = state.groups.find(group => group.id === concertGroupSelection);
      if (!g) return [];
      return state.trainees.filter(t => g.memberIds.includes(t.id));
    }
  };

  // Concert Execution Logic
  const handleExecuteConcert = () => {
    if (!selectedVenue) return;
    const venue = selectedVenue;

    const participants = getConcertParticipants();

    if (participants.length === 0) {
      alert('콘서트에 참여할 아이돌/그룹 멤버가 없습니다.');
      return;
    }

    // Stamina <= 50 check
    const staminaBlocked = participants.some(t => t.stamina <= 50);
    if (staminaBlocked) {
      alert('⚠️ 체력이 50 이하인 멤버가 포함되어 있어 콘서트를 시작할 수 없습니다!\n해당 멤버의 체력을 회복 후 시도해 주세요.');
      return;
    }

    // Fandom & Money checks
    if (state.fandom < venue.minFandomRequired) {
      alert(`팬클럽 수가 부족하여 티켓을 매진시킬 수 없습니다! (필요 최소 팬클럽: ${venue.minFandomRequired.toLocaleString()}명)`);
      return;
    }
    if (state.money < venue.rentCost) {
      alert(`대관료 자금이 부족합니다! (대관료: ₩${venue.rentCost.toLocaleString()})`);
      return;
    }

    const participantIds = new Set(participants.map(p => p.id));

    // Failure probability calculation: Increased by 20% (Low condition: 85%, Normal: 25%)
    const isLowCondition = participants.some(t => t.stamina <= 70 || t.mental <= 70);
    const failureProbability = isLowCondition ? 0.85 : 0.25;

    const isFailed = Math.random() < failureProbability;

    // Average stats calculation for reward multiplier
    const totalAvgStats = participants.reduce((acc, t) => acc + getTraineeAvgStat(t), 0) / participants.length;
    // Reward multiplier: 20% + 80%*(stats/100).
    const rewardScale = Math.min(1.0, Math.max(0.2, 0.20 + 0.80 * (totalAvgStats / 100)));

    if (isFailed) {
      sound.playFailure();

      // Failed concert: Heavy ticket refunds & attendance crash -> Net Deficit proportional to Rent Cost
      const soldTickets = Math.floor(Math.min(venue.capacity, state.fandom * 0.8) * 0.15); // only 15% attendance
      const grossRevenue = Math.floor(soldTickets * venue.ticketPrice * 0.2); // heavy ticket refunds
      const netProfit = grossRevenue - venue.rentCost; // Guaranteed negative value (deficit)

      // Fan club reduction on failure
      const fandomLoss = Math.floor(Math.min(state.fandom * 0.15, venue.capacity * 0.15 + Math.random() * 100));

      const totalConcertStats = participants.reduce((sum, p) => sum + (p.vocal + p.dance + p.charisma + p.visual), 0);

      // Mental drop for participants (10 ~ 30) & fandom loss
      const updatedTrainees = state.trainees.map(t => {
        if (participantIds.has(t.id)) {
          const drop = Math.floor(Math.random() * 21) + 10; // 10 ~ 30
          const pStat = t.vocal + t.dance + t.charisma + t.visual;
          const ratio = totalConcertStats > 0 ? (pStat / totalConcertStats) : (1 / (participants.length || 1));
          const traineeLoss = Math.round(fandomLoss * ratio);
          return {
            ...t,
            fandom: Math.max(0, (t.fandom || 0) - traineeLoss),
            stamina: Math.max(0, t.stamina - 30),
            mental: Math.max(0, t.mental - drop),
          };
        }
        return t;
      });

      const newsText = `💥 [콘서트 파행] ${venue.name} 공연이 참여 아이돌의 컨디션 난조로 무산되었습니다!\n• 손실 적자: -₩${Math.abs(netProfit).toLocaleString()}\n• 팬클럽 감소: -${fandomLoss.toLocaleString()}명\n• 참여진 체력 -30, 멘탈 -10~30 소모`;
      const newsTitle = `💥 [기획사 실시간 뉴스] ${venue.name} 공연 파행 및 손실 발생!`;

      const rawFailState: GameState = {
        ...state,
        money: state.money + netProfit, // netProfit is negative
        trainees: updatedTrainees,
        newsList: [
          {
            id: `news_con_fail_${Date.now()}`,
            week: state.week,
            type: 'CONCERT',
            title: newsTitle,
            content: newsText,
          },
          ...state.newsList,
        ],
        weeklyRevenue: state.weeklyRevenue + grossRevenue,
        weeklyExpense: state.weeklyExpense + venue.rentCost,
      };

      onUpdateState(syncFandoms(rawFailState));

      setConcertNewsPopup({
        title: newsTitle,
        content: newsText,
        isNegative: true,
        venueName: venue.name,
      });
    } else {
      sound.playCash();
      sound.playSuccessFanfare();

      // Successful concert: Rewards reduced by 30% (x 0.7) + Top 8 Chart Rank Bonus (10% ~ 30%)
      const baseSold = Math.min(venue.capacity, Math.floor(state.fandom * 0.8));
      const { bonusRatio: chartBonusRatio, bestRank: chartBestRank } = getParticipantsChartBonusRatio(participants, state);

      const grossRevenue = Math.floor(baseSold * venue.ticketPrice * rewardScale * 0.7 * (1 + chartBonusRatio));
      const netProfit = grossRevenue - venue.rentCost;

      const fandomGain = Math.floor(baseSold * 0.15 * rewardScale * 0.7 * (1 + chartBonusRatio));

      const totalConcertStats = participants.reduce((sum, p) => sum + (p.vocal + p.dance + p.charisma + p.visual), 0);

      // Stamina & Mental cost on success + 10% Upkeep raise + fandom gain
      const mentalLoss = Math.floor(Math.random() * 21) + 10;
      const updatedTrainees = state.trainees.map(t => {
        if (participantIds.has(t.id)) {
          const pStat = t.vocal + t.dance + t.charisma + t.visual;
          const ratio = totalConcertStats > 0 ? (pStat / totalConcertStats) : (1 / (participants.length || 1));
          const traineeFanGain = Math.round(fandomGain * ratio);
          return {
            ...t,
            upkeep: Math.round(t.upkeep * 1.10),
            fandom: (t.fandom || 0) + traineeFanGain,
            stamina: Math.max(0, t.stamina - 25),
            mental: Math.max(0, t.mental - mentalLoss),
          };
        }
        return t;
      });

      const chartNotice = chartBonusRatio > 0 ? ` (👑 차트 ${chartBestRank}위 보너스 +${Math.round(chartBonusRatio * 100)}% 적용)` : '';
      const newsText = `🎤 [콘서트 성공] ${venue.name} 무대가 관객들의 열호 속에 성료되었습니다!\n• 총 순수익: +₩${netProfit.toLocaleString()}${chartNotice}\n• 팬클럽 유입: +${fandomGain.toLocaleString()}명 (기여도 반영)\n• 참여진 주급 10% 인상! (체력 -25, 멘탈 -${mentalLoss} 소모)`;
      const newsTitle = `🎟️ [기획사 실시간 뉴스] ${venue.name} 공연 성황리에 종료!`;

      const rawSuccessState: GameState = {
        ...state,
        money: state.money + netProfit,
        trainees: updatedTrainees,
        newsList: [
          {
            id: `news_con_${Date.now()}`,
            week: state.week,
            type: 'CONCERT',
            title: newsTitle,
            content: newsText,
          },
          ...state.newsList,
        ],
        weeklyRevenue: state.weeklyRevenue + grossRevenue,
        weeklyExpense: state.weeklyExpense + venue.rentCost,
      };

      onUpdateState(syncFandoms(rawSuccessState));

      setConcertNewsPopup({
        title: newsTitle,
        content: newsText,
        isNegative: false,
        venueName: venue.name,
      });
    }

    setSelectedVenue(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-pink-400 text-xs font-semibold uppercase mb-1">
            <Tv className="w-4 h-4" />
            <span>Live Concert & Broadcast Schedules</span>
          </div>
          <h2 className="text-xl font-bold text-white">콘서트 개최 & 방송 스케줄</h2>
          <p className="text-xs text-slate-400 mt-1">
            출연할 아이돌을 선택해 방송 스케줄을 수주하고, 대형 콘서트를 개최하세요.
          </p>
        </div>

        {state.groups.length > 0 && (
          <div className="shrink-0">
            <label className="text-[10px] text-slate-400 block mb-1 font-bold">주요 대표 그룹:</label>
            <select
              value={selectedGroupId}
              onChange={e => setSelectedGroupId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-pink-500"
            >
              {state.groups.map(g => (
                <option key={g.id} value={g.id}>{g.name} (팬덤 {g.fandom.toLocaleString()}명)</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Broadcast Activities Row */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center space-x-2">
          <Radio className="w-4 h-4 text-pink-400" />
          <span>주간 미디어 & 방송 스케줄 수주</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs">📺 지상파 음악방송</div>
                <span className="text-[10px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-semibold border border-rose-500/30">
                  체력 -40 | 멘탈 -40
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">뮤직 스테이지, 쇼! 멜로디중심 생방송 출연 무대</p>
              <div className="text-[11px] text-pink-300 font-bold mt-1.5 flex items-center space-x-1">
                <span>💰 출연료: 1인당 20만원 ~ 29만원 (능력치 비례)</span>
              </div>
            </div>
            <button
              onClick={() => handleOpenBroadcastModal('MUSIC_SHOW')}
              className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-lg text-xs transition mt-2 shadow-md shadow-pink-600/20"
            >
              출연 아이돌 선택 & 방송 수주
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs">🌟 대표 인기 예능</div>
                <span className="text-[10px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded font-semibold border border-purple-500/30">
                  체력 -30 | 멘탈 -30
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">러닌맨, 퀴즈온더블록 등 간판 예능 출연</p>
              <div className="text-[11px] text-purple-300 font-bold mt-1.5 flex items-center space-x-1">
                <span>💰 출연료: 1인당 15만원 ~ 25만원 (능력치 비례)</span>
              </div>
            </div>
            <button
              onClick={() => handleOpenBroadcastModal('VARIETY')}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition mt-2 shadow-md shadow-purple-600/20"
            >
              출연 아이돌 선택 & 방송 수주
            </button>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-white text-xs">📱 유튜브 라이브 & 숏폼</div>
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-semibold border border-cyan-500/30">
                  체력 -20 | 멘탈 -20
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">글로벌 플랫폼 라이브 소통 및 바이럴</p>
              <div className="text-[11px] text-cyan-300 font-bold mt-1.5 flex items-center space-x-1">
                <span>💰 출연료: 1인당 10만원 ~ 19만원 (능력치 비례)</span>
              </div>
            </div>
            <button
              onClick={() => handleOpenBroadcastModal('YOUTUBE')}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition mt-2 shadow-md shadow-cyan-600/20"
            >
              출연 아이돌 선택 & 방송 수주
            </button>
          </div>
        </div>
      </div>

      {/* Concert Venues Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center space-x-2">
            <Ticket className="w-4 h-4 text-emerald-400" />
            <span>콘서트 공연장 대관 목록</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            * 팬미팅홀은 개별 아이돌 참여 가능 / 일반 콘서트는 그룹 단위 개최
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CONCERT_VENUES.map(v => {
            const isFandomMet = state.fandom >= v.minFandomRequired;
            const isMoneyMet = state.money >= v.rentCost;
            const isFanMeeting = v.id === 'v1';

            return (
              <div
                key={v.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-4 ${
                  isFandomMet ? 'border-slate-800' : 'border-slate-800/50 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      수용 관객: {v.capacity.toLocaleString()} 명
                    </span>
                    {isFanMeeting && (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        개별 아이돌 선택 가능
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-base mt-1.5">{v.name}</h4>
                  <div className="space-y-1 text-xs text-slate-400 mt-2">
                    <div>대관비: <span className="font-bold text-rose-400">₩{v.rentCost.toLocaleString()}</span></div>
                    <div>티켓 가격: <span className="font-bold text-emerald-400">₩{v.ticketPrice.toLocaleString()}</span></div>
                    <div>최소 필요 팬클럽: <span className="font-bold text-amber-300">{v.minFandomRequired.toLocaleString()} 명</span></div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenConcertModal(v)}
                  disabled={!isFandomMet || !isMoneyMet}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                >
                  {!isFandomMet ? (
                    <span>팬클럽 부족 ({state.fandom}/{v.minFandomRequired})</span>
                  ) : !isMoneyMet ? (
                    <span>대관료 자금 부족</span>
                  ) : (
                    <span>콘서트 개최 준비</span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* World Tour Banner & Section (At the bottom of Concert Tab) */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Global Tour Master</span>
            </span>
            <span className="text-xs text-amber-300 font-bold flex items-center space-x-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>36개국 세계지도 기반 스마트 루트</span>
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center space-x-2">
            <span>🌍 K-POP 글로벌 스타 세계투어 (World Tour)</span>
          </h3>

          <p className="text-xs text-slate-300 leading-relaxed">
            세계 지도를 펼쳐 36개 주요 국가의 투어 동선을 설계하세요. 한국에서 먼 거리일수록 항공 경비가 비싸지지만,
            <b>인접 국가 간 경유 비행기 루트</b>를 효율적으로 연결하면 항공 비용을 대폭 절감하여 막대한 정산 흑자를 달성할 수 있습니다!
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsWorldTourModalOpen(true);
          }}
          className="z-10 shrink-0 px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold rounded-2xl text-sm transition-all shadow-xl shadow-indigo-600/30 hover:scale-105 flex items-center space-x-2.5 cursor-pointer"
        >
          <Plane className="w-5 h-5 animate-bounce" />
          <span>✈️ 세계투어 지도 열기 및 일정 설계</span>
        </button>
      </div>

      {/* World Tour Modal */}
      {isWorldTourModalOpen && (
        <WorldTourModal
          state={state}
          onClose={() => setIsWorldTourModalOpen(false)}
          onUpdateState={onUpdateState}
        />
      )}

      {/* Broadcast Idol Selection Modal */}
      {activeBroadcastType && (() => {
        const config = BROADCAST_CONFIGS[activeBroadcastType];
        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative flex flex-col max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setActiveBroadcastType(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-0.5 rounded border font-bold ${config.badgeBg} ${config.badgeText}`}>
                    {config.title}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">출연 아이돌 선택</h3>
                <p className="text-xs text-slate-400 mt-1">
                  스케줄을 수행할 아이돌을 선택하세요. 스케줄 완료 시 선택한 아이돌의{' '}
                  <span className="text-rose-400 font-bold">체력 -{config.staminaCost}</span>,{' '}
                  <span className="text-purple-400 font-bold">멘탈 -{config.mentalCost}</span>이 차감됩니다.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={handleSelectAllTrainees}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  전체 선택
                </button>
                <button
                  onClick={handleDeselectAllTrainees}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold rounded-lg border border-slate-700 transition"
                >
                  선택 해제
                </button>
                {state.groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleSelectGroupTrainees(g.id)}
                    className="px-2.5 py-1 bg-pink-950/60 hover:bg-pink-900/80 text-pink-300 text-xs font-semibold rounded-lg border border-pink-800 transition"
                  >
                    [{g.name}] 멤버 선택
                  </button>
                ))}
              </div>

              {/* Trainees Selection List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {state.trainees.length === 0 ? (
                  <p className="text-center text-slate-500 text-xs py-8">소속 연습생/아이돌이 없습니다.</p>
                ) : (
                      state.trainees.map(t => {
                        const isSelected = selectedTraineeIds.includes(t.id);
                        const group = state.groups.find(g => g.id === t.groupId);
                        const hasEnoughStamina = t.stamina >= config.staminaCost;
                        const hasEnoughMental = t.mental >= config.mentalCost;
                        const canParticipate = hasEnoughStamina && hasEnoughMental;

                        const postStamina = Math.max(0, t.stamina - config.staminaCost);
                        const postMental = Math.max(0, t.mental - config.mentalCost);

                        const skillSum = t.vocal + t.dance + t.charisma + t.visual;
                        const ratio = Math.min(1, skillSum / 400);
                        const traineeFee = Math.floor(config.minFee + ratio * (config.maxFee - config.minFee));

                        const chartRank = getTraineeChartRank(t, state);
                        const chartBonusRatio = getChartRankBonusMultiplier(chartRank);
                        const auraClasses = getChartAuraClasses(chartRank);
                        const finalFee = Math.floor(traineeFee * (1 + chartBonusRatio));

                        return (
                          <div
                            key={t.id}
                            onClick={() => handleToggleTrainee(t.id)}
                            className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-slate-800/90 border-cyan-500/60 shadow-md'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {/* Left Info: Checkbox + Avatar + Name */}
                            <div className="flex items-center space-x-3 shrink-0 min-w-0">
                              <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-cyan-500 text-slate-950' : 'border border-slate-600 bg-slate-900'
                              }`}>
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>

                              <div className={`w-10 h-10 rounded-xl relative overflow-hidden bg-slate-800 shrink-0 border border-slate-700 ${auraClasses}`}>
                                {t.profileImage ? (
                                  <img src={t.profileImage} alt={t.name} className="w-full h-full object-cover animate-breathing" />
                                ) : (
                                  <div className={`w-full h-full ${t.avatarBg} flex items-center justify-center font-bold text-white text-sm`}>
                                    {t.name.slice(0, 1)}
                                  </div>
                                )}
                                {chartRank !== null && (
                                  <span className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-bl shadow">
                                    👑{chartRank}위
                                  </span>
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center space-x-1.5">
                                  <span className="font-bold text-white text-sm truncate">{getTraineeDisplayName(t)}</span>
                                  {group && (
                                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/30 shrink-0 font-medium">
                                      {group.name}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span>{t.age}세 / {t.status === 'DEBUTED' ? '데뷔' : '연습생'}</span>
                                  <span className="text-amber-300 font-medium">(출연료 ₩{finalFee.toLocaleString()})</span>
                                  {chartRank !== null && (
                                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                                      👑 차트 {chartRank}위 (+{Math.round(chartBonusRatio * 100)}%)
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Right Condition Bars */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 shrink-0 text-xs">
                          {/* Stamina Bar */}
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center space-x-1 text-slate-300">
                                <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>체력:</span>
                              </span>
                              <span className={`font-bold ${!hasEnoughStamina ? 'text-rose-400' : 'text-amber-300'}`}>
                                {t.stamina}
                                {isSelected && (
                                  <span className="text-rose-400 font-normal ml-0.5">
                                    → {postStamina}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all ${
                                  t.stamina < 30 ? 'bg-rose-500' : 'bg-amber-400'
                                }`}
                                style={{ width: `${t.stamina}%` }}
                              />
                            </div>
                          </div>

                          {/* Mental Bar */}
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="flex items-center space-x-1 text-slate-300">
                                <Heart className="w-3 h-3 text-pink-400 shrink-0" />
                                <span>멘탈:</span>
                              </span>
                              <span className={`font-bold ${!hasEnoughMental ? 'text-rose-400' : 'text-pink-300'}`}>
                                {t.mental}
                                {isSelected && (
                                  <span className="text-rose-400 font-normal ml-0.5">
                                    → {postMental}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`h-full transition-all ${
                                  t.mental < 30 ? 'bg-rose-500' : 'bg-pink-400'
                                }`}
                                style={{ width: `${t.mental}%` }}
                              />
                            </div>
                          </div>

                          {!canParticipate && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-bold shrink-0 flex items-center space-x-1">
                              <ShieldAlert className="w-3 h-3" />
                              <span>피로 누적!</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Modal Footer */}
              {(() => {
                const totalExpectedFee = state.trainees
                  .filter(t => selectedTraineeIds.includes(t.id))
                  .reduce((acc, t) => {
                    const skillSum = t.vocal + t.dance + t.charisma + t.visual;
                    const ratio = Math.min(1, skillSum / 400);
                    const baseFee = Math.floor(config.minFee + ratio * (config.maxFee - config.minFee));
                    const rank = getTraineeChartRank(t, state);
                    const bonus = getChartRankBonusMultiplier(rank);
                    return acc + Math.floor(baseFee * (1 + bonus));
                  }, 0);

                return (
                  <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-xs text-slate-300 font-medium flex items-center space-x-3">
                      <span>선택된 아이돌: <span className="font-bold text-cyan-400">{selectedTraineeIds.length}</span> 명</span>
                      <span className="text-amber-300 font-bold">예상 총 출연료: +₩{totalExpectedFee.toLocaleString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setActiveBroadcastType(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleExecuteBroadcast}
                        disabled={selectedTraineeIds.length === 0}
                        className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        스케줄 시작 (출연 확정)
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        );
      })()}

      {/* Concert Host Preparation Modal */}
      {selectedVenue && (() => {
        const venue = selectedVenue;
        const isFanMeeting = venue.id === 'v1';
        const participants = getConcertParticipants();

        // Stamina <= 50 check (Block execution!)
        const staminaBlockedMembers = participants.filter(t => t.stamina <= 50);
        const isStaminaBlocked = staminaBlockedMembers.length > 0;

        // Stamina <= 70 or Mental <= 70 check (Risk of failure >= 60%)
        const lowConditionMembers = participants.filter(t => t.stamina <= 70 || t.mental <= 70);
        const isHighFailureRisk = lowConditionMembers.length > 0;
        const failureRiskPercent = isHighFailureRisk ? 85 : 25;

        // Average stats calculation
        const totalAvgStats = participants.length > 0
          ? participants.reduce((acc, t) => acc + getTraineeAvgStat(t), 0) / participants.length
          : 0;
        const rewardScale = Math.min(1.0, Math.max(0.2, 0.20 + 0.80 * (totalAvgStats / 100)));

        const baseSold = Math.min(venue.capacity, Math.floor(state.fandom * 0.8));
        const estGrossRevenue = Math.floor(baseSold * venue.ticketPrice * rewardScale * 0.7);
        const estNetProfit = estGrossRevenue - venue.rentCost;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative flex flex-col max-h-[90vh]">
              {/* Close Button */}
              <button
                onClick={() => setSelectedVenue(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                  {venue.name}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">콘서트 개최 준비</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  수용 관객: {venue.capacity.toLocaleString()}명 | 대관료: ₩{venue.rentCost.toLocaleString()} | 최소 팬클럽: {venue.minFandomRequired.toLocaleString()}명
                </p>
              </div>

              {/* Participation Mode Selection */}
              <div className="space-y-2 border-t border-slate-800 pt-3">
                <label className="text-xs font-bold text-slate-300 block">🎤 공연 출연진 설정</label>

                {isFanMeeting ? (
                  <div className="space-y-3">
                    <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 text-xs">
                      <button
                        onClick={() => setConcertMode('INDIVIDUAL')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                          concertMode === 'INDIVIDUAL'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>개별 아이돌 직접 선택</span>
                      </button>
                      <button
                        onClick={() => setConcertMode('GROUP')}
                        className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center space-x-1 ${
                          concertMode === 'GROUP'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>데뷔 그룹 선택</span>
                      </button>
                    </div>

                    {concertMode === 'INDIVIDUAL' && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-400">참여할 아이돌 멤버를 선택하세요:</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
                          {state.trainees.map(t => {
                            const isChecked = concertIndividualIds.includes(t.id);
                            return (
                              <button
                                key={t.id}
                                onClick={() => {
                                  setConcertIndividualIds(prev =>
                                    prev.includes(t.id) ? prev.filter(id => id !== t.id) : [...prev, t.id]
                                  );
                                }}
                                className={`p-2 rounded-xl border text-xs font-bold flex items-center space-x-2 transition ${
                                  isChecked
                                    ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200'
                                    : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                  isChecked ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-900'
                                }`}>
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                                <span className="truncate">{getTraineeDisplayName(t)}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {concertMode === 'GROUP' && (
                      <div>
                        <select
                          value={concertGroupSelection}
                          onChange={e => setConcertGroupSelection(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          {state.groups.map(g => (
                            <option key={g.id} value={g.id}>
                              [{g.name}] (멤버 {g.memberIds.length}명 / 팬덤 {g.fandom.toLocaleString()}명)
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-400 mb-2">
                      * 본 대형 콘서트는 <span className="text-emerald-400 font-bold">정식 데뷔 그룹</span> 단위로만 개최할 수 있습니다.
                    </p>
                    {state.groups.length === 0 ? (
                      <p className="text-xs text-rose-400 font-bold py-2">
                        ⚠️ 현재 데뷔된 그룹이 없습니다. 아티스트 관리에서 그룹을 결성해주세요!
                      </p>
                    ) : (
                      <select
                        value={concertGroupSelection}
                        onChange={e => setConcertGroupSelection(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                      >
                        {state.groups.map(g => (
                          <option key={g.id} value={g.id}>
                            [{g.name}] (멤버 {g.memberIds.length}명 / 그룹 팬덤 {g.fandom.toLocaleString()}명)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              {/* Participants Condition & Risk Status Audit */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>참여진 상태 검사 ({participants.length}명)</span>
                  <span className="text-[11px] text-slate-400">
                    평균 능력치: <span className="text-cyan-400 font-bold">{totalAvgStats.toFixed(1)}점</span>
                  </span>
                </div>

                {/* Warning Banner if Stamina <= 50 */}
                {isStaminaBlocked && (
                  <div className="bg-rose-950/80 border border-rose-500/80 rounded-xl p-3 flex items-start space-x-2.5 text-rose-200 text-xs">
                    <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-rose-300">🚫 콘서트 실행 불가! (체력 50 이하 멤버 포함)</div>
                      <div className="text-[11px] text-rose-300/80 mt-0.5">
                        [
                        {staminaBlockedMembers.map(m => getTraineeDisplayName(m)).join(', ')}
                        ] 연습생의 체력이 50 이하입니다. 휴식이나 보양식 케어로 체력을 회복시켜 주세요.
                      </div>
                    </div>
                  </div>
                )}

                {/* Warning Banner for High Failure Risk (Stamina/Mental <= 70) */}
                {isHighFailureRisk && !isStaminaBlocked && (
                  <div className="bg-amber-950/80 border border-amber-500/80 rounded-xl p-3 flex items-start space-x-2.5 text-amber-200 text-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-300">⚠️ 공연 실패 위험 확률 85%! (컨디션 난조)</div>
                      <div className="text-[11px] text-amber-300/80 mt-0.5">
                        참여 멤버 중 체력 또는 멘탈이 70 이하인 아이돌이 있어 무대 실패 시 <b>대관료 손실(적자)</b>, <b>팬클럽 감소</b> 및 <b>멘탈 차감(-10~30)</b>이 발생할 수 있습니다.
                      </div>
                    </div>
                  </div>
                )}

                {/* Member List */}
                <div className="space-y-2">
                  {participants.map(t => {
                    const isStaminaLow = t.stamina <= 50;
                    const isConditionLow = t.stamina <= 70 || t.mental <= 70;
                    const avgStat = getTraineeAvgStat(t);

                    return (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border flex items-center justify-between text-xs gap-3 ${
                          isStaminaLow
                            ? 'bg-rose-950/40 border-rose-800'
                            : isConditionLow
                            ? 'bg-amber-950/30 border-amber-800/80'
                            : 'bg-slate-950/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5 shrink-0 min-w-0">
                          <div className="w-8 h-8 rounded-lg relative overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                            {t.profileImage ? (
                              <img src={t.profileImage} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full ${t.avatarBg} flex items-center justify-center font-bold text-white text-xs`}>
                                {t.name.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs truncate">{getTraineeDisplayName(t)}</div>
                            <div className="text-[10px] text-slate-400">능력치 평균: {avgStat.toFixed(1)}점</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-[11px]">
                          {/* Stamina Badge */}
                          <div className="flex items-center space-x-1">
                            <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className={t.stamina <= 50 ? 'text-rose-400 font-bold' : t.stamina <= 70 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                              체력 {t.stamina}
                            </span>
                          </div>

                          {/* Mental Badge */}
                          <div className="flex items-center space-x-1">
                            <Heart className="w-3 h-3 text-pink-400 shrink-0" />
                            <span className={t.mental <= 70 ? 'text-amber-300 font-bold' : 'text-slate-300'}>
                              멘탈 {t.mental}
                            </span>
                          </div>

                          {/* Status Tag */}
                          {isStaminaLow ? (
                            <span className="text-[9px] bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded font-bold border border-rose-500/30">
                              체력 50이하 (불가)
                            </span>
                          ) : isConditionLow ? (
                            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
                              위험 (≤70)
                            </span>
                          ) : (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold border border-emerald-500/30">
                              양호
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Expected Results Summary Box */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="font-bold text-slate-200 flex items-center space-x-1.5">
                    <Award className="w-4 h-4 text-cyan-400" />
                    <span>공연 정산 & 위험성 예측</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">실패 위험 확률:</div>
                      <div className={`font-bold mt-0.5 ${isHighFailureRisk ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {failureRiskPercent}% {isHighFailureRisk && '(체력/멘탈 70 이하 포함)'}
                      </div>
                    </div>

                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                      <div className="text-slate-400">능력치 기반 보상 비율:</div>
                      <div className="font-bold text-cyan-300 mt-0.5">
                        {Math.round(rewardScale * 100)}% <span className="text-[9px] text-slate-400 font-normal">(100점 = 100%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-slate-300 border-t border-slate-800/80">
                    <span>성공 시 예상 순수익:</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      ₩{estNetProfit.toLocaleString()}
                    </span>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-xs text-slate-400">
                  {isStaminaBlocked
                    ? '⚠️ 체력 50 이하 멤버가 있어 실행할 수 없습니다.'
                    : `대관료 ₩${venue.rentCost.toLocaleString()} 지출됩니다.`}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedVenue(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleExecuteConcert}
                    disabled={isStaminaBlocked || participants.length === 0 || state.money < venue.rentCost || state.fandom < venue.minFandomRequired}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1"
                  >
                    <Ticket className="w-4 h-4" />
                    <span>콘서트 개최 실행</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Real-Time Agency News Popup Modal (Semi-transparent, 50% size centered popup, auto closes in 4s or on X click) */}
      {concertNewsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-11/12 sm:w-1/2 max-w-xl bg-slate-900/90 border-2 border-pink-500/70 rounded-2xl p-6 shadow-[0_0_50px_rgba(236,72,153,0.35)] backdrop-blur-md text-white flex flex-col justify-between min-h-[220px]">
            {/* Top Right Close X Button */}
            <button
              onClick={() => setConcertNewsPopup(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 p-1.5 rounded-full transition cursor-pointer z-10"
              title="바로 닫기"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              {/* Header Badge */}
              <div className="flex items-center space-x-2 mb-3">
                <span className="bg-gradient-to-r from-pink-500 via-purple-600 to-indigo-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center space-x-1.5 shadow-md animate-pulse">
                  <Radio className="w-3.5 h-3.5 text-pink-200" />
                  <span>기획사 실시간 속보</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">자동 닫힘 (4초)</span>
              </div>

              {/* News Title */}
              <h3 className={`text-lg sm:text-xl font-extrabold mb-3 flex items-center space-x-2 ${
                concertNewsPopup.isNegative ? 'text-rose-400' : 'text-cyan-300'
              }`}>
                <span>{concertNewsPopup.title}</span>
              </h3>

              {/* News Content */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed shadow-inner">
                {concertNewsPopup.content}
              </div>
            </div>

            {/* Countdown Progress Bar */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                <span>AGENCY LIVE NEWS</span>
                <span>{Math.max(0, Math.ceil((popupProgress / 100) * 4))}초 후 자동으로 닫힙니다</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-400 transition-all duration-75 ease-linear"
                  style={{ width: `${popupProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


