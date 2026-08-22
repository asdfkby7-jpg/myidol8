import React, { useState, useEffect } from 'react';
import { ActiveTab, GameState } from '../types';
import { 
  Building2, 
  Users, 
  Disc, 
  Calendar, 
  Award, 
  CalendarDays,
  Sparkles,
  Save,
  Radio,
  Tv,
  RotateCcw,
  Pencil,
  Volume2,
  VolumeX,
  Music,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Palette
} from 'lucide-react';
import { sound } from '../utils/sound';
import { bgmPlayer, BGM_TRACKS } from '../utils/bgmPlayer';

interface HeaderNavProps {
  state: GameState;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNextWeek: () => void;
  onOpenSaveModal: () => void;
  onOpenAlbumModal: () => void;
  onResetGame: () => void;
  onEditCompanyName: () => void;
  isSoftBlueBg?: boolean;
  onToggleSoftBlueBg?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  state,
  activeTab,
  setActiveTab,
  onNextWeek,
  onOpenSaveModal,
  onOpenAlbumModal,
  onResetGame,
  onEditCompanyName,
  isSoftBlueBg = false,
  onToggleSoftBlueBg,
}) => {
  const [bgmStatus, setBgmStatus] = useState(bgmPlayer.getStatus());
  const [showBgmSelector, setShowBgmSelector] = useState(false);

  useEffect(() => {
    const unsub = bgmPlayer.subscribe(() => {
      setBgmStatus(bgmPlayer.getStatus());
    });
    return () => unsub();
  }, []);

  const year = Math.floor((state.week - 1) / 48) + 1;
  const month = Math.floor(((state.week - 1) % 48) / 4) + 1;
  const weekOfMonth = ((state.week - 1) % 4) + 1;

  const row1Tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'DASHBOARD', label: '대시보드', icon: <Building2 className="w-4 h-4 shrink-0" /> },
    { id: 'TRAINEE', label: '연습생 관리', icon: <Users className="w-4 h-4 shrink-0" /> },
    { id: 'GROUPS', label: '그룹 & 데뷔', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
  ];

  const row2Tabs: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'CONCERT', label: '콘서트 & 스케줄', icon: <Tv className="w-4 h-4 shrink-0" /> },
    { id: 'FACILITY', label: '기획사 시설', icon: <Award className="w-4 h-4 shrink-0" /> },
    { id: 'CHARTS', label: '음원 차트 & 뉴스', icon: <Radio className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <header className={`border-b text-slate-100 sticky top-0 z-40 shadow-xl transition-colors duration-300 ${
      isSoftBlueBg ? 'bg-[#1e2d42] border-[#2e425f]' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Top Info Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between py-3 gap-3">
          
          {/* Logo & Agency Info */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 to-violet-600 flex items-center justify-center shadow-lg shadow-pink-500/20 shrink-0">
              <Sparkles className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-bold text-lg text-white tracking-tight">내맘대로 아이돌 만들기</h1>
                {/* Reset, Background Color & BGM Buttons Column */}
                <div className="flex flex-col items-start gap-1 ml-1">
                  {/* Reset Button & Background Color Toggle Button Row */}
                  <div className="flex items-center space-x-1">
                    {/* Reset Button */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (window.confirm('게임을 완전히 초기화하고 1주차부터 새로 시작하시겠습니까?')) {
                          onResetGame();
                        }
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-bold transition shadow-sm cursor-pointer"
                      title="게임 완전 초기화 (1주차부터 새로 시작)"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>리셋</span>
                    </button>

                    {/* Background Color Toggle Button (Directly to the right of Reset button) */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        if (onToggleSoftBlueBg) onToggleSoftBlueBg();
                      }}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition shadow-sm border cursor-pointer ${
                        isSoftBlueBg
                          ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 border-sky-300 shadow-[0_0_10px_rgba(56,189,248,0.4)]'
                          : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border-slate-700'
                      }`}
                      title={isSoftBlueBg ? '원래 배경색으로 복원' : '눈이 편안한 연한 파란색 배경으로 변경'}
                    >
                      <Palette className="w-2.5 h-2.5" />
                      <span>배경색</span>
                    </button>
                  </div>

                  {/* BGM Toggle Button (Directly below Reset button) */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => {
                        sound.playClick();
                        bgmPlayer.togglePlay();
                      }}
                      className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-bold transition shadow-sm border ${
                        bgmStatus.isPlaying
                          ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 border-amber-300 animate-pulse'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                      title={bgmStatus.isPlaying ? 'BGM 정지' : 'BGM 재생 (밝은 피아노/바이올린 협주)'}
                    >
                      {bgmStatus.isPlaying ? <Volume2 className="w-2.5 h-2.5 text-slate-950" /> : <VolumeX className="w-2.5 h-2.5 text-slate-400" />}
                      <span>{bgmStatus.isPlaying ? 'BGM ON' : 'BGM OFF'}</span>
                    </button>

                    {/* File Upload for Custom BGM */}
                    <label
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-pink-400 hover:text-pink-300 cursor-pointer border border-slate-700 transition flex items-center"
                      title="음악 파일 삽입 (MP3, MP4, M4A, OGG, WAV 등)"
                    >
                      <Music className="w-2.5 h-2.5" />
                      <input
                        type="file"
                        accept="audio/*,.mp3,.mp4,.m4a,.ogg,.wav"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            bgmPlayer.setCustomAudioFile(file);
                          }
                        }}
                      />
                    </label>

                    {bgmStatus.isCustom && (
                      <button
                        onClick={() => bgmPlayer.resetToDefaultBgm()}
                        className="text-[9px] text-amber-400 hover:underline"
                        title="기본 BGM으로 복원"
                      >
                        [기본BGM]
                      </button>
                    )}
                  </div>

                  {/* Track Switcher Button */}
                  <div className="relative flex flex-col space-y-1 mt-1 items-start">
                    {/* BGM Change Button */}
                    <button
                      onClick={() => {
                        sound.playClick();
                        setShowBgmSelector(!showBgmSelector);
                      }}
                      className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-[10px] font-bold transition shadow-md border border-purple-400/40 shrink-0 cursor-pointer"
                      title="다른 BGM 곡으로 변경하기"
                    >
                      <SlidersHorizontal className="w-2.5 h-2.5" />
                      <span>BGM 변경</span>
                      <ChevronDown className={`w-2.5 h-2.5 transition-transform ${showBgmSelector ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Track Selector */}
                    {showBgmSelector && (
                      <div className="absolute top-full left-0 mt-1.5 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-800 px-1">
                          <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-200">
                            <Music className="w-3.5 h-3.5 text-pink-400" />
                            <span>BGM 곡 선택</span>
                          </div>
                          <button
                            onClick={() => setShowBgmSelector(false)}
                            className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition text-[11px] font-bold"
                          >
                            ✕
                          </button>
                        </div>

                        <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                          {BGM_TRACKS.map((track) => {
                            const isSelected = bgmStatus.currentTrackId === track.id && !bgmStatus.isCustom;
                            return (
                              <button
                                key={track.id}
                                onClick={() => {
                                  sound.playClick();
                                  bgmPlayer.selectTrack(track.id);
                                  setShowBgmSelector(false);
                                }}
                                className={`w-full text-left p-2 rounded-lg transition flex items-center justify-between group ${
                                  isSelected
                                    ? 'bg-purple-900/60 border border-purple-500/50 text-white shadow-sm'
                                    : 'bg-slate-800/50 hover:bg-slate-800 border border-slate-700/40 text-slate-300'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="text-xs font-semibold truncate flex items-center space-x-1">
                                    <span>{track.title}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                                    {track.subtitle}
                                  </div>
                                </div>
                                {isSelected && bgmStatus.isPlaying && (
                                  <span className="flex items-center space-x-1 shrink-0 px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 text-[9px] font-bold border border-pink-500/30">
                                    <Check className="w-2.5 h-2.5" />
                                    <span>재생중</span>
                                  </span>
                                )}
                              </button>
                            );
                          })}

                          {/* Custom File Option */}
                          <div className="pt-2 mt-2 border-t border-slate-800 px-1">
                            <label className="flex items-center justify-between w-full p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-pink-400 hover:text-pink-300 cursor-pointer transition text-xs font-semibold">
                              <div className="flex items-center space-x-1.5 truncate pr-2">
                                <Music className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                                <span className="truncate">
                                  {bgmStatus.isCustom ? bgmStatus.customFileName : '내 오디오 파일 등록 (.mp3, .wav)'}
                                </span>
                              </div>
                              <span className="text-[10px] bg-pink-500/20 px-1.5 py-0.5 rounded text-pink-300 shrink-0">
                                {bgmStatus.isCustom ? '변경' : '파일선택'}
                              </span>
                              <input
                                type="file"
                                accept="audio/*,.mp3,.mp4,.m4a,.ogg,.wav"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    bgmPlayer.setCustomAudioFile(file);
                                    setShowBgmSelector(false);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                <span>{state.companyName || '기획사'} ({state.repName || '대표'})</span>
                <button
                  onClick={() => {
                    sound.playClick();
                    onEditCompanyName();
                  }}
                  className="text-[10px] text-pink-400 hover:text-pink-300 underline flex items-center space-x-0.5 font-medium"
                  title="기획사 이름 변경"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>변경</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Game Stats Pill */}
          <div className="flex items-center space-x-2 sm:space-x-4 bg-slate-800/80 p-1.5 px-3 rounded-xl border border-slate-700/60 text-xs sm:text-sm">
            {/* Money */}
            <div className="flex items-center space-x-1.5 px-2 py-1">
              <span className="text-emerald-400 font-semibold">₩</span>
              <div>
                <div className="text-[10px] text-slate-400">보유 자금</div>
                <div className="font-bold text-emerald-300">₩{state.money.toLocaleString()}</div>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            {/* Fandom */}
            <div className="flex items-center space-x-1.5 px-2 py-1">
              <Users className="w-4 h-4 text-pink-400" />
              <div>
                <div className="text-[10px] text-slate-400">공식 팬클럽</div>
                <div className="font-bold text-pink-300">{state.fandom.toLocaleString()} 명</div>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-700" />

            {/* Date */}
            <div className="flex items-center space-x-1.5 px-2 py-1">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-[10px] text-slate-400">현재 날짜</div>
                <div className="font-bold text-cyan-300">{year}년차 {month}월 {weekOfMonth}주</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                sound.playClick();
                onOpenAlbumModal();
              }}
              className="flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-500 hover:to-pink-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-violet-500/20 transition-all transform active:scale-95"
            >
              <Disc className="w-4 h-4" />
              <span>신규 앨범 제작</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onNextWeek();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all transform active:scale-95"
            >
              <CalendarDays className="w-4 h-4" />
              <span>다음 주로 ({state.week + 1}주차)</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onOpenSaveModal();
              }}
              className="flex items-center space-x-1.5 p-2 px-2.5 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
              title="게임 데이터 수동 저장"
            >
              <Save className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-semibold">저장</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation (2 Rows Layout for Mobile & Desktop) */}
        <div className="pt-2 pb-2.5 space-y-1.5">
          {/* Row 1: 대시보드, 연습생 관리, 그룹 & 데뷔 */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {row1Tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center justify-center space-x-1 sm:space-x-2 px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Row 2 (Below Row 1): 콘서트 & 스케줄, 기획사 시설, 음원 차트 & 뉴스 */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
            {row2Tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    sound.playClick();
                    setActiveTab(tab.id);
                  }}
                  className={`flex items-center justify-center space-x-1 sm:space-x-2 px-1.5 sm:px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30 ring-1 ring-pink-400'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/50'
                  }`}
                >
                  {tab.icon}
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
