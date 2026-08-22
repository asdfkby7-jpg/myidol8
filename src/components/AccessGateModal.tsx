import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { ShieldAlert, LogIn, LogOut, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { loginWithGoogle, logoutFirebase } from '../lib/firebase';
import { sound } from '../utils/sound';

interface AccessGateModalProps {
  user: User | null;
  isAuthorized: boolean;
  isLoading: boolean;
  onRefreshAuth: () => void;
}

export const AccessGateModal: React.FC<AccessGateModalProps> = ({
  user,
  isAuthorized,
  isLoading,
  onRefreshAuth,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    try {
      sound.playClick();
      setIsSubmitting(true);
      await loginWithGoogle();
      onRefreshAuth();
    } catch (err) {
      console.error('Login error:', err);
      alert('Google 로그인 인증 처리 중 오류가 발생하였습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    sound.playClick();
    await logoutFirebase();
    onRefreshAuth();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-pink-500 animate-spin" />
          <p className="text-sm font-bold text-slate-300">보안 접속 권한 검증 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl relative space-y-6 text-slate-100">
        
        {/* Top Header Banner */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-pink-600 to-purple-700 rounded-2xl shadow-lg shadow-pink-600/30">
              <KeyRound className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>보안 접속 권한 게이트</span>
              </h2>
              <p className="text-xs text-slate-400">Google 계정 로그인 승인 시스템</p>
            </div>
          </div>
        </div>

        {/* Case 1: Not Logged In */}
        {!user && (
          <div className="space-y-5 text-center py-4">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto border border-slate-700">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white">Google 로그인 필요</h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                구글 AI 스튜디오 및 Google 로그인 계정 이메일로<br />
                인증을 완료하면 앱에 바로 접속하실 수 있습니다.
              </p>
            </div>

            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl shadow-lg shadow-pink-600/25 transition duration-200 flex items-center justify-center space-x-2 text-sm cursor-pointer disabled:opacity-50"
            >
              <LogIn className="w-5 h-5" />
              <span>Google 계정으로 로그인</span>
            </button>
          </div>
        )}

        {/* Case 2: Logged In but Unauthorized */}
        {user && !isAuthorized && (
          <div className="space-y-5 text-center py-3">
            <div className="w-16 h-16 bg-rose-950/80 border border-rose-800/80 rounded-full flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 text-rose-500" />
            </div>

            <div className="space-y-2 bg-rose-950/40 border border-rose-900/60 p-4 rounded-2xl">
              <h3 className="text-sm font-bold text-rose-400">❌ 접속 권한 오류</h3>
              <p className="text-xs text-slate-300 font-mono bg-slate-950/60 py-1 px-2.5 rounded border border-slate-800 truncate">
                {user.email || user.uid}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pt-1">
                계정 이메일을 확인 후 다시 로그인해 주세요.
              </p>
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleLogin}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-pink-400" />
                <span>다시 시도</span>
              </button>
              <button
                onClick={handleLogout}
                className="py-2.5 px-4 bg-slate-900 hover:bg-slate-850 text-slate-400 border border-slate-800 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          </div>
        )}

        {/* Case 3: Logged In & Authorized */}
        {user && isAuthorized && (
          <div className="space-y-4">
            <div className="bg-emerald-950/50 border border-emerald-800/60 p-4 rounded-2xl flex items-center space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-emerald-400">✅ 접속 권한 승인됨</p>
                <p className="text-xs text-slate-300 font-mono truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

