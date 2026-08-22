import React, { useState } from 'react';
import { Trainee } from '../types';
import { getTraineeDisplayName } from '../utils/gameEngine';
import { X, Sparkles, Palette } from 'lucide-react';
import { PaintModal } from './PaintModal';
import { isGifImage } from '../utils/imageUtils';

interface FloatingTraineeWidgetProps {
  trainee: Trainee | null;
  onClose: () => void;
  onImageUploaded: (traineeId: string, imageDataUrl: string) => void;
  onOpenTraineeTab?: () => void;
}

export const FloatingTraineeWidget: React.FC<FloatingTraineeWidgetProps> = ({
  trainee,
  onClose,
  onImageUploaded,
  onOpenTraineeTab,
}) => {
  const [showPaintModal, setShowPaintModal] = useState(false);

  if (!trainee) return null;

  const displayName = getTraineeDisplayName(trainee);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 w-[20vw] h-[24vh] min-w-[170px] min-h-[204px] max-w-[260px] max-h-[312px] bg-slate-900/65 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-2.5 shadow-2xl transition-all duration-300 hover:opacity-100 opacity-80 group flex flex-col justify-between select-none">
        
        {/* Top Bar with Name and Dismiss Button */}
        <div className="flex items-center justify-between text-xs font-bold text-white z-10 bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800/80 backdrop-blur-xs">
          <div className="flex items-center space-x-1.5 truncate">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{displayName}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-slate-400 hover:text-rose-400 p-0.5 rounded-md hover:bg-rose-500/20 transition shrink-0 ml-1"
            title="팝업 닫기 (소거)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Image Container with Breathing Animation */}
        <div
          onClick={() => setShowPaintModal(true)}
          className="relative flex-1 my-1.5 rounded-xl overflow-hidden cursor-pointer group/img flex items-center justify-center bg-slate-950/80 border border-slate-800"
          title="클릭하여 직접 그림을 그리거나(그림판) 이미지(JPG, PNG, GIF)를 삽입하세요"
        >
          {trainee.profileImage ? (
            <img
              src={trainee.profileImage}
              alt={trainee.name}
              className="w-full h-full object-cover animate-breathing"
            />
          ) : (
            <div className={`w-full h-full ${trainee.avatarBg} flex flex-col items-center justify-center animate-breathing text-white p-2 text-center`}>
              <span className="text-3xl font-black mb-1">{displayName.slice(0, 1)}</span>
              <span className="text-[10px] text-white/80 bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs">
                그림판 / 사진 편집
              </span>
            </div>
          )}

          {/* Animated GIF Badge */}
          {isGifImage(trainee.profileImage) && (
            <div className="absolute top-1 right-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-0.5 border border-white/30 animate-pulse z-10">
              <Sparkles className="w-2.5 h-2.5" />
              <span>GIF 움짤</span>
            </div>
          )}

          {/* Hover Overlay Icon */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold p-1 text-center">
            <Palette className="w-5 h-5 mb-1 text-cyan-300 animate-bounce" />
            <span>그림판 & 이미지</span>
            <span className="text-[9px] font-normal text-slate-300">(직접그리기 / 업로드)</span>
          </div>
        </div>

        {/* Footer Tag */}
        <div className="flex items-center justify-between text-[10px] text-slate-300 px-1 pt-0.5">
          <span className="text-cyan-300 font-medium">{trainee.age}세 / {trainee.status === 'DEBUTED' ? '데뷔함' : '연습생'}</span>
          {onOpenTraineeTab && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenTraineeTab();
              }}
              className="text-slate-400 hover:text-cyan-300 underline font-medium text-[9px]"
            >
              프로필 상세
            </button>
          )}
        </div>
      </div>

      {/* Paint Editor Modal */}
      {showPaintModal && (
        <PaintModal
          traineeName={trainee.name}
          initialImage={trainee.profileImage}
          onSave={(imageDataUrl) => {
            onImageUploaded(trainee.id, imageDataUrl);
            setShowPaintModal(false);
          }}
          onClose={() => setShowPaintModal(false)}
        />
      )}
    </>
  );
};
