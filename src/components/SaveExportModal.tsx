import React, { useState } from 'react';
import { GameState } from '../types';
import { sound } from '../utils/sound';
import { Save, X, FileText, Database } from 'lucide-react';

interface SaveExportModalProps {
  state: GameState;
  onClose: () => void;
}

export const SaveExportModal: React.FC<SaveExportModalProps> = ({
  state,
  onClose,
}) => {
  const [saveNotice, setSaveNotice] = useState('');
  const [showDriveReport, setShowDriveReport] = useState(false);

  const handleManualSave = () => {
    sound.playClick();
    localStorage.setItem('idol_creator_savestate', JSON.stringify(state));
    setSaveNotice('✅ 브라우저 LocalStorage에 게임 데이터가 성공적으로 저장되었습니다!');
    setTimeout(() => setSaveNotice(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Database className="w-5 h-5 text-pink-500" />
            <span>게임 데이터 저장 & 관리</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            현재 진행 중인 게임 데이터를 브라우저 LocalStorage에 저장합니다.
          </p>
        </div>

        {saveNotice && (
          <div className="p-3 bg-emerald-950/80 border border-emerald-600 rounded-xl text-xs text-emerald-300">
            {saveNotice}
          </div>
        )}

        <div className="space-y-2.5">
          {/* Manual LocalStorage Save */}
          <button
            onClick={handleManualSave}
            className="w-full py-3 bg-pink-600 hover:bg-pink-500 text-white font-bold rounded-xl text-xs shadow-md shadow-pink-600/20 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>브라우저 수동 저장 (LocalStorage)</span>
          </button>

          {/* Google Drive Export Report info */}
          <button
            onClick={() => setShowDriveReport(!showDriveReport)}
            className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 border border-slate-800 font-medium rounded-xl text-xs transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>구글 드라이브(Google Drive) 기록 보고서 보기</span>
          </button>
        </div>

        {showDriveReport && (
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-300 space-y-1">
            <div className="font-bold text-amber-400">📄 Google Drive Document Log ID:</div>
            <div className="font-mono text-slate-400">idol_creator7_chat_history_log</div>
            <p className="text-slate-400 text-[10px] mt-1">
              개발 대화 세션 및 앨범 밸런스 규정 시스템 문서가 보관되었습니다.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};


