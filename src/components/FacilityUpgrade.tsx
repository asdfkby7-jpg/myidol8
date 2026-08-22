import React from 'react';
import { Facility, GameState } from '../types';
import { sound } from '../utils/sound';
import { Award, ArrowUp, Building, Sparkles, CheckCircle2, Heart, Dumbbell, Disc, Megaphone, UserCheck, UserPlus, Briefcase } from 'lucide-react';

interface FacilityUpgradeProps {
  state: GameState;
  onUpdateFacilities: (newFacilities: Record<string, Facility>, newMoney: number) => void;
}

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  vocal: <Dumbbell className="w-6 h-6 text-cyan-400" />,
  dance: <Dumbbell className="w-6 h-6 text-pink-400" />,
  recording: <Disc className="w-6 h-6 text-purple-400" />,
  rest: <Heart className="w-6 h-6 text-rose-400" />,
  marketing: <Megaphone className="w-6 h-6 text-amber-400" />,
};

export const FacilityUpgrade: React.FC<FacilityUpgradeProps> = ({
  state,
  onUpdateFacilities,
}) => {

  const handleToggleManager = (facilityKey: string) => {
    const facility = state.facilities[facilityKey];
    if (!facility) return;

    sound.playClick();
    const newHasManager = !facility.hasManager;

    const updatedFacilities = {
      ...state.facilities,
      [facilityKey]: {
        ...facility,
        hasManager: newHasManager,
      },
    };

    onUpdateFacilities(updatedFacilities, state.money);
  };

  const handleUpgrade = (facilityKey: string) => {
    const facility = state.facilities[facilityKey];
    if (!facility) return;

    if (facility.level >= facility.maxLevel) {
      alert('이미 최고 레벨에 도달한 시설입니다!');
      return;
    }

    const cost = facility.upgradeCost * facility.level;
    if (state.money < cost) {
      alert(`시설 업그레이드 자금이 부족합니다! (필요 자금: ₩${cost.toLocaleString()})`);
      return;
    }

    sound.playCash();
    sound.playLevelUp();

    const updatedFacilities = {
      ...state.facilities,
      [facilityKey]: {
        ...facility,
        level: facility.level + 1,
      },
    };

    onUpdateFacilities(updatedFacilities, state.money - cost);
  };

  const totalFacilityUpkeep = (Object.values(state.facilities) as Facility[]).reduce((sum, f) => {
    const base = f.level <= 1 ? 0 : f.weeklyUpkeep * f.level;
    return sum + (base * (f.hasManager ? 2 : 1));
  }, 0);
  const hiredManagersCount = (Object.values(state.facilities) as Facility[]).filter(f => f.hasManager).length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-2 text-amber-400 text-xs font-semibold uppercase mb-1">
          <Award className="w-4 h-4" />
          <span>Agency Headquarters Infrastructure</span>
        </div>
        <h2 className="text-xl font-bold text-white">기획사 시설 인프라 업그레이드 & 실장 관리</h2>
        <p className="text-xs text-slate-400 mt-1">
          시설을 증축하거나 우측 상단의 <b>'관리 실장'</b>을 고용하세요. 레벨 1 기본 트레이닝비는 <b>50만원</b>이며, 기획사 시설 레벨 1 상승 시 트레이닝비가 <b>10만원씩</b> 상승합니다. 실장 고용 시 고정 유지비가 2배가 되지만 시설 보상 효율이 <b>130%~150%</b>로 대폭 증가합니다.
        </p>

        <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="text-amber-300 font-semibold flex items-center space-x-1.5">
            <Building className="w-4 h-4 text-amber-400" />
            <span>총 시설 주간 고정 유지비: <b>{totalFacilityUpkeep === 0 ? '₩0 (레벨 1 무료)' : `₩${totalFacilityUpkeep.toLocaleString()} / 주`}</b></span>
          </div>
          <div className="text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
            상주 고용 실장: <span className="font-bold">{hiredManagersCount} / 5 명</span>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(Object.entries(state.facilities) as [string, Facility][]).map(([key, f]) => {
          const upgradeCost = f.upgradeCost * f.level;
          const isMax = f.level >= f.maxLevel;
          const canAfford = state.money >= upgradeCost;
          const baseUpkeep = f.level <= 1 ? 0 : f.weeklyUpkeep * f.level;
          const effectiveUpkeep = baseUpkeep * (f.hasManager ? 2 : 1);

          return (
            <div key={key} className={`bg-slate-900 border rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between transition-all ${
              f.hasManager ? 'border-emerald-500/50 shadow-emerald-950/30' : 'border-slate-800'
            }`}>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        LV. {f.level} / {f.maxLevel}
                      </span>
                      {f.hasManager && (
                        <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center space-x-1">
                          <UserCheck className="w-3 h-3" />
                          <span>실장 상주 중</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1.5 flex items-center space-x-2">
                      <span>{f.name}</span>
                    </h3>
                  </div>

                  {/* Manager Hire/Fire Button in Top-Right */}
                  <div className="flex flex-col items-end space-y-2 shrink-0">
                    <button
                      onClick={() => handleToggleManager(key)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition flex items-center space-x-1 cursor-pointer shadow-md ${
                        f.hasManager
                          ? 'bg-emerald-600 hover:bg-rose-600 text-white border-emerald-400/50 hover:border-rose-400'
                          : 'bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border-slate-700 hover:border-indigo-500'
                      }`}
                      title={f.hasManager ? '클릭 시 관리 실장을 해고합니다.' : '관리 실장 고용 시 고정 유지비 2배, 보상 130%~150% 증대!'}
                    >
                      {f.hasManager ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>실장 고용됨 (해고)</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
                          <span>실장 고용</span>
                        </>
                      )}
                    </button>
                    <div className="p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      {FACILITY_ICONS[key] || <Building className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{f.description}</p>

                <div className="mt-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs space-y-1.5">
                  <div className="text-emerald-400 font-bold flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>기본 혜택: {f.benefitText}</span>
                  </div>

                  {f.hasManager && (
                    <div className="text-purple-300 font-bold text-[11px] flex items-center space-x-1 bg-purple-950/60 p-1.5 rounded border border-purple-800/50">
                      <Briefcase className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>실장 특수 효과: 시설 보상 130%~150% 부스트 적용 중!</span>
                    </div>
                  )}

                  <div className="text-amber-300 font-semibold text-[11px] flex items-center justify-between pt-0.5">
                    <span>주간 고정 유지비: <b>{effectiveUpkeep === 0 ? '₩0 (레벨 1 무료)' : `₩${effectiveUpkeep.toLocaleString()}`}</b> / 주</span>
                    {f.hasManager && <span className="text-rose-400 text-[10px] font-bold">(실장 2배 할증)</span>}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleUpgrade(key)}
                  disabled={isMax || !canAfford}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition shadow-lg shadow-amber-600/20 flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isMax ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>최고 레벨 도달 (MAX)</span>
                    </>
                  ) : (
                    <>
                      <ArrowUp className="w-4 h-4" />
                      <span>레벨 {f.level + 1}로 증축 (₩{upgradeCost.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
