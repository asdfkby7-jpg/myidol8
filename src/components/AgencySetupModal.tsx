import React, { useState } from 'react';
import { Building, Sparkles, User, Check, X } from 'lucide-react';
import { sound } from '../utils/sound';

interface AgencySetupModalProps {
  initialCompanyName?: string;
  initialRepName?: string;
  isEditMode?: boolean;
  onSubmit: (companyName: string, repName: string) => void;
  onClose?: () => void;
}

export const AgencySetupModal: React.FC<AgencySetupModalProps> = ({
  initialCompanyName = '',
  initialRepName = '대표 프로듀서',
  isEditMode = false,
  onSubmit,
  onClose,
}) => {
  const [companyName, setCompanyName] = useState(initialCompanyName || '하이브리드 엔터테인먼트');
  const [repName, setRepName] = useState(initialRepName || '대표 프로듀서');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('기획사 이름을 입력해주세요!');
      return;
    }
    sound.playLevelUp();
    onSubmit(companyName.trim(), repName.trim() || '대표 프로듀서');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow effect */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close button if edit mode */}
        {isEditMode && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-600/30 mb-1">
            <Building className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {isEditMode ? '기획사 이름 변경' : '기획사 설립 & 시작'}
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {isEditMode
              ? '기획사의 새로운 명칭과 대표 프로듀서 성함을 입력하세요.'
              : '나만의 연예 기획사를 설립하고 3,000만원의 자금으로 글로벌 K-Pop 아이돌을 육성하세요!'}
          </p>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Agency Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <Building className="w-3.5 h-3.5 text-pink-400" />
              <span>기획사 이름</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="예: 스타쉽 엔터테인먼트, 하이브리드 엔터"
              className="w-full bg-slate-950 border border-slate-700 focus:border-pink-500 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              maxLength={20}
              required
              autoFocus
            />
          </div>

          {/* Rep Producer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>대표 프로듀서 성함</span>
            </label>
            <input
              type="text"
              value={repName}
              onChange={e => setRepName(e.target.value)}
              placeholder="예: 총괄 대표, 프로듀서 K"
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-3 text-sm text-white placeholder-slate-500 focus:outline-none transition shadow-inner"
              maxLength={15}
            />
          </div>

          {!isEditMode && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
              <div className="text-pink-400 font-bold flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>초기 경영 조건</span>
              </div>
              <div>• 초기 보유 자금: <span className="font-bold text-emerald-400">₩30,000,000 (3,000만원)</span></div>
              <div>• 소속 연습생: <span className="font-bold text-slate-300">0명 (스카우트 필요)</span></div>
              <div>• 자금 적자 발생 시: <span className="font-bold text-rose-400">즉시 게임 오버 (파산)</span></div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm shadow-xl shadow-pink-600/30 transition flex items-center justify-center space-x-2 active:scale-95"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isEditMode ? '이름 변경 저장' : '기획사 설립 완료 (게임 시작)'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
