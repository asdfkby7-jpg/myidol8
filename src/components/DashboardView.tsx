import React from 'react';
import { ActiveTab, Facility, GameState } from '../types';
import { 
  Users, 
  Disc, 
  TrendingUp, 
  AlertCircle, 
  Sparkles, 
  Building, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  Radio,
  Tv
} from 'lucide-react';
import { sound } from '../utils/sound';

interface DashboardViewProps {
  state: GameState;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAlbumModal: () => void;
  onNextWeek: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  setActiveTab,
  onOpenAlbumModal,
  onNextWeek,
}) => {
  const successAlbums = state.albums.filter(a => a.isSuccess).length;
  const failedAlbums = state.albums.filter(a => !a.isSuccess).length;
  
  // Calculate total weekly expenses: Trainee upkeep + Facility fixed costs
  const currentTraineeUpkeep = state.trainees.reduce((sum, t) => sum + (t.upkeep || 0), 0);
  const currentFacilityUpkeep = (Object.values(state.facilities) as Facility[]).reduce((sum, f) => {
    const base = f.level <= 1 ? 0 : f.weeklyUpkeep * f.level;
    return sum + (base * (f.hasManager ? 2 : 1));
  }, 0);
  const estimatedWeeklyExpense = currentTraineeUpkeep + currentFacilityUpkeep;
  const displayWeeklyExpense = state.weeklyExpense > 0 ? state.weeklyExpense : estimatedWeeklyExpense;

  // Calculate average condition of all trainees to warn manager
  const avgStamina = state.trainees.length > 0
    ? Math.round(state.trainees.reduce((a, b) => a + b.stamina, 0) / state.trainees.length)
    : 100;
  const avgMental = state.trainees.length > 0
    ? Math.round(state.trainees.reduce((a, b) => a + b.mental, 0) / state.trainees.length)
    : 100;

  return (
    <div className="space-[#111827] text-slate-100 space-y-6">
      
      {/* Welcome & Balance Notice Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-pink-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>기획사 총괄 경영 센터</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {state.companyName} 경영 현황
            </h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              원석 같은 연습생을 발굴하고, 혹독한 트레이닝과 신중한 앨범 기획으로 글로벌 아티스트로 키워내세요.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                sound.playClick();
                onOpenAlbumModal();
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-600/30 transition flex items-center space-x-2"
            >
              <Disc className="w-4 h-4" />
              <span>신규 앨범 제작 스튜디오</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('TRAINEE');
              }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center space-x-2"
            >
              <Users className="w-4 h-4 text-pink-400" />
              <span>연습생 트레이닝</span>
            </button>
          </div>
        </div>
      </div>

      {/* Critical Condition Warning Alert */}
      {(avgStamina <= 80 || avgMental <= 80) && (
        <div className="bg-rose-950/60 border border-rose-800/80 rounded-xl p-4 flex items-start space-x-3 text-rose-200 animate-pulse">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm text-rose-300">⚠️ 멤버 체력/멘탈 경고 (앨범 제작 실패 확률 90% 이상 위험!)</div>
            <p>
              현재 소속 연습생/아이돌의 평균 체력({avgStamina}) 또는 멘탈({avgMental})이 80 이하로 저하되었습니다. 
              이 상태에서 앨범 제작 시 <span className="font-extrabold text-amber-300">최소 90%의 제작 실패 확률</span>이 적용되며, 
              실패 시 <span className="underline">아이돌 멘탈 -30, 인기 -10~30, 팬클럽 -10% 감축 페널티</span>를 받게 됩니다! [연습생 관리]에서 주간 휴식을 취하게 하세요.
            </p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Trainees */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium">소속 연습생</span>
            <div className="text-2xl font-bold text-white mt-1">{state.trainees.length} 명</div>
            <span className="text-[10px] text-cyan-400">보유 유망주</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-cyan-400" />
          </div>
        </div>

        {/* Debut Groups */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium">데뷔 아티스트/그룹</span>
            <div className="text-2xl font-bold text-white mt-1">{state.groups.length} 팀</div>
            <span className="text-[10px] text-purple-400">활동 중인 아티스트</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
        </div>

        {/* Released Albums */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium">발매 앨범 수</span>
            <div className="text-2xl font-bold text-white mt-1">{state.albums.length} 개</div>
            <div className="text-[10px] text-emerald-400">
              성공: {successAlbums} / <span className="text-rose-400">실패: {failedAlbums}</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
            <Disc className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        {/* Weekly Cashflow */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs text-slate-400 font-medium">주간 주급/지출</span>
            <div className="text-lg font-bold text-rose-400 mt-1">
              -₩{displayWeeklyExpense.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              연습생 주급+시설비
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-rose-400" />
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* News & Billboard Feed (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Radio className="w-5 h-5 text-pink-500 animate-pulse" />
                <h3 className="font-bold text-white text-base">기획사 실시간 뉴스 & 브리핑</h3>
              </div>
              <button
                onClick={() => setActiveTab('CHARTS')}
                className="text-xs text-pink-400 hover:text-pink-300 font-semibold flex items-center space-x-1"
              >
                <span>음원 차트 보기</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-700">
              {state.newsList.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">소식이 없습니다.</p>
              ) : (
                state.newsList.map(news => (
                  <div
                    key={news.id}
                    className={`p-3.5 rounded-xl border text-xs transition ${
                      news.isNegative
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-100">{news.title}</span>
                      <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        {news.week}주차
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{news.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Roster & Shortcuts Side Panel (1 col) */}
        <div className="space-y-6">
          
          {/* Quick Trainees Roster Widget */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-sm flex items-center space-x-2">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>주요 연습생 대표 컨디션</span>
              </h3>
              <button
                onClick={() => setActiveTab('TRAINEE')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                전체 관리 →
              </button>
            </div>

            <div className="space-y-2.5">
              {state.trainees.slice(0, 4).map(t => (
                <div key={t.id} className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{t.name}</div>
                    <div className="text-[10px] text-slate-400">주급 ₩{t.upkeep.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className={`px-2 py-0.5 rounded font-semibold ${t.stamina <= 80 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300'}`}>
                      체력 {t.stamina}
                    </span>
                    <span className={`px-2 py-0.5 rounded font-semibold ${t.mental <= 80 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-purple-500/20 text-purple-300'}`}>
                      멘탈 {t.mental}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Schedule/Concert Shortcut */}
          <div className="bg-gradient-to-br from-slate-900 to-pink-950/40 border border-pink-900/40 rounded-2xl p-5 shadow-xl space-y-3">
            <div className="flex items-center space-x-2 text-pink-400 font-bold text-sm">
              <Tv className="w-4 h-4" />
              <span>콘서트 & 방송 스케줄 개최</span>
            </div>
            <p className="text-xs text-slate-300">
              팬미팅부터 대형 아레나, 체조경기장 콘서트를 개최하고 음악방송 출연으로 팬덤을 확대하세요.
            </p>
            <button
              onClick={() => {
                sound.playClick();
                setActiveTab('CONCERT');
              }}
              className="w-full py-2 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs transition shadow-md shadow-pink-600/30"
            >
              스케줄 잡기 →
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
