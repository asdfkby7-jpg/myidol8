import React, { useState, useEffect } from 'react';
import { ALBUM_CONCEPTS, COMPOSERS } from '../data/initialData';
import { Album, GameState, Group } from '../types';
import { calculateAlbumFailureRate, executeAlbumRelease } from '../utils/gameEngine';
import { sound } from '../utils/sound';
import { bgmPlayer } from '../utils/bgmPlayer';
import { 
  Disc, 
  Sparkles, 
  ShieldAlert, 
  AlertTriangle, 
  TrendingUp, 
  X, 
  Trophy, 
  DollarSign, 
  Users, 
  Radio 
} from 'lucide-react';

interface AlbumStudioModalProps {
  state: GameState;
  onClose: () => void;
  onAlbumReleased: (newState: GameState, isSuccess: boolean, album: Album) => void;
}

export const AlbumStudioModal: React.FC<AlbumStudioModalProps> = ({
  state,
  onClose,
  onAlbumReleased,
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>(
    state.groups[0]?.id || ''
  );
  const [albumTitle, setAlbumTitle] = useState('');
  const [selectedConcept, setSelectedConcept] = useState(ALBUM_CONCEPTS[0].id);
  const [selectedComposerId, setSelectedComposerId] = useState(COMPOSERS[0].id);
  const [mvBudget, setMvBudget] = useState(30000000); // 3천만원 default

  // Result Modal State
  const [releaseResult, setReleaseResult] = useState<{
    album: Album;
    isSuccess: boolean;
    newsContent: string;
  } | null>(null);

  // Play Creep-inspired Alternative Rock BGM when entering Album Studio, restore original on exit
  useEffect(() => {
    bgmPlayer.playAlbumStudioBgm();
    return () => {
      bgmPlayer.stopAlbumStudioBgm();
    };
  }, []);

  const activeGroup = state.groups.find(g => g.id === selectedGroupId);
  const activeComposer = COMPOSERS.find(c => c.id === selectedComposerId) || COMPOSERS[0];
  const groupTrainees = activeGroup
    ? state.trainees.filter(t => activeGroup.memberIds.includes(t.id))
    : [];

  // Calculate Real-time Failure Probability based on idols' Stamina & Mental
  const currentFailRate = calculateAlbumFailureRate(groupTrainees, activeComposer);
  
  const avgStamina = groupTrainees.length > 0
    ? Math.round(groupTrainees.reduce((a, b) => a + b.stamina, 0) / groupTrainees.length)
    : 100;
  const avgMental = groupTrainees.length > 0
    ? Math.round(groupTrainees.reduce((a, b) => a + b.mental, 0) / groupTrainees.length)
    : 100;

  const totalCost = activeComposer.cost + mvBudget;

  const handleRelease = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeGroup) {
      alert('앨범을 발매할 데뷔 그룹을 먼저 결성해야 합니다!');
      return;
    }
    if (!albumTitle.trim()) {
      alert('타이틀곡명을 입력해주세요!');
      return;
    }
    if (state.money < totalCost) {
      alert(`제작 자금이 부족합니다! (필요 자금: ₩${totalCost.toLocaleString()})`);
      return;
    }

    const { updatedState, newAlbum, isSuccess, newsReport } = executeAlbumRelease(state, {
      group: activeGroup,
      title: albumTitle.trim(),
      conceptId: selectedConcept,
      composer: activeComposer,
      mvBudget,
      participatingTraineeIds: activeGroup.memberIds,
    });

    if (isSuccess) {
      sound.playSuccessFanfare();
    } else {
      sound.playFailure();
    }

    setReleaseResult({
      album: newAlbum,
      isSuccess,
      newsContent: newsReport.content,
    });

    onAlbumReleased(updatedState, isSuccess, newAlbum);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden space-y-5 my-auto max-h-[92vh] overflow-y-auto scrollbar-thin">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center space-x-2 text-pink-400 text-xs font-semibold uppercase mb-1">
            <Disc className="w-4 h-4 animate-spin-slow" />
            <span>K-Pop Album Studio</span>
          </div>
          <h2 className="text-xl font-bold text-white">신규 앨범 제작 스튜디오</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            컨셉과 작곡가를 섭외하고 제작 예산을 투입하여 신보 음반을 발매하세요.
          </p>
        </div>

        {/* Form or Result View */}
        {!releaseResult ? (
          <form onSubmit={handleRelease} className="space-y-4">
            
            {/* 1. Group Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">활동 아티스트 / 그룹 선택</label>
              {state.groups.length === 0 ? (
                <div className="p-3 bg-rose-950/40 border border-rose-800 rounded-xl text-xs text-rose-300">
                  ⚠️ 아직 데뷔한 그룹이 없습니다. 먼저 [그룹 & 데뷔] 탭에서 그룹을 결성해주세요!
                </div>
              ) : (
                <select
                  value={selectedGroupId}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  {state.groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.concept} 컨셉)</option>
                  ))}
                </select>
              )}
            </div>

            {/* 2. Title Song Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">앨범 타이틀곡 제목</label>
              <input
                type="text"
                value={albumTitle}
                onChange={e => setAlbumTitle(e.target.value)}
                placeholder="예: Supernova, Hype Boy, Like Jennie, Dynamite"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500"
                required
              />
            </div>

            {/* 3. Concept & Composer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">앨범 콘셉트</label>
                <select
                  value={selectedConcept}
                  onChange={e => setSelectedConcept(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  {ALBUM_CONCEPTS.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">작곡가 / 프로듀서 섭외</label>
                <select
                  value={selectedComposerId}
                  onChange={e => setSelectedComposerId(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-pink-500"
                >
                  {COMPOSERS.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (₩{(c.cost / 10000).toLocaleString()}만 / {c.style})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. MV Budget Slider */}
            <div className="space-y-2 bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-300">뮤직비디오 / 홍보 예산</span>
                <span className="font-bold text-pink-400">₩{mvBudget.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={10000000}
                max={200000000}
                step={5000000}
                value={mvBudget}
                onChange={e => setMvBudget(Number(e.target.value))}
                className="w-full accent-pink-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>₩10,000,000 (최소)</span>
                <span>₩200,000,000 (대형 블록버스터)</span>
              </div>
            </div>

            {/* CRITICAL RISK ASSESSMENT BOX (STRICT BALANCE RULES APPLIED) */}
            <div className={`p-4 rounded-2xl border text-xs space-y-2 transition ${
              currentFailRate >= 90
                ? 'bg-rose-950/80 border-rose-600 text-rose-200'
                : currentFailRate >= 50
                ? 'bg-amber-950/80 border-amber-600 text-amber-200'
                : 'bg-blue-950/80 border-blue-600 text-blue-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  <span className="text-sm">제작 위험성 평가 (실패 확률: {currentFailRate}%)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-black/40 font-mono text-xs">
                  평균 체력: {avgStamina} | 멘탈: {avgMental}
                </span>
              </div>

              <div className="text-[11px] leading-relaxed space-y-1">
                {currentFailRate >= 90 ? (
                  <p className="text-rose-300 font-semibold">
                    ⚠️ 경고: 멤버 평균 체력/멘탈이 80 이하입니다! <span className="underline">제작 실패 확률 90% 이상</span>이 적용되며, 실패 시 아이돌 멘탈 -30, 인기 -10~30, 팬클럽 -10% 감축 페널티가 부여됩니다. [연습생 관리]에서 휴식을 취하세요!
                  </p>
                ) : currentFailRate >= 50 ? (
                  <p className="text-amber-300 font-semibold">
                    ⚠️ 멤버 평균 체력/멘탈이 90 이하입니다. <span className="underline">최소 실패 확률 50% 이상</span>이 적용됩니다.
                  </p>
                ) : (
                  <p className="text-blue-300 font-semibold">
                    💡 최고 컨디션(100/100)이어도 K-Pop 대중음악 시장 변수로 인해 <span className="underline">기본 실패 확률 40%</span>가 적용됩니다.
                  </p>
                )}
              </div>
            </div>

            {/* Total Investment Summary */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium">총 제작 투자금액:</span>
              <span className="font-extrabold text-emerald-400 text-sm">₩{totalCost.toLocaleString()}</span>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={!activeGroup}
                className="px-6 py-2.5 bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-pink-600/30 transition transform active:scale-95 disabled:opacity-50"
              >
                신보 앨범 발매 시작!
              </button>
            </div>

          </form>
        ) : (
          /* RESULT MODAL DISPLAY */
          <div className="space-y-5 text-slate-100 animate-fade-in">
            <div className={`p-5 rounded-2xl border text-center space-y-3 ${
              releaseResult.isSuccess
                ? 'bg-emerald-950/80 border-emerald-600'
                : 'bg-rose-950/80 border-rose-600'
            }`}>
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-black/40 text-3xl">
                {releaseResult.isSuccess ? '🏆' : '💥'}
              </div>
              <h3 className="text-xl font-extrabold">
                {releaseResult.isSuccess ? '🎉 앨범 발매 흥행 성공!' : '⚠️ 앨범 흥행 실패 & 무산'}
              </h3>
              <p className="text-xs leading-relaxed max-w-md mx-auto">
                {releaseResult.newsContent}
              </p>
            </div>

            {/* Details Table */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400">빌보드/멜롬 차트:</span>
                <div className="font-bold text-cyan-300 text-sm">{releaseResult.album.chartRank} 위</div>
              </div>
              <div>
                <span className="text-slate-400">초동 음반 판매량:</span>
                <div className="font-bold text-pink-300 text-sm">
                  {releaseResult.album.salesCount.toLocaleString()} 장
                </div>
              </div>
              <div>
                <span className="text-slate-400">정산 수익금:</span>
                <div className="font-bold text-emerald-300 text-sm">
                  ₩{releaseResult.album.settlementAmount.toLocaleString()}
                </div>
              </div>
              <div>
                <span className="text-slate-400">공식 팬클럽 변동:</span>
                <div className={`font-bold text-sm ${releaseResult.isSuccess ? 'text-pink-400' : 'text-rose-400'}`}>
                  {releaseResult.isSuccess ? `+${releaseResult.album.fandomGained} 명` : '-10% 감축'}
                </div>
              </div>
            </div>

            {/* Critic Review Box */}
            <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-xs">
              <span className="font-bold text-pink-400 block mb-1">🎵 평론가 리포트:</span>
              <p className="text-slate-300 italic">{releaseResult.album.criticReview}</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-pink-600/30 transition"
            >
              확인 및 스튜디오 닫기
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
