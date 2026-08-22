import React, { useState } from 'react';
import { X, Smartphone, Download, Copy, Check, Terminal, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface GooglePlayExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GooglePlayExportModal: React.FC<GooglePlayExportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const commands = [
    { label: '1. 프로젝트 패키지 설치', cmd: 'npm install' },
    { label: '2. 웹 빌드 & 안드로이드 동기화', cmd: 'npm run build:android' },
    { label: '3. 안드로이드 플랫폼 추가 (최초 1회)', cmd: 'npx cap add android' },
    { label: '4. 안드로이드 스튜디오 열기', cmd: 'npx cap open android' },
  ];

  const handleCopy = (text: string, index: number) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Smartphone className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <span>구글 플레이 스토어 (Android App) 패키지 배포</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                  Capacitor 8.0 / Android Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                내맘대로 아이돌 만들기를 안드로이드 앱 Bundle(.aab) / APK 파일로 변환하여 구글 플레이에 등록할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 font-medium">📦 안드로이드 패키지 ID (App ID)</div>
            <div className="text-emerald-400 font-mono font-bold text-sm">com.idolcreator777jpysm369.kimby7</div>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
            <div className="text-slate-400 font-medium">📱 앱 기본 명칭 (App Name)</div>
            <div className="text-cyan-300 font-bold text-sm">내맘대로 아이돌 만들기</div>
          </div>
        </div>

        {/* Step-by-Step Guide */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>빌드 및 AAB 패키지 생성 순서</span>
          </h4>

          <div className="space-y-2">
            {commands.map((c, idx) => (
              <div
                key={idx}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="text-slate-400 font-medium text-[11px]">{c.label}</div>
                  <div className="text-amber-300 font-mono font-bold mt-0.5">{c.cmd}</div>
                </div>
                <button
                  onClick={() => handleCopy(c.cmd, idx)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer transition shrink-0"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">복사됨</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>복사</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* SHA-256 Fingerprint Instructions */}
        <div className="bg-slate-950 border border-amber-500/30 p-4 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-amber-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>🔑 SHA-256 인증서 지문 (Fingerprint) 확인 방법</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Firebase, Google OAuth 로그인, Google Play App Signing 설정에 필요한 SHA-256 지문 추출 명령입니다:
          </p>
          
          <div className="space-y-2 pt-1">
            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <div className="text-slate-400 text-[10px]">디버그 키스토어 (로컬 테스트용)</div>
                <div className="text-emerald-300 font-mono text-[11px] font-bold">
                  keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
                </div>
              </div>
              <button
                onClick={() => handleCopy('keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android', 99)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] font-bold shrink-0 cursor-pointer"
              >
                {copiedIndex === 99 ? '복사됨' : '복사'}
              </button>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <div className="text-slate-400 text-[10px]">릴리즈 서명 키(.jks / .keystore)</div>
                <div className="text-amber-300 font-mono text-[11px] font-bold">
                  keytool -list -v -keystore [키스토어_파일명.jks] -alias [키_별칭]
                </div>
              </div>
              <button
                onClick={() => handleCopy('keytool -list -v -keystore my-release-key.jks -alias my-alias', 100)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] font-bold shrink-0 cursor-pointer"
              >
                {copiedIndex === 100 ? '복사됨' : '복사'}
              </button>
            </div>

            <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <div className="text-slate-400 text-[10px]">빌드된 APK 파일에서 바로 확인 (apksigner)</div>
                <div className="text-cyan-300 font-mono text-[11px] font-bold">
                  $ANDROID_HOME/build-tools/25.0.3/apksigner verify --print-certs [APK파일명.apk]
                </div>
              </div>
              <button
                onClick={() => handleCopy('$ANDROID_HOME/build-tools/25.0.3/apksigner verify --print-certs app-release.apk', 101)}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 text-[10px] font-bold shrink-0 cursor-pointer"
              >
                {copiedIndex === 101 ? '복사됨' : '복사'}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            * 구글 플레이 콘솔에 등록 후에는 <strong>Google Play Console &gt; 설정 &gt; 앱 서명(App Signing)</strong> 메뉴에서 구글이 발급한 <strong>SHA-256 인증서 지문</strong>을 직접 복사할 수 있습니다.
          </p>
        </div>

        {/* Google Play Console Instructions */}
        <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl space-y-2 text-xs">
          <div className="font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>구글 플레이 콘솔 등록 최종 절차</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-slate-300 leading-relaxed">
            <li>상단 <strong>AI Studio 메뉴 (Export / GitHub)</strong>로 전체 소스 코드를 다운로드받습니다.</li>
            <li>안드로이드 스튜디오에서 <code className="text-amber-300">Build &gt; Generate Signed Bundle / APK</code> 선택</li>
            <li><strong>Android App Bundle (.aab)</strong> 선택 후 전자서명 키키스토어(Keystore) 생성 및 서명</li>
            <li>구글 플레이 콘솔(<code className="text-cyan-300">play.google.com/console</code>)에 등록하여 출시 진행!</li>
          </ul>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
          >
            확인 및 닫기
          </button>
        </div>

      </div>
    </div>
  );
};
