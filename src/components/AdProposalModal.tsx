import React, { useState, useEffect } from 'react';
import { Trainee, GameState } from '../types';
import { getTraineeDisplayName } from '../utils/gameEngine';
import { getTraineeChartRank, getChartRankBonusMultiplier, getChartAuraClasses } from '../utils/chartUtils';
import { bgmPlayer } from '../utils/bgmPlayer';
import { sound } from '../utils/sound';
import { Tv, Newspaper, Globe, Sparkles, ChevronRight, XCircle, AlertCircle, Award } from 'lucide-react';

interface AdProposalModalProps {
  week: number;
  trainees: Trainee[];
  state?: GameState;
  onAcceptAd: (
    trainee: Trainee,
    rewardMoney: number,
    rewardFans: number,
    adTitle: string,
    staminaLoss: number,
    mentalLoss: number,
    extraReward: number
  ) => void;
  onRejectAd: () => void;
}

export const AdProposalModal: React.FC<AdProposalModalProps> = ({
  week,
  trainees,
  state,
  onAcceptAd,
  onRejectAd,
}) => {
  const [pageIndex, setPageIndex] = useState(0);

  // Determine Ad Type based on 3-week rotation
  // Cycle: 1 = week 3 (Magazine), 2 = week 6 (Internet), 3 = week 9 (TV)
  const cycleIndex = (Math.floor(week / 3) - 1) % 3;
  const adTypes = [
    {
      type: '잡지광고 모델',
      icon: Newspaper,
      badgeColor: 'from-amber-500 to-orange-600',
      description: '트렌디한 패션 매거진 표지 모델 제안',
      baseRewardMoney: 1000000,
      maxExtraReward: 1000000,
      staminaLossRange: '10~20',
      mentalLossRange: '10~20',
      staminaMinLoss: 10,
      staminaMaxLoss: 20,
      mentalMinLoss: 10,
      mentalMaxLoss: 20,
      rewardFans: 1000,
    },
    {
      type: '인터넷광고 모델',
      icon: Globe,
      badgeColor: 'from-blue-500 to-indigo-600',
      description: '글로벌 온라인 커머스 메인 브랜딩 광고 모델 제안',
      baseRewardMoney: 3000000,
      maxExtraReward: 3000000,
      staminaLossRange: '20~30',
      mentalLossRange: '20~30',
      staminaMinLoss: 20,
      staminaMaxLoss: 30,
      mentalMinLoss: 20,
      mentalMaxLoss: 30,
      rewardFans: 2500,
    },
    {
      type: 'TV광고 모델',
      icon: Tv,
      badgeColor: 'from-purple-500 to-pink-600',
      description: '지상파 및 종합편성 채널 메인 CF TV광고 모델 제안',
      baseRewardMoney: 6000000,
      maxExtraReward: 6000000,
      staminaLossRange: '30~40',
      mentalLossRange: '30~40',
      staminaMinLoss: 30,
      staminaMaxLoss: 40,
      mentalMinLoss: 30,
      mentalMaxLoss: 40,
      rewardFans: 5000,
    },
  ];

  const currentAdType = adTypes[cycleIndex >= 0 ? cycleIndex : 0];
  const AdIcon = currentAdType.icon;

  // Start Ad BGM when Modal mounts & restore when unmounts
  useEffect(() => {
    bgmPlayer.playAdBgmEffect();
    return () => {
      bgmPlayer.stopAdBgmEffect();
    };
  }, []);

  // Recommendation Ranking Algorithm:
  // Score = (Total Stats * 0.5) + Visual
  // Priority rule: Stamina <= 80 OR Mental <= 80 pushed to lower priority group
  const calculateScore = (t: Trainee) => {
    const totalStats = t.vocal + t.dance + t.charisma + t.visual;
    return totalStats * 0.5 + t.visual;
  };

  const highPriorityList: { trainee: Trainee; score: number; isPenalized: boolean }[] = [];
  const lowPriorityList: { trainee: Trainee; score: number; isPenalized: boolean }[] = [];

  trainees.forEach((t) => {
    const score = calculateScore(t);
    const isPenalized = t.stamina <= 80 || t.mental <= 80;
    if (isPenalized) {
      lowPriorityList.push({ trainee: t, score, isPenalized: true });
    } else {
      highPriorityList.push({ trainee: t, score, isPenalized: false });
    }
  });

  highPriorityList.sort((a, b) => b.score - a.score);
  lowPriorityList.sort((a, b) => b.score - a.score);

  const sortedCandidates = [...highPriorityList, ...lowPriorityList];

  // Pagination for candidates (2 at a time)
  const totalCandidates = sortedCandidates.length;
  const maxPages = Math.max(1, Math.ceil(totalCandidates / 2));
  const currentPage = pageIndex % maxPages;
  const currentPair = sortedCandidates.slice(currentPage * 2, currentPage * 2 + 2);

  const handleNextPair = () => {
    sound.playClick();
    setPageIndex((prev) => (prev + 1) % maxPages);
  };

  const handleSelectCandidate = (item: { trainee: Trainee; score: number }) => {
    sound.playCash();
    const totalStats = item.trainee.vocal + item.trainee.dance + item.trainee.charisma + item.trainee.visual;
    // Total stats ratio out of max 400
    const ratio = Math.min(1, totalStats / 400);
    const extraReward = Math.floor(ratio * currentAdType.maxExtraReward);
    let baseAndExtraMoney = currentAdType.baseRewardMoney + extraReward;

    // Apply top 8 chart rank bonus if state is available
    let chartBonusAmount = 0;
    if (state) {
      const chartRank = getTraineeChartRank(item.trainee, state);
      const chartBonusRatio = getChartRankBonusMultiplier(chartRank);
      if (chartBonusRatio > 0) {
        chartBonusAmount = Math.floor(baseAndExtraMoney * chartBonusRatio);
      }
    }
    const finalMoney = baseAndExtraMoney + chartBonusAmount;

    const staminaLoss = Math.floor(Math.random() * (currentAdType.staminaMaxLoss - currentAdType.staminaMinLoss + 1)) + currentAdType.staminaMinLoss;
    const mentalLoss = Math.floor(Math.random() * (currentAdType.mentalMaxLoss - currentAdType.mentalMinLoss + 1)) + currentAdType.mentalMinLoss;

    onAcceptAd(
      item.trainee,
      finalMoney,
      currentAdType.rewardFans,
      currentAdType.type,
      staminaLoss,
      mentalLoss,
      extraReward + chartBonusAmount
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-amber-500/70 rounded-2xl max-w-2xl w-full p-6 text-slate-100 shadow-[0_0_50px_rgba(245,158,11,0.3)] relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Decorative Top Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br ${currentAdType.badgeColor} text-white shadow-lg`}>
              <AdIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/50">
                  {week}주차 광고 스카우트
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">{currentAdType.type} 러브콜 팝업</h2>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">기본 계약금</span>
            <div className="text-lg font-black text-emerald-400">
              +₩{currentAdType.baseRewardMoney.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Modal Description */}
        <div className="my-3 text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {currentAdType.description} (기본 ₩{(currentAdType.baseRewardMoney/10000).toLocaleString()}만 + 능력치 보너스 최대 ₩{(currentAdType.maxExtraReward/10000).toLocaleString()}만 / 체력·멘탈 -{currentAdType.staminaLossRange})
            </span>
          </p>
          <span className="text-amber-400 font-bold shrink-0">팬 +{currentAdType.rewardFans.toLocaleString()}명</span>
        </div>

        {/* Candidate Cards Grid (2 Persons) */}
        <div className="my-2 grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[50vh] pr-1">
          {currentPair.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-400 text-sm">
              추천 가능한 연습생이 없습니다.
            </div>
          ) : (
            currentPair.map(({ trainee, score, isPenalized }, idx) => {
              const displayName = getTraineeDisplayName(trainee);
              const totalStats = trainee.vocal + trainee.dance + trainee.charisma + trainee.visual;

              return (
                <div
                  key={trainee.id}
                  className={`relative rounded-xl border p-4 bg-slate-950/80 transition-all duration-300 hover:border-amber-400 flex flex-col justify-between ${
                    isPenalized
                      ? 'border-slate-800 opacity-80'
                      : 'border-amber-500/40 shadow-lg shadow-amber-950/20'
                  }`}
                >
                  {/* Penalized Notice Badge */}
                  {isPenalized && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 bg-red-950/90 text-red-400 border border-red-800 rounded text-[10px] font-bold">
                      <AlertCircle className="w-3 h-3" />
                      <span>체력/멘탈 80이하 (후순위)</span>
                    </div>
                  )}

                  {!isPenalized && (
                    <div className="absolute top-2 right-2 flex items-center space-x-1 px-2 py-0.5 bg-amber-950/90 text-amber-300 border border-amber-700/80 rounded text-[10px] font-bold">
                      <Award className="w-3 h-3 text-amber-400" />
                      <span>추천 순위 #{currentPage * 2 + idx + 1}</span>
                    </div>
                  )}

                  {/* Top Info */}
                  {(() => {
                    const chartRank = state ? getTraineeChartRank(trainee, state) : null;
                    const chartBonusRatio = getChartRankBonusMultiplier(chartRank);
                    const auraClasses = getChartAuraClasses(chartRank);
                    const baseAndExtra = currentAdType.baseRewardMoney + Math.floor(Math.min(1, totalStats/400) * currentAdType.maxExtraReward);
                    const chartBonusAmount = chartBonusRatio > 0 ? Math.floor(baseAndExtra * chartBonusRatio) : 0;
                    const totalExpectedMoney = baseAndExtra + chartBonusAmount;

                    return (
                      <>
                        <div className="flex items-center space-x-3 mt-4 sm:mt-2">
                          <div className={`relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 shrink-0 shadow-md ${auraClasses}`}>
                            <img
                              src={trainee.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}
                              alt={trainee.name}
                              className="w-full h-full object-cover"
                            />
                            {chartRank !== null && (
                              <span className="absolute top-0 right-0 bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded-bl shadow">
                                👑{chartRank}위
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="text-base font-bold text-white">{displayName}</h3>
                              {chartRank !== null && (
                                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                                  👑 차트 {chartRank}위 (+{Math.round(chartBonusRatio * 100)}%)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-amber-300 font-semibold mt-0.5">
                              비주얼: <span className="text-white font-extrabold">{trainee.visual}</span> / 100
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              총 능력치: {totalStats} (점수: {Math.round(score)})
                            </div>
                          </div>
                        </div>

                        {/* Stat Meters */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                          <div>
                            <span className="text-slate-400">체력: </span>
                            <span className={trainee.stamina <= 80 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {trainee.stamina}/100
                            </span>
                            <span className="text-rose-400 text-[10px] ml-1">(-{currentAdType.staminaLossRange})</span>
                          </div>
                          <div>
                            <span className="text-slate-400">멘탈: </span>
                            <span className={trainee.mental <= 80 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                              {trainee.mental}/100
                            </span>
                            <span className="text-rose-400 text-[10px] ml-1">(-{currentAdType.mentalLossRange})</span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-800 flex justify-between text-[11px]">
                            <span className="text-slate-400">예상 계약금:</span>
                            <span className="text-amber-300 font-bold">
                              ₩{totalExpectedMoney.toLocaleString()}
                              <span className="text-[10px] text-slate-400 font-normal ml-1">
                                (기본+능력치 ₩{baseAndExtra.toLocaleString()}{chartBonusAmount > 0 ? ` + 차트보너스 ₩${chartBonusAmount.toLocaleString()}` : ''})
                              </span>
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Accept Button for Candidate */}
                  <button
                    onClick={() => handleSelectCandidate({ trainee, score })}
                    className="mt-3 w-full py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black rounded-lg text-xs transition shadow-md flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>{displayName} 모델 선택</span>
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Action Controls & Rejection */}
        <div className="mt-4 pt-3 border-t border-slate-800 space-y-2">
          {/* Next Candidates Button */}
          {maxPages > 1 && (
            <button
              onClick={handleNextPair}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <span>다음 추천 모델 ({currentPage + 1}/{maxPages})</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Reject Ad Button at the bottom */}
          <button
            onClick={onRejectAd}
            className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/80 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            <span>광고 거절</span>
          </button>
        </div>
      </div>
    </div>
  );
};
