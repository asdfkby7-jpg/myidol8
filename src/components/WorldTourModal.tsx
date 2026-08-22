import React, { useState, useMemo } from 'react';
import { GameState, Group, Trainee } from '../types';
import {
  WORLD_TOUR_COUNTRIES,
  HOME_COUNTRY,
  HIGH_PROFIT_COUNTRY_IDS,
  CountryNode,
  calculateLegFlightCost,
  calculateCountryConcertResult,
  calculateMapDistance,
  calculateBranchCost,
  isCountryProfitable,
} from '../data/worldTourData';
import { sound } from '../utils/sound';
import { syncFandoms } from '../utils/gameEngine';
import {
  Globe,
  Plane,
  MapPin,
  TrendingUp,
  X,
  Sparkles,
  Users,
  AlertTriangle,
  ChevronRight,
  Trash2,
  Plus,
  Compass,
  Check,
  CheckCircle2,
  Award,
  DollarSign,
  HelpCircle,
  Building2,
  Heart,
  Zap,
} from 'lucide-react';

interface WorldTourModalProps {
  state: GameState;
  onClose: () => void;
  onUpdateState: (newState: GameState) => void;
}

export const WorldTourModal: React.FC<WorldTourModalProps> = ({
  state,
  onClose,
  onUpdateState,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    state.groups[0]?.id || ''
  );
  
  // Route sequence of Country Node IDs
  const [routeCountryIds, setRouteCountryIds] = useState<string[]>(['JP', 'CN']);

  // Selected Country for Detail Tooltip in Map
  const [hoveredCountry, setHoveredCountry] = useState<CountryNode | null>(null);

  // Overseas Branch Purchase Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState<boolean>(false);

  // Result summary after executing tour
  const [tourResult, setTourResult] = useState<{
    groupName: string;
    totalAudience: number;
    totalGrossRevenue: number;
    totalExpense: number;
    netProfit: number;
    fandomGained: number;
    bestCity: string;
    stopsCount: number;
    branchesUsedCount: number;
  } | null>(null);

  const selectedGroup = useMemo(() => {
    return state.groups.find((g) => g.id === selectedGroupId) || state.groups[0];
  }, [state.groups, selectedGroupId]);

  const groupMembers = useMemo(() => {
    if (!selectedGroup) return [];
    return state.trainees.filter((t) => selectedGroup.memberIds.includes(t.id));
  }, [state.trainees, selectedGroup]);

  // Agency established branches
  const agencyBranches = useMemo(() => state.agencyBranches || [], [state.agencyBranches]);

  // Combined fandom
  const activeFandom = selectedGroup ? selectedGroup.fandom : state.fandom;
  const numMembers = groupMembers.length || 1;

  // Group initial averages
  const initialAvgStamina = useMemo(() => {
    if (groupMembers.length === 0) return 100;
    return Math.round(groupMembers.reduce((acc, m) => acc + m.stamina, 0) / groupMembers.length);
  }, [groupMembers]);

  const initialAvgMental = useMemo(() => {
    if (groupMembers.length === 0) return 100;
    return Math.round(groupMembers.reduce((acc, m) => acc + m.mental, 0) / groupMembers.length);
  }, [groupMembers]);

  // Selected country objects
  const routeCountries = useMemo(() => {
    return routeCountryIds
      .map((id) => WORLD_TOUR_COUNTRIES.find((c) => c.id === id))
      .filter((c): c is CountryNode => c !== undefined);
  }, [routeCountryIds]);

  // Calculate detailed route costs, condition fatigue & branch stamina recovery
  const routeAnalysis = useMemo(() => {
    let currentStop = HOME_COUNTRY;
    let totalFlightCost = 0;
    let totalVenueCost = 0;
    let totalFuelSurcharge = 0;
    let totalGrossRevenue = 0;
    let totalAudience = 0;
    let directLongHaulCost = 0;
    let branchesUsedCount = 0;

    // Simulate group stamina & mental progression along the route
    let runningStamina = initialAvgStamina;
    let runningMental = initialAvgMental;

    const legs: Array<{
      from: CountryNode;
      to: CountryNode;
      flightCost: number;
      venueCost: number;
      fuelSurcharge: number;
      grossRevenue: number;
      netProfit: number;
      audience: number;
      isProfitableTierMet: boolean;
      hasBranch: boolean;
      avgStaminaAtStop: number;
      avgMentalAtStop: number;
      isLowCondition: boolean;
      isHighProfitCapped: boolean;
    }> = [];

    routeCountries.forEach((toCountry) => {
      const hasBranch = agencyBranches.includes(toCountry.id);
      if (hasBranch) {
        branchesUsedCount++;
        // Branch recovers +30 Stamina, consumes 10 Mental
        runningStamina = Math.min(100, runningStamina + 30 - 10);
        runningMental = Math.max(0, runningMental - 10);
      } else {
        // Standard tour stop consumes 10 Stamina & 10 Mental
        runningStamina = Math.max(0, runningStamina - 10);
        runningMental = Math.max(0, runningMental - 10);
      }

      const res = calculateCountryConcertResult(
        toCountry,
        currentStop,
        activeFandom,
        numMembers,
        runningStamina,
        runningMental,
        hasBranch
      );
      
      const directFlight = calculateLegFlightCost(HOME_COUNTRY, toCountry, numMembers) * 2;
      directLongHaulCost += directFlight;

      legs.push({
        from: currentStop,
        to: toCountry,
        flightCost: res.flightCost,
        venueCost: res.venueCost,
        fuelSurcharge: res.fuelSurcharge,
        grossRevenue: res.grossRevenue,
        netProfit: res.netProfit,
        audience: res.expectedAudience,
        isProfitableTierMet: res.isProfitableTierMet,
        hasBranch,
        avgStaminaAtStop: runningStamina,
        avgMentalAtStop: runningMental,
        isLowCondition: res.isLowCondition,
        isHighProfitCapped: res.isHighProfitCapped,
      });

      totalFlightCost += res.flightCost;
      totalVenueCost += res.venueCost;
      totalFuelSurcharge += res.fuelSurcharge;
      totalGrossRevenue += res.grossRevenue;
      totalAudience += res.expectedAudience;

      currentStop = toCountry;
    });

    let returnFlightCost = 0;
    if (routeCountries.length > 0) {
      returnFlightCost = calculateLegFlightCost(currentStop, HOME_COUNTRY, numMembers);
      totalFlightCost += returnFlightCost;
    }

    const totalExpense = totalFlightCost + totalVenueCost;
    const netProfit = totalGrossRevenue - totalExpense;
    const flightSavings = Math.max(0, directLongHaulCost - totalFlightCost);

    return {
      legs,
      returnFlightCost,
      totalFlightCost,
      totalVenueCost,
      totalFuelSurcharge,
      totalExpense,
      totalGrossRevenue,
      netProfit,
      totalAudience,
      flightSavings,
      branchesUsedCount,
      finalAvgStamina: runningStamina,
      finalAvgMental: runningMental,
    };
  }, [routeCountries, activeFandom, numMembers, agencyBranches, initialAvgStamina, initialAvgMental]);

  // Handle adding or toggling a country in route
  const handleToggleCountry = (country: CountryNode) => {
    sound.playClick();
    if (routeCountryIds.includes(country.id)) {
      setRouteCountryIds(routeCountryIds.filter((id) => id !== country.id));
    } else {
      if (routeCountryIds.length >= 8) {
        alert('월드투어는 한 번에 최대 8개 국가까지 선택할 수 있습니다.');
        return;
      }
      setRouteCountryIds([...routeCountryIds, country.id]);
    }
  };

  const handleRemoveStop = (index: number) => {
    sound.playClick();
    const updated = [...routeCountryIds];
    updated.splice(index, 1);
    setRouteCountryIds(updated);
  };

  const handleClearRoute = () => {
    sound.playClick();
    setRouteCountryIds([]);
  };

  // Establish Overseas Branch
  const handlePurchaseBranch = (country: CountryNode) => {
    const cost = calculateBranchCost(country);
    if (state.money < cost) {
      alert(`지사 설립 자금이 부족합니다! (필요 자금: ₩${cost.toLocaleString()})`);
      return;
    }

    if (agencyBranches.includes(country.id)) {
      alert('이미 지사가 설립된 국가입니다.');
      return;
    }

    sound.playCash();
    sound.playLevelUp();

    const updatedBranches = [...agencyBranches, country.id];
    const isEgypt = country.id === 'EG';
    const newNewsItem = {
      id: `news_branch_${Date.now()}`,
      week: state.currentWeek,
      type: 'CONCERT' as const,
      title: `🏢 [글로벌 현지 지사 설립] ${country.flag} ${country.name} 해외 지사 정식 개소!${isEgypt ? ' (명예 대표 : 임호텝)' : ''}`,
      content: `${country.name} 현지 한국 지사가 성공적으로 개소되었습니다. (투자비: ₩${cost.toLocaleString()})\n` +
        `• 월드투어 진행 시 해당 국가에서 멤버 체력이 +30 회복되어 장기 해외 투어가 용이해집니다.` +
        (isEgypt ? `\n• 🏛️ 이집트 지사 정식 발령 - 명예 대표 : 임호텝` : ''),
      isNegative: false,
    };

    onUpdateState({
      ...state,
      money: state.money - cost,
      agencyBranches: updatedBranches,
      news: [newNewsItem, ...state.news],
    });

    alert(`🎉 ${country.name} 현지 한국 지사가 성공적으로 설립되었습니다! (월드투어 시 체력 +30 회복)${isEgypt ? '\n\n🏛️ [명예 대표 : 임호텝] 정식 임명!' : ''}`);
  };

  // Execute World Tour
  const handleExecuteTour = () => {
    if (routeCountryIds.length === 0) {
      alert('투어 일정을 최소 1개 국가 이상 선택해주세요!');
      return;
    }

    if (state.money < routeAnalysis.totalExpense) {
      alert(`투어 항공 및 대관 경비 자금이 부족합니다! (필요 자금: ₩${routeAnalysis.totalExpense.toLocaleString()})`);
      return;
    }

    // Check minimum stamina condition
    const lowStaminaMembers = groupMembers.filter((m) => m.stamina < 15);
    if (lowStaminaMembers.length > 0) {
      alert(`체력이 15 이하인 멤버가 있어 월드투어를 시작할 수 없습니다: ${lowStaminaMembers.map((m) => m.name).join(', ')}`);
      return;
    }

    sound.playCash();
    sound.playLevelUp();

    // Calculate outcomes
    const netMoneyChange = routeAnalysis.netProfit;
    const isTourSuccess = netMoneyChange >= 0;

    // National fandom gained on tour success is 1/10th level
    const fandomGained = isTourSuccess
      ? Math.round(routeAnalysis.totalAudience * 0.015)
      : Math.round(routeAnalysis.totalAudience * 0.15);

    // Calculate individual member contribution for world tour bonus
    const participatingMembers = state.trainees.filter(t => selectedGroup?.memberIds.includes(t.id));
    const memberStatsMap = new Map<string, number>();
    let maxMemberStatSum = 0;
    let totalGroupStatSum = 0;

    participatingMembers.forEach(m => {
      const statSum = m.vocal + m.dance + m.charisma + m.visual;
      memberStatsMap.set(m.id, statSum);
      totalGroupStatSum += statSum;
      if (statSum > maxMemberStatSum) maxMemberStatSum = statSum;
    });

    let totalBonusMemberFanGain = 0;

    // Apply leg-by-leg stamina & mental updates + individual fandom increases & upkeep +50% on tour success
    const updatedTrainees = state.trainees.map((t) => {
      if (selectedGroup?.memberIds.includes(t.id)) {
        let memberStamina = t.stamina;
        let memberMental = t.mental;

        routeCountries.forEach((c) => {
          const hasBranch = agencyBranches.includes(c.id);
          if (hasBranch) {
            memberStamina = Math.min(100, memberStamina + 30 - 10);
            memberMental = Math.max(0, memberMental - 10);
          } else {
            memberStamina = Math.max(0, memberStamina - 10);
            memberMental = Math.max(0, memberMental - 10);
          }
        });

        // World tour success rule: Up to 30 fandom gain per member based on contribution ratio (1/10th of 300)
        const mStat = memberStatsMap.get(t.id) || 1;
        const contribRatio = maxMemberStatSum > 0 ? (mStat / maxMemberStatSum) : 1;
        const tourBonusFandom = isTourSuccess ? Math.round(30 * contribRatio) : 0;
        totalBonusMemberFanGain += tourBonusFandom;

        // Share of route audience fandom gain
        const audienceRatio = totalGroupStatSum > 0 ? (mStat / totalGroupStatSum) : (1 / (participatingMembers.length || 1));
        const audienceShareFandom = Math.round(fandomGained * audienceRatio);

        const totalMemberFanGain = tourBonusFandom + audienceShareFandom;

        // World tour success rule: Member weekly salary (주급) increases by 50%
        const updatedUpkeep = isTourSuccess ? Math.round(t.upkeep * 1.5) : t.upkeep;

        return {
          ...t,
          stamina: memberStamina,
          mental: memberMental,
          popularity: Math.min(100, t.popularity + Math.floor(routeCountries.length * 2.5)),
          fandom: (t.fandom || 0) + totalMemberFanGain,
          upkeep: updatedUpkeep,
        };
      }
      return t;
    });

    let bestCityName = routeCountries[0]?.name || '없음';
    let maxAudience = 0;
    routeAnalysis.legs.forEach((leg) => {
      if (leg.audience > maxAudience) {
        maxAudience = leg.audience;
        bestCityName = leg.to.name;
      }
    });

    const newsTitle = netMoneyChange >= 0
      ? `🌍 [월드투어 대성공] ${selectedGroup?.name || '아이돌'} 그룹 ${routeCountries.length}개국 월드투어 흑자 달성!`
      : `✈️ [월드투어 완료] ${selectedGroup?.name || '아이돌'} 글로벌 무대 성료 (경비 부담 적자 기록)`;

    const bonusFanNotice = isTourSuccess ? `\n• 멤버 개별 팬덤: 기여도별 최대 +30명 (총 +${totalBonusMemberFanGain.toLocaleString()}명 증가)\n• 투어 성공 성과 보상: 멤버 주급 +50% 인상` : '';
    const newsContent = `글로벌 ${routeCountries.length}개국 투어 종합 결과:\n` +
      `• 총관객: ${routeAnalysis.totalAudience.toLocaleString()}명\n` +
      `• 순수익: ${netMoneyChange >= 0 ? '+' : ''}₩${netMoneyChange.toLocaleString()}\n` +
      `• 신규 팬클럽: +${fandomGained.toLocaleString()}명 유입!${bonusFanNotice}\n` +
      `• 최고 동원 도시: ${bestCityName} (${maxAudience.toLocaleString()}명)\n` +
      `• 현지 지사 이용: ${routeAnalysis.branchesUsedCount}개국 (체력 회복 지원)`;

    const newNewsItem = {
      id: `news_wt_${Date.now()}`,
      week: state.currentWeek || state.week,
      type: 'CONCERT' as const,
      title: newsTitle,
      content: newsContent,
      isNegative: netMoneyChange < 0,
    };

    const rawTourState: GameState = {
      ...state,
      money: state.money + netMoneyChange,
      trainees: updatedTrainees,
      groups: state.groups.map((g) => {
        if (g.id === selectedGroup?.id) {
          return {
            ...g,
            reputation: Math.min(100, g.reputation + routeCountries.length * 2),
          };
        }
        return g;
      }),
      news: [newNewsItem, ...(state.news || [])],
      newsList: [newNewsItem, ...(state.newsList || [])],
    };

    onUpdateState(syncFandoms(rawTourState));

    setTourResult({
      groupName: selectedGroup?.name || '아이돌 그룹',
      totalAudience: routeAnalysis.totalAudience,
      totalGrossRevenue: routeAnalysis.totalGrossRevenue,
      totalExpense: routeAnalysis.totalExpense,
      netProfit: routeAnalysis.netProfit,
      fandomGained,
      bestCity: bestCityName,
      stopsCount: routeCountries.length,
      branchesUsedCount: routeAnalysis.branchesUsedCount,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-2 overflow-y-auto">
      <div className="bg-slate-900 border-0 sm:border border-slate-800 rounded-none sm:rounded-2xl w-full max-w-7xl shadow-2xl overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[98vh] relative text-white">
        
        {/* Header */}
        <div className="p-2.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 sm:p-2 bg-indigo-500/20 border border-indigo-500/30 rounded-xl text-indigo-400">
              <Globe className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider">
                  Global Tour Master
                </span>
                <span className="text-[11px] sm:text-xs text-amber-300 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>스마트 항공 루트 & 지사 체력 회복 패널</span>
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-extrabold text-white mt-0.5">
                K-POP 월드투어 경로 설계 및 한국지사 경영
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-1.5 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-2.5 sm:gap-5">
          
          {/* Left Column: Interactive World Map (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-2 sm:space-y-3 flex flex-col justify-between">
            
            {/* Group Selector & Info Bar */}
            <div className="bg-slate-950/90 p-2 sm:p-3 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-medium">참여 그룹:</span>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 font-bold text-white focus:outline-none focus:border-indigo-500"
                >
                  {state.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} (팬클럽: {g.fandom.toLocaleString()}명)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3 text-slate-300">
                <div className="flex items-center space-x-1 text-emerald-400">
                  <Zap className="w-3.5 h-3.5" />
                  <span>초기 체력: <strong className="text-white">{initialAvgStamina}</strong></span>
                </div>
                <div className="flex items-center space-x-1 text-pink-400">
                  <Heart className="w-3.5 h-3.5" />
                  <span>초기 멘탈: <strong className="text-white">{initialAvgMental}</strong></span>
                </div>
                <div>
                  설립 지사: <span className="font-bold text-indigo-400">{agencyBranches.length}개국</span>
                </div>
              </div>
            </div>

            {/* SVG Interactive World Map Display - Zero Margin, Edge-to-Edge Stretched with Highlighted Landmasses */}
            <div className="relative bg-gradient-to-b from-[#070e1c] via-[#0f1d38] to-[#070e1c] border border-slate-800 rounded-xl p-0 shadow-2xl overflow-hidden select-none min-h-[460px] sm:min-h-[580px] h-[500px] sm:h-[650px] flex items-center justify-center">
              
              <svg
                viewBox="0 0 1000 680"
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                <defs>
                  <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#070d1a" />
                    <stop offset="50%" stopColor="#0d1b36" />
                    <stop offset="100%" stopColor="#060a14" />
                  </linearGradient>

                  <linearGradient id="landGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#1e293b" />
                    <stop offset="50%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#1e293b" />
                  </linearGradient>

                  <linearGradient id="landBorderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="50%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>

                  <linearGradient id="flightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#c084fc" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>

                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
                  </pattern>

                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* Ocean Background */}
                <rect width="1000" height="680" fill="url(#oceanGrad)" />
                <rect width="1000" height="680" fill="url(#grid)" />

                {/* Highlighted Detailed Continents Silhouette */}
                <g filter="url(#glow)">
                  {/* North America & Greenland */}
                  <path
                    d="M 60,110 C 120,80 200,70 300,80 C 350,90 380,60 410,70 C 420,110 390,140 350,110 C 330,120 300,100 280,140 C 270,180 250,230 220,280 C 200,320 180,340 160,310 C 170,270 200,230 180,180 C 130,200 90,160 60,110 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2.5"
                  />

                  {/* South America */}
                  <path
                    d="M 230,360 C 280,340 350,380 340,460 C 330,520 290,580 270,590 C 260,570 250,510 230,440 C 220,400 210,380 230,360 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2.5"
                  />

                  {/* Europe & Eurasia */}
                  <path
                    d="M 390,170 C 430,130 460,90 520,110 C 600,80 800,80 950,110 C 960,140 920,180 880,210 C 860,260 840,290 750,290 C 700,310 650,280 620,240 C 580,230 520,220 480,220 C 440,240 400,220 390,170 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2.5"
                  />

                  {/* British Isles */}
                  <path
                    d="M 405,160 C 420,150 425,175 415,190 C 400,185 400,170 405,160 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2"
                  />

                  {/* Japan Archipelago */}
                  <path
                    d="M 865,240 C 885,250 895,280 875,300 C 860,280 860,260 865,240 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2"
                  />

                  {/* Africa */}
                  <path
                    d="M 370,280 C 450,260 560,270 580,340 C 590,380 550,440 530,570 C 490,560 440,450 420,380 C 370,360 360,310 370,280 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2.5"
                  />

                  {/* India Subcontinent */}
                  <path
                    d="M 640,310 C 690,310 710,380 680,410 C 660,380 640,340 640,310 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2"
                  />

                  {/* SE Asia & Indonesia */}
                  <path
                    d="M 730,330 C 780,340 820,380 800,430 C 750,440 730,380 730,330 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2"
                  />

                  {/* Australia */}
                  <path
                    d="M 810,480 C 890,460 920,490 900,560 C 840,570 800,540 810,480 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2.5"
                  />

                  {/* New Zealand */}
                  <path
                    d="M 930,540 C 950,530 960,580 940,590 Z"
                    fill="url(#landGrad)"
                    stroke="url(#landBorderGrad)"
                    strokeWidth="2"
                  />
                </g>

                {/* Render Connected Flight Route Path Lines */}
                {(() => {
                  if (routeCountries.length === 0) return null;
                  
                  const points: CountryNode[] = [HOME_COUNTRY, ...routeCountries, HOME_COUNTRY];
                  const dPath = points.map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${Math.round(pt.y * 1.30)}`).join(' ');

                  return (
                    <g>
                      <path
                        d={dPath}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="4"
                        strokeOpacity="0.4"
                        filter="url(#glow)"
                      />
                      <path
                        d={dPath}
                        fill="none"
                        stroke="url(#flightGrad)"
                        strokeWidth="2.5"
                        strokeDasharray="8,6"
                        className="animate-[dash_15s_linear_infinite]"
                      />
                    </g>
                  );
                })()}

                {/* Render Home Country Pin (South Korea) */}
                {(() => {
                  const homeY = Math.round(HOME_COUNTRY.y * 1.30);
                  return (
                    <g transform={`translate(${HOME_COUNTRY.x}, ${homeY})`}>
                      <circle r="12" fill="#10b981" fillOpacity="0.2" />
                      <circle r="8" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      <text y="-14" textAnchor="middle" fill="#10b981" stroke="#020617" strokeWidth="2" paintOrder="stroke fill" fontSize="12" fontWeight="bold">
                        🇰🇷 대한민국 (출발)
                      </text>
                    </g>
                  );
                })()}

                {/* Render All Country Nodes - Scaled 30%+ Vertically */}
                {WORLD_TOUR_COUNTRIES.map((c) => {
                  const isSelected = routeCountryIds.includes(c.id);
                  const selectedIndex = routeCountryIds.indexOf(c.id) + 1;
                  const isProfitable = isCountryProfitable(c, activeFandom);
                  const hasBranch = agencyBranches.includes(c.id);
                  const nodeY = Math.round(c.y * 1.30);

                  return (
                    <g
                      key={c.id}
                      transform={`translate(${c.x}, ${nodeY})`}
                      className="cursor-pointer select-none group"
                      onClick={() => handleToggleCountry(c)}
                      onMouseEnter={() => setHoveredCountry(c)}
                      onMouseLeave={() => setHoveredCountry(null)}
                    >
                      {/* Generous Click & Touch Hitbox to ensure easy, instant 1-click tapping */}
                      <circle r="26" fill="transparent" />

                      {/* Selection Highlight Ring - Fixed stable glow ring without jumping spin animation */}
                      {isSelected && (
                        <circle
                          r="14"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeOpacity="0.85"
                          filter="url(#glow)"
                        />
                      )}

                      {/* Main Node Point */}
                      <circle
                        r={isSelected ? '9' : '7'}
                        fill={hasBranch ? '#10b981' : isSelected ? '#6366f1' : isProfitable ? '#eab308' : '#64748b'}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        className="transition-colors duration-150"
                      />

                      {/* Branch Badge Icon if Branch Exists */}
                      {hasBranch && (
                        <g transform="translate(-10, -10)">
                          <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
                          <text y="2.5" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">🏢</text>
                        </g>
                      )}

                      {/* Sequence Badge if Selected */}
                      {isSelected && (
                        <g transform="translate(10, -10)">
                          <circle r="8.5" fill="#ec4899" stroke="#ffffff" strokeWidth="1" />
                          <text
                            y="3.5"
                            textAnchor="middle"
                            fill="#ffffff"
                            fontSize="10"
                            fontWeight="extrabold"
                          >
                            {selectedIndex}
                          </text>
                        </g>
                      )}

                      {/* Country Flag & Label */}
                      <text
                        y="20"
                        textAnchor="middle"
                        fill={hasBranch ? '#34d399' : isSelected ? '#38bdf8' : isProfitable ? '#fef08a' : '#cbd5e1'}
                        stroke="#020617"
                        strokeWidth="2.5"
                        paintOrder="stroke fill"
                        fontSize="10.5"
                        fontWeight={isSelected || hasBranch ? 'bold' : 'normal'}
                        className="pointer-events-none drop-shadow-md"
                      >
                        {c.flag} {c.name}
                      </text>

                      {/* Egypt Branch / Tour Honorary Rep Imhotep text in 2x font size (21px vs 10.5px) */}
                      {c.id === 'EG' && (hasBranch || isSelected) && (
                        <text
                          y="42"
                          textAnchor="middle"
                          fill="#fbbf24"
                          stroke="#020617"
                          strokeWidth="3.5"
                          paintOrder="stroke fill"
                          fontSize="21"
                          fontWeight="900"
                          className="pointer-events-none drop-shadow-xl"
                        >
                          명예 대표 : 임호텝
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Map Info Overlay Tooltip */}
              {hoveredCountry && (() => {
                const isProfitable = isCountryProfitable(hoveredCountry, activeFandom);
                const hasBranch = agencyBranches.includes(hoveredCountry.id);
                const branchCost = calculateBranchCost(hoveredCountry);
                const reqFandomDisplay = (hoveredCountry.id === 'JP' || hoveredCountry.id === 'CN') ? 3000 : hoveredCountry.minProfitableFandom;

                return (
                  <div className="absolute bottom-3 left-3 bg-slate-900/95 border border-indigo-500/50 p-3 rounded-xl shadow-2xl backdrop-blur-md max-w-xs text-xs space-y-1.5 z-20">
                    <div className="flex items-center justify-between font-bold border-b border-slate-800 pb-1">
                      <span className="text-white text-sm flex items-center space-x-1">
                        <span>{hoveredCountry.flag} {hoveredCountry.name}</span>
                        {hasBranch && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">🏢 지사</span>}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isProfitable ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isProfitable ? '흑자 가능 🟢' : '적자 주의 🔴'}
                      </span>
                    </div>

                    <div className="text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">필요 흑자 팬클럽:</span>
                        <span className="font-semibold text-amber-300">
                          {reqFandomDisplay >= 100000 ? '10만명 이상' : `${reqFandomDisplay.toLocaleString()}명 이상`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">한국지사 설립 투자비:</span>
                        <span className="font-semibold text-cyan-300">₩{(branchCost / 100000000).toFixed(0)}억원</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">지사 체력 효과:</span>
                        <span className={hasBranch ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                          {hasBranch ? '+30 체력 회복 ⚡' : '미설립 (-10 체력/멘탈)'}
                        </span>
                      </div>
                    </div>

                    {hoveredCountry.id === 'EG' && (hasBranch || routeCountryIds.includes('EG')) && (
                      <div className="text-2xl font-black text-amber-400 mt-2 pt-1 border-t border-slate-800 text-center tracking-tight bg-amber-500/10 p-1.5 rounded border border-amber-500/30">
                        명예 대표 : 임호텝
                      </div>
                    )}

                    {!hasBranch && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePurchaseBranch(hoveredCountry);
                        }}
                        className="w-full mt-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] transition flex items-center justify-center space-x-1 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>한국 지사 설립 (₩{(branchCost / 100000000).toFixed(0)}억)</span>
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Map Legend */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
              <div className="flex items-center space-x-4">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                  <span>대한민국(출발)</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                  <span>🏢 한국지사 설립국</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                  <span>흑자 가능 국가</span>
                </span>
                <span className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block"></span>
                  <span>팬클럽 부족 국가</span>
                </span>
              </div>
              <div className="text-indigo-300 font-medium">
                * 한국지사가 있는 국가 방문 시 멤버 체력이 +30 회복됩니다!
              </div>
            </div>

          </div>

          {/* Right Column: Route Planner & Cost Breakdown (4-5 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-4 flex flex-col justify-between">
            
            {/* Header & Clear */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center space-x-1.5">
                  <Compass className="w-4 h-4 text-indigo-400" />
                  <span>선택된 투어 경로 ({routeCountries.length}/8개국)</span>
                </h3>
                {routeCountries.length > 0 && (
                  <button
                    onClick={handleClearRoute}
                    className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>전체 비우기</span>
                  </button>
                )}
              </div>

              {/* Selected Country List Sequence */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                {/* Home Start */}
                <div className="bg-slate-900 border border-emerald-500/30 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                      ★
                    </span>
                    <span className="font-bold text-emerald-400">🇰🇷 대한민국 (인천공항 출발)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">시작점</span>
                </div>

                {/* Selected Stops */}
                {routeAnalysis.legs.map((leg, idx) => (
                  <div
                    key={leg.to.id}
                    className={`bg-slate-900 border p-2.5 rounded-lg flex flex-col space-y-1.5 text-xs transition ${
                      leg.isLowCondition ? 'border-rose-900/80 bg-rose-950/30' : leg.isProfitableTierMet ? 'border-slate-800' : 'border-amber-900/50 bg-amber-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-extrabold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-1">
                            <span>{leg.to.flag} {leg.to.name}</span>
                            {leg.hasBranch && (
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 py-0.2 rounded border border-emerald-500/30 font-bold">
                                🏢 지사 (+30체력)
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            항공비: ₩{leg.flightCost.toLocaleString()} (유류할증료 ₩{leg.fuelSurcharge.toLocaleString()} 포함) | 체력: {leg.avgStaminaAtStop}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-bold ${leg.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {leg.netProfit >= 0 ? '+' : ''}₩{leg.netProfit.toLocaleString()}
                        </div>
                        <button
                          onClick={() => handleRemoveStop(idx)}
                          className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    {/* Condition Warnings */}
                    {leg.isLowCondition && (
                      <div className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 p-1 rounded border border-rose-500/20 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3 shrink-0" />
                        <span>⚠️ 체력/멘탈 50 이하: 적자 위험 및 먼 거리 적자폭 증가!</span>
                      </div>
                    )}
                    {leg.isHighProfitCapped && (
                      <div className="text-[10px] text-amber-300 font-semibold bg-amber-500/10 p-1 rounded border border-amber-500/20 flex items-center space-x-1">
                        <InfoIcon className="w-3 h-3 shrink-0" />
                        <span>⚠️ 체력/멘탈 95 미만: 정산금 제한 (대한민국 거리 비례 유류할증료 반영)</span>
                      </div>
                    )}

                    {/* Egypt Tour Honorary Representative: Imhotep (displayed in 2x country name font size) */}
                    {leg.to.id === 'EG' && (
                      <div className="text-lg sm:text-xl font-black text-amber-400 bg-amber-500/15 p-2 rounded-lg border border-amber-500/40 text-center tracking-tight shadow-md">
                        명예 대표 : 임호텝
                      </div>
                    )}
                  </div>
                ))}

                {routeCountries.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-lg">
                    지도에서 국가를 클릭하여 투어 일정을 추가하세요!
                  </div>
                )}
              </div>
            </div>

            {/* Flight Cost & Profit Analysis */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="text-indigo-300 font-bold flex items-center space-x-1.5 border-b border-slate-800 pb-2">
                <Plane className="w-4 h-4 text-indigo-400" />
                <span>투어 정산 및 체력 예측</span>
              </div>

              <div className="space-y-1.5 text-slate-300 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">총 항공 이동 경비:</span>
                  <span className="font-semibold text-cyan-300">₩{routeAnalysis.totalFlightCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">거리 비례 유류할증료 합계:</span>
                  <span className="font-semibold text-amber-300">₩{routeAnalysis.totalFuelSurcharge.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">총 현지 대관/행사 비용:</span>
                  <span className="font-semibold text-slate-200">₩{routeAnalysis.totalVenueCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">투어 직후 예상 평균 체력:</span>
                  <span className={`font-bold ${routeAnalysis.finalAvgStamina <= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {routeAnalysis.finalAvgStamina}
                  </span>
                </div>

                {routeAnalysis.flightSavings > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold bg-emerald-500/10 p-1.5 rounded border border-emerald-500/20">
                    <span>💡 루트 연결 경비 절감액:</span>
                    <span>+₩{routeAnalysis.flightSavings.toLocaleString()} 절감!</span>
                  </div>
                )}

                <div className="flex justify-between pt-1.5 border-t border-slate-800 text-sm">
                  <span className="font-bold text-white">예상 총 순수익:</span>
                  <span className={`font-extrabold ${routeAnalysis.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {routeAnalysis.netProfit >= 0 ? '+' : ''}₩{routeAnalysis.netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Fandom Tier Rule Box */}
            <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-500/30 text-[11px] text-indigo-200 space-y-1">
              <div className="font-bold flex items-center space-x-1 text-indigo-300">
                <InfoIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>팬클럽 단계별 흑자 기준</span>
              </div>
              <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                • <b>5천+:</b> 영국, 독일, 프랑스, 사우디, 중국, 일본, 미국<br />
                • <b>1만+:</b> +러시아, 인도, 브라질, 캐나다, 호주, 남아공<br />
                • <b>2만+:</b> +이탈리아, 우크라이나, 아르헨티나, 노르웨이, 몽골<br />
                • <b>3만+:</b> +모로코, 이집트, 알제리, 멕시코, 폴란드, 나이지리아, 뉴질랜드<br />
                • <b>10만+:</b> 선택 가능한 모든 국가에서 흑자 가능!
              </p>
            </div>

            {/* OVERSEAS BRANCH MANAGEMENT BUTTON (Directly above World Tour Execute Button) */}
            <button
              onClick={() => {
                sound.playClick();
                setIsBranchModalOpen(true);
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-extrabold rounded-xl text-xs border border-emerald-500/40 transition flex items-center justify-center space-x-2 cursor-pointer shadow-md"
            >
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>🏢 기획사 한국 지사 설립 관리 (투자비 20억 ~ 100억)</span>
            </button>

            {/* Execute Button */}
            <button
              onClick={handleExecuteTour}
              disabled={routeCountries.length === 0 || state.money < routeAnalysis.totalExpense}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-extrabold rounded-xl text-sm transition shadow-xl shadow-indigo-600/30 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Plane className="w-5 h-5 animate-bounce" />
              <span>월드투어 시작 (총 경비 ₩{routeAnalysis.totalExpense.toLocaleString()})</span>
            </button>

          </div>

        </div>

      </div>

      {/* OVERSEAS BRANCH ESTABLISHMENT MANAGEMENT MODAL */}
      {isBranchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-extrabold text-white">
                  기획사 해외 지사 설립 관리
                </h3>
              </div>
              <button
                onClick={() => setIsBranchModalOpen(false)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-indigo-950/50 p-3 rounded-xl border border-indigo-500/30 text-xs text-indigo-200 space-y-1">
              <p>
                • 한국에서 멀리 떨어진 국가일수록 지사 설립 투자비가 증가합니다 (최저 <b>20억원</b> ~ 최고 <b>100억원</b>).
              </p>
              <p>
                • 지사가 설립된 국가를 월드투어 중 방문하면 멤버 체력이 <b>+30 회복</b>되어 더 많은 세계투어 국가를 연속 방문할 수 있습니다!
              </p>
            </div>

            {/* Country List for Branch Purchase */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {WORLD_TOUR_COUNTRIES.map((country) => {
                const hasBranch = agencyBranches.includes(country.id);
                const cost = calculateBranchCost(country);
                const canAfford = state.money >= cost;

                return (
                  <div
                    key={country.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{country.flag}</span>
                        <div>
                          <div className="font-bold text-white flex items-center space-x-2">
                            <span>{country.name}</span>
                            <span className="text-[10px] text-slate-400">({country.region})</span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            거리 기반 지사 투자비: <span className="text-cyan-300 font-semibold">₩{(cost / 100000000).toFixed(0)}억원</span>
                          </div>
                        </div>
                      </div>

                      {hasBranch ? (
                        <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold flex items-center space-x-1 text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>설립 완료 (+30 체력)</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePurchaseBranch(country)}
                          disabled={!canAfford}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-lg transition text-[11px] flex items-center space-x-1 cursor-pointer"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>지사 설립 (₩{(cost / 100000000).toFixed(0)}억)</span>
                        </button>
                      )}
                    </div>

                    {/* Egypt Branch Honorary Representative Imhotep (font size 2x country name) */}
                    {country.id === 'EG' && hasBranch && (
                      <div className="w-full mt-2 pt-2 border-t border-slate-800 text-xl sm:text-2xl font-black text-amber-400 text-center tracking-tight bg-slate-900/80 p-2 rounded-lg border border-amber-500/30 shadow-md">
                        명예 대표 : 임호텝
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsBranchModalOpen(false)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition cursor-pointer"
            >
              닫기
            </button>

          </div>
        </div>
      )}

      {/* Tour Result Celebration Modal */}
      {tourResult && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-indigo-500/80 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_50px_rgba(99,102,241,0.4)] text-white space-y-5 text-center animate-fade-in relative">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center mx-auto shadow-xl">
              <Globe className="w-8 h-8 text-white animate-spin" />
            </div>

            <div>
              <span className="text-xs text-indigo-300 font-bold bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30 uppercase tracking-widest">
                World Tour Completed
              </span>
              <h3 className="text-2xl font-extrabold text-white mt-2">
                {tourResult.groupName} {tourResult.stopsCount}개국 월드투어 완수!
              </h3>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-left">
              {routeCountryIds.includes('EG') && (
                <div className="text-xl sm:text-2xl font-black text-amber-400 p-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-center shadow-lg my-1">
                  🏛️ 명예 대표 : 임호텝
                </div>
              )}
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">총 관객 동원 수:</span>
                <span className="font-bold text-amber-300">{tourResult.totalAudience.toLocaleString()} 명</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">최고 열기 도시:</span>
                <span className="font-bold text-cyan-300">{tourResult.bestCity}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">신규 팬클럽 유입:</span>
                <span className="font-bold text-pink-400">+{tourResult.fandomGained.toLocaleString()} 명</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">현지 지사 체력 회복 지원:</span>
                <span className="font-bold text-emerald-400">{tourResult.branchesUsedCount} 개국</span>
              </div>
              <div className="flex justify-between py-1 text-sm pt-2">
                <span className="font-bold text-white">최종 순수익 정산:</span>
                <span className={`font-extrabold ${tourResult.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tourResult.netProfit >= 0 ? '+' : ''}₩{tourResult.netProfit.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setTourResult(null);
                onClose();
              }}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              투어 성공 확인 & 돌아가기
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

function InfoIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
