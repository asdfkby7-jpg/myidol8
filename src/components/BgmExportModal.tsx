import React, { useState } from 'react';
import { Download, Music, X, Disc, Loader2, Check } from 'lucide-react';
import { bgmPlayer } from '../utils/bgmPlayer';

interface BgmExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BgmExportModal: React.FC<BgmExportModalProps> = ({ isOpen, onClose }) => {
  const [exportingPhase, setExportingPhase] = useState<'all' | 0 | 1 | 2 | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async (phaseOption: 'all' | 0 | 1 | 2, title: string) => {
    try {
      setExportingPhase(phaseOption);
      setCompletedMessage(null);

      // Brief delay to allow UI state to update
      await new Promise((res) => setTimeout(res, 120));

      await bgmPlayer.exportBgmAsAudioFile(phaseOption);

      setCompletedMessage(`"${title}" 음원 파일 추출이 완료되었습니다! (다운로드 폴더 확인)`);
    } catch (e) {
      console.error('BGM export failed:', e);
      alert('음원 추출 중 오류가 발생했습니다.');
    } finally {
      setExportingPhase(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400">
            <Disc className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              BGM 음원 추출 & MP3/WAV 다운로드
            </h3>
            <p className="text-xs text-slate-400">
              게임 내 클래시컬 K-POP BGM 합성 음원을 오디오 파일(.wav / .mp3)로 추출하여 저장합니다.
            </p>
          </div>
        </div>

        {completedMessage && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-2 text-emerald-400 text-xs">
            <Check className="w-4 h-4 shrink-0" />
            <span>{completedMessage}</span>
          </div>
        )}

        <div className="space-y-3">
          {/* Option 1: Full 40s track (last 1/3 section omitted) */}
          <button
            onClick={() => handleExport('all', '40초 통합 풀버전 BGM')}
            disabled={exportingPhase !== null}
            className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-800 hover:from-amber-500/20 hover:to-slate-700 border border-amber-500/30 transition group flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-amber-300 text-sm flex items-center space-x-2">
                <Music className="w-4 h-4 text-amber-400" />
                <span>🎵 [추천] 40초 통합 풀버전 MP3/WAV</span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                1단계(피아노+바이올린) ➔ 2단계(+일렉기타) 40초 완곡 (마지막 3/1 구간 생략)
              </p>
            </div>
            {exportingPhase === 'all' ? (
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            ) : (
              <Download className="w-5 h-5 text-amber-400 group-hover:scale-110 transition shrink-0" />
            )}
          </button>

          {/* Option 2: Phase 1 */}
          <button
            onClick={() => handleExport(0, '1단계 피아노 & 바이올린 루프')}
            disabled={exportingPhase !== null}
            className="w-full text-left p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition group flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                <span>🎻 1단계 루프 (20초) - 피아노 & 바이올린</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                우아하고 서정적인 피아노 멜로디와 바이올린 카운터 레가토
              </p>
            </div>
            {exportingPhase === 0 ? (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition shrink-0" />
            )}
          </button>

          {/* Option 3: Phase 2 */}
          <button
            onClick={() => handleExport(1, '2단계 일렉기타 서포트 루프')}
            disabled={exportingPhase !== null}
            className="w-full text-left p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition group flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                <span>🎸 2단계 루프 (20초) - 피아노 + 바이올린 + 일렉기타</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                부드럽고 리드미컬하게 더해진 일렉기타 분산 아르페지오 반주
              </p>
            </div>
            {exportingPhase === 1 ? (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition shrink-0" />
            )}
          </button>

          {/* Option 4: Phase 3 */}
          <button
            onClick={() => handleExport(2, '3단계 비장한 드럼 & 심벌 루프')}
            disabled={exportingPhase !== null}
            className="w-full text-left p-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 transition group flex items-center justify-between cursor-pointer"
          >
            <div>
              <div className="font-bold text-slate-200 text-xs flex items-center space-x-2">
                <span>🥁 3단계 루프 (20초) - 피아노 + 바이올린 + 일렉기타 + 비장한 드럼 & Crash 심벌</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                확 트인 강렬한 킥/스네어, 8비트 하이햇, 클라이맥스 웅장한 크래시 심벌
              </p>
            </div>
            {exportingPhase === 2 ? (
              <Loader2 className="w-4 h-4 text-slate-300 animate-spin shrink-0" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-400 transition shrink-0" />
            )}
          </button>
        </div>

        <div className="mt-5 text-[11px] text-slate-500 text-center">
          * Web Audio API 렌더링으로 손실 없는 고품질 오디오 파일로 즉시 렌더링 및 다운로드됩니다.
        </div>
      </div>
    </div>
  );
};
