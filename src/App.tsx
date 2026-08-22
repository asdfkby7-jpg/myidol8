import React, { useState, useEffect, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { isEmailAuthorized } from './lib/firebaseAccess';
import { AccessGateModal } from './components/AccessGateModal';
import { ActiveTab, Album, Facility, GameState, Group, Trainee, NewsItem } from './types';
import { INITIAL_GAME_STATE, advanceNextWeek } from './utils/gameEngine';
import { sound } from './utils/sound';
import { bgmPlayer } from './utils/bgmPlayer';
import { HeaderNav } from './components/HeaderNav';
import { DashboardView } from './components/DashboardView';
import { TraineeManagement } from './components/TraineeManagement';
import { GroupManagement } from './components/GroupManagement';
import { ConcertScheduleView } from './components/ConcertScheduleView';
import { FacilityUpgrade } from './components/FacilityUpgrade';
import { ChartAndNewsView } from './components/ChartAndNewsView';
import { AlbumStudioModal } from './components/AlbumStudioModal';
import { SaveExportModal } from './components/SaveExportModal';
import { FloatingTraineeWidget } from './components/FloatingTraineeWidget';
import { AgencySetupModal } from './components/AgencySetupModal';
import { GameOverModal } from './components/GameOverModal';
import { AdProposalModal } from './components/AdProposalModal';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { RatingNoticeOverlay } from './components/RatingNoticeOverlay';
import { getTraineeDisplayName } from './utils/gameEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('idol_creator_savestate');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse save state', e);
        }
      }
    }
    return INITIAL_GAME_STATE;
  });

  // Firebase Access Authorization Gate State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  const checkAuthStatus = useCallback(async (user: User | null) => {
    setIsAuthLoading(true);
    if (!user || !user.email) {
      setFirebaseUser(user);
      setIsAuthorized(false);
      setIsAuthLoading(false);
      return;
    }

    setFirebaseUser(user);
    const authorized = await isEmailAuthorized(user.email);
    setIsAuthorized(authorized);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      checkAuthStatus(user);
    });
    return () => unsub();
  }, [checkAuthStatus]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('DASHBOARD');
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditAgencyModal, setShowEditAgencyModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [resetKey, setResetKey] = useState<number>(0);
  const [isSoftBlueBg, setIsSoftBlueBg] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('idol_creator_soft_blue_bg') === 'true';
    }
    return false;
  });

  const handleToggleSoftBlueBg = () => {
    setIsSoftBlueBg(prev => {
      const next = !prev;
      localStorage.setItem('idol_creator_soft_blue_bg', String(next));
      return next;
    });
  };

  // Automatically play default BGM on game start / initial user interaction
  useEffect(() => {
    bgmPlayer.play();

    const handleFirstInteraction = () => {
      bgmPlayer.play();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Auto-save to LocalStorage on state change
  useEffect(() => {
    localStorage.setItem('idol_creator_savestate', JSON.stringify(gameState));
  }, [gameState]);

  // Find last inspected trainee (if lastInspectedTraineeId explicitly set to null, don't show)
  const lastInspectedTrainee = gameState.lastInspectedTraineeId === null
    ? null
    : gameState.trainees.find(t => t.id === gameState.lastInspectedTraineeId) || (gameState.trainees[0] || null);

  // Turn Advancement
  const handleNextWeek = () => {
    sound.playClick();
    const updated = advanceNextWeek(gameState);
    setGameState(updated);

    // Trigger Ad Proposal Modal every 3 weeks if trainees exist
    if (updated.week % 3 === 0 && updated.trainees.length > 0) {
      setShowAdModal(true);
    }
  };

  const handleAcceptAd = (
    trainee: Trainee,
    rewardMoney: number,
    rewardFans: number,
    adTitle: string,
    staminaLoss: number,
    mentalLoss: number,
    extraReward: number
  ) => {
    const displayName = getTraineeDisplayName(trainee);
    const newNews: NewsItem = {
      id: `news_ad_${Date.now()}`,
      week: gameState.week,
      type: 'EVENT',
      title: `[광고 발탁] ${displayName} ${adTitle} 계약`,
      content: `${displayName}(이)가 ${adTitle} 메인 모델로 발탁되었습니다! (계약금 +₩${rewardMoney.toLocaleString()}${
        extraReward > 0 ? ` [능력치 보너스 +₩${extraReward.toLocaleString()}]` : ''
      }, 팬 +${rewardFans.toLocaleString()}명 / 체력 -${staminaLoss}, 멘탈 -${mentalLoss})`,
      isNegative: false,
    };

    setGameState(prev => ({
      ...prev,
      money: prev.money + rewardMoney,
      fans: prev.fans + rewardFans,
      trainees: prev.trainees.map(t =>
        t.id === trainee.id
          ? {
              ...t,
              stamina: Math.max(0, t.stamina - staminaLoss),
              mental: Math.max(0, t.mental - mentalLoss),
            }
          : t
      ),
      newsList: [newNews, ...prev.newsList],
    }));

    setShowAdModal(false);
  };

  const handleResetGame = () => {
    sound.playLevelUp();
    bgmPlayer.resetToDefaultBgm();
    localStorage.removeItem('idol_creator_savestate');
    setGameState({
      ...INITIAL_GAME_STATE,
      isSetupCompleted: false, // Ensure game setup modal triggers again
    });
    setResetKey(prev => prev + 1);
    setActiveTab('DASHBOARD');
  };

  const handleInspectTrainee = (traineeId: string) => {
    setGameState(prev => ({ ...prev, lastInspectedTraineeId: traineeId }));
  };

  const handleImageUploaded = (traineeId: string, imageDataUrl: string) => {
    setGameState(prev => ({
      ...prev,
      lastInspectedTraineeId: traineeId,
      trainees: prev.trainees.map(t => t.id === traineeId ? { ...t, profileImage: imageDataUrl } : t)
    }));
  };

  const isGameOver = gameState.isSetupCompleted && gameState.money < 0;

  return (
    <div className={`min-h-screen font-sans antialiased selection:bg-pink-500 selection:text-white pb-12 transition-colors duration-300 ${
      isSoftBlueBg ? 'bg-[#dce9f8] text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Header Bar */}
      <HeaderNav
        state={gameState}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNextWeek={handleNextWeek}
        onOpenSaveModal={() => setShowSaveModal(true)}
        onOpenAlbumModal={() => setShowAlbumModal(true)}
        onResetGame={handleResetGame}
        onEditCompanyName={() => setShowEditAgencyModal(true)}
        isSoftBlueBg={isSoftBlueBg}
        onToggleSoftBlueBg={handleToggleSoftBlueBg}
      />

      {/* Main Tab Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'DASHBOARD' && (
          <DashboardView
            state={gameState}
            setActiveTab={setActiveTab}
            onOpenAlbumModal={() => setShowAlbumModal(true)}
            onNextWeek={handleNextWeek}
          />
        )}

        {activeTab === 'TRAINEE' && (
          <TraineeManagement
            state={gameState}
            onUpdateTrainees={(updatedTrainees: Trainee[]) => {
              setGameState(prev => ({ ...prev, trainees: updatedTrainees }));
            }}
            onUpdateMoney={(newMoney: number) => {
              setGameState(prev => ({ ...prev, money: newMoney }));
            }}
            onAddNews={(newNews: NewsItem) => {
              setGameState(prev => ({ ...prev, newsList: [newNews, ...prev.newsList] }));
            }}
            onInspectTrainee={handleInspectTrainee}
            onUpdateState={(newState: GameState) => setGameState(newState)}
          />
        )}

        {activeTab === 'GROUPS' && (
          <GroupManagement
            state={gameState}
            onUpdateGroups={(updatedGroups: Group[], updatedTrainees: Trainee[]) => {
              setGameState(prev => ({ ...prev, groups: updatedGroups, trainees: updatedTrainees }));
            }}
          />
        )}

        {activeTab === 'CONCERT' && (
          <ConcertScheduleView
            state={gameState}
            onUpdateState={(newState: GameState) => setGameState(newState)}
          />
        )}

        {activeTab === 'FACILITY' && (
          <FacilityUpgrade
            state={gameState}
            onUpdateFacilities={(newFacilities: Record<string, Facility>, newMoney: number) => {
              setGameState(prev => ({ ...prev, facilities: newFacilities, money: newMoney }));
            }}
          />
        )}

        {activeTab === 'CHARTS' && (
          <ChartAndNewsView state={gameState} />
        )}
      </main>

      {/* Floating Widget for Last Inspected Trainee (Popup 1/5 screen size with breathing effect & close button) */}
      <FloatingTraineeWidget
        trainee={lastInspectedTrainee}
        onClose={() => setGameState(prev => ({ ...prev, lastInspectedTraineeId: null }))}
        onImageUploaded={handleImageUploaded}
        onOpenTraineeTab={() => setActiveTab('TRAINEE')}
      />

      {/* Initial Game Agency Setup Modal */}
      {!gameState.isSetupCompleted && (
        <AgencySetupModal
          initialCompanyName={gameState.companyName}
          initialRepName={gameState.repName}
          onSubmit={(companyName, repName) => {
            setGameState(prev => ({
              ...prev,
              companyName,
              repName,
              isSetupCompleted: true,
            }));
          }}
        />
      )}

      {/* Edit Agency Name Modal */}
      {showEditAgencyModal && (
        <AgencySetupModal
          initialCompanyName={gameState.companyName}
          initialRepName={gameState.repName}
          isEditMode={true}
          onClose={() => setShowEditAgencyModal(false)}
          onSubmit={(companyName, repName) => {
            setGameState(prev => ({
              ...prev,
              companyName,
              repName,
            }));
            setShowEditAgencyModal(false);
          }}
        />
      )}

      {/* Game Over Modal (Triggered when money < 0) */}
      {isGameOver && (
        <GameOverModal
          money={gameState.money}
          week={gameState.week}
          onRestart={handleResetGame}
        />
      )}

      {/* Album Studio Modal */}
      {showAlbumModal && (
        <AlbumStudioModal
          state={gameState}
          onClose={() => setShowAlbumModal(false)}
          onAlbumReleased={(updatedState: GameState, isSuccess: boolean, album: Album) => {
            setGameState(updatedState);
          }}
        />
      )}

      {/* Save & Export Modal */}
      {showSaveModal && (
        <SaveExportModal
          state={gameState}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {/* Ad Proposal Modal (Every 3 Weeks) */}
      {showAdModal && (
        <AdProposalModal
          week={gameState.week}
          trainees={gameState.trainees}
          state={gameState}
          onAcceptAd={handleAcceptAd}
          onRejectAd={() => setShowAdModal(false)}
        />
      )}

      {/* Monthly Management Report Modal (1st week of every month except week 1) */}
      {gameState.showMonthlyReportModal && gameState.pendingMonthlyReport && (
        <MonthlyReportModal
          data={gameState.pendingMonthlyReport}
          companyName={gameState.companyName}
          repName={gameState.repName}
          onClose={() =>
            setGameState(prev => ({
              ...prev,
              showMonthlyReportModal: false,
            }))
          }
        />
      )}

      {/* Firebase Access Authorization Gate (Renders when user is not authorized) */}
      {(!isAuthorized || isAuthLoading) && (
        <AccessGateModal
          user={firebaseUser}
          isAuthorized={isAuthorized}
          isLoading={isAuthLoading}
          onRefreshAuth={() => checkAuthStatus(auth.currentUser)}
        />
      )}

      {/* Rating Notice Overlay (12세 이용가 등급 안내) */}
      <RatingNoticeOverlay resetTrigger={resetKey} />
    </div>
  );
}
