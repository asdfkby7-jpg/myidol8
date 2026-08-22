import React from 'react';
import { Skull, AlertTriangle, RotateCcw } from 'lucide-react';
import { sound } from '../utils/sound';

interface GameOverModalProps {
  money: number;
  week: number;
  onRestart: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  money,
  week,
  onRestart,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-rose-900/80 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute -right-20 -top-20 w-56 h-56 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-950 border border-rose-800 text-rose-500 shadow-xl shadow-rose-900/40 mx-auto animate-bounce">
          <Skull className="w-8 h-8" />
        </div>

        {/* Title & Desc */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded border border-rose-500/20">
            GAME OVER
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight">
            🚨 기획사 부도 및 파산!
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
            {week}주차 운영 중 보유 자금이 적자(<span className="font-bold text-rose-400">-₩{Math.abs(money).toLocaleString()}</span>) 상태에 도달하여 연예 기획사가 경영난으로 파산하였습니다.
          </p>
        </div>

        {/* Question & Yes Button Box */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-bold text-slate-200 flex items-center justify-center space-x-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>처음부터 다시 시작하시겠습니까?</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onRestart();
            }}
            className="w-full py-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-600 hover:from-rose-500 hover:to-pink-500 text-white font-black rounded-xl text-sm shadow-xl shadow-rose-600/30 transition flex items-center justify-center space-x-2 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>Yes (다시 시작)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
