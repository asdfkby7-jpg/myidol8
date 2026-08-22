import React, { useState, useRef, useEffect } from 'react';
import { GameState, Trainee, NewsItem } from '../types';
import { RECRUIT_CANDIDATES_POOL } from '../data/initialData';
import { getTraineeDisplayName, syncFandoms } from '../utils/gameEngine';
import { getTraineeChartRank, getChartAuraClasses } from '../utils/chartUtils';
import { PaintModal } from './PaintModal';
import { 
  Users, 
  Sparkles, 
  Mic, 
  Flame, 
  Heart, 
  UserPlus, 
  ShieldAlert, 
  Zap, 
  Coffee,
  X,
  Camera,
  Image as ImageIcon,
  Palette,
  Tag,
  Moon,
  Siren,
  AlertTriangle,
  UserMinus,
  UserX,
  DollarSign,
  CheckCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { sound } from '../utils/sound';
import { bgmPlayer } from '../utils/bgmPlayer';
import { isGifImage, PRESET_SAMPLE_GIFS } from '../utils/imageUtils';
import { createUniqueCandidate, createSpecialCandidate, getAllExistingNames } from '../utils/traineeGenerator';
import { isCelebrityName, sanitizeTraineeName, sanitizeTraineesList } from '../utils/celebrityNameFilter';

interface TraineeManagementProps {
  state: GameState;
  onUpdateTrainees: (trainees: Trainee[]) => void;
  onUpdateMoney: (newMoney: number) => void;
  onAddNews?: (news: NewsItem) => void;
  onInspectTrainee?: (traineeId: string) => void;
  onUpdateState?: (newState: GameState) => void;
}

export const TraineeManagement: React.FC<TraineeManagementProps> = ({
  state,
  onUpdateTrainees,
  onUpdateMoney,
  onAddNews,
  onInspectTrainee,
  onUpdateState,
}) => {
  const [showScoutModal, setShowScoutModal] = useState(false);
  const [showSpecialScoutModal, setShowSpecialScoutModal] = useState(false);
  const [editingPaintTraineeId, setEditingPaintTraineeId] = useState<string | null>(null);
  const [scoutPool, setScoutPool] = useState<Omit<Trainee, 'id' | 'joinedWeek'>[]>(RECRUIT_CANDIDATES_POOL);
  const [specialScoutPool, setSpecialScoutPool] = useState<Omit<Trainee, 'id' | 'joinedWeek'>[]>([]);

  // Trainee Release & Renegotiation States
  const [releaseTargetTrainee, setReleaseTargetTrainee] = useState<Trainee | null>(null);
  const [dischargeNewsModalData, setDischargeNewsModalData] = useState<{
    trainee: Trainee;
    groupName?: string;
    newsTitle: string;
    newsContent: string;
    fandomLoss?: number;
    scoreLoss?: number;
    upkeepSaved: number;
    quote?: string;
    isVoluntary?: boolean;
  } | null>(null);
  const [renegotiateSuccessMessage, setRenegotiateSuccessMessage] = useState<string | null>(null);

  // Option 1: 주급을 50%로 감소시켜 재계약 시도
  const handleRenegotiateSalary = (trainee: Trainee) => {
    const currentCutCount = trainee.salaryCutCount || 0;
    const nextCutCount = currentCutCount + 1;
    const displayName = getTraineeDisplayName(trainee);
    const originalUpkeep = trainee.upkeep || 150000;

    // 2번 누적 결정 시: "다른 기획사를 알아 보겠어요."와 함께 자진 방출
    if (nextCutCount >= 2) {
      const updatedTrainees = state.trainees.filter(t => t.id !== trainee.id);
      const targetGroup = state.groups.find(g => g.id === trainee.groupId || g.memberIds.includes(trainee.id));

      if (targetGroup) {
        // 소속 그룹이 있는 경우: 그룹 멤버 제외, 평판 하락, 차트 곡 점수 하락, 자진 탈퇴 속보 팝업
        const updatedMemberIds = targetGroup.memberIds.filter(id => id !== trainee.id);
        const updatedGroups = state.groups.map(g => {
          if (g.id === targetGroup.id) {
            return {
              ...g,
              memberIds: updatedMemberIds,
              reputation: Math.max(0, g.reputation - 20),
            };
          }
          return g;
        });

        let updatedChart = state.currentChart.map(song => {
          if (song.artist === targetGroup.name && song.isUserGroup) {
            return { ...song, score: Math.max(10, song.score - 15) };
          }
          return song;
        });
        updatedChart.sort((a, b) => b.score - a.score);
        updatedChart = updatedChart.slice(0, 10).map((s, idx) => ({ ...s, rank: idx + 1 }));

        const newsItem: NewsItem = {
          id: `news_vol_leave_${Date.now()}`,
          week: state.week,
          title: `[속보] '${targetGroup.name}' ${displayName}, "다른 기획사를 알아 보겠어요." 주급 삭감 거부 자진 탈퇴!`,
          content: `${targetGroup.name}의 ${displayName}이(가) 기획사의 2번째 주급 50% 삭감 요구에 "다른 기획사를 알아 보겠어요."라는 말을 남기고 재계약을 거부하며 스스로 팀을 떠났습니다(자진 방출).`,
          type: 'SCANDAL',
          isNegative: true,
        };

        sound.playFailure();

        setDischargeNewsModalData({
          trainee,
          groupName: targetGroup.name,
          newsTitle: `[속보] '${targetGroup.name}' ${displayName}, "다른 기획사를 알아 보겠어요." 재계약 거부 자진 탈퇴!`,
          newsContent: `${targetGroup.name}의 ${displayName}이(가) 2회에 걸친 주급 50% 삭감 요구에 "다른 기획사를 알아 보겠어요."라는 말을 남기고 기획사 재계약을 거부한 채 스스로 짐을 싸서 떠났습니다(자진 방출). 그룹 이미지와 인기에 심각한 타격이 발생했습니다.`,
          quote: "다른 기획사를 알아 보겠어요.",
          isVoluntary: true,
          fandomLoss: trainee.fandom || 0,
          scoreLoss: 15,
          upkeepSaved: originalUpkeep,
        });

        const rawState: GameState = {
          ...state,
          trainees: updatedTrainees,
          groups: updatedGroups,
          currentChart: updatedChart,
          newsList: [newsItem, ...state.newsList],
          lastInspectedTraineeId: state.lastInspectedTraineeId === trainee.id ? null : state.lastInspectedTraineeId,
        };

        if (onUpdateState) {
          onUpdateState(syncFandoms(rawState));
        } else {
          onUpdateTrainees(updatedTrainees);
          if (onAddNews) onAddNews(newsItem);
        }
      } else {
        // 소속 그룹이 없는 연습생의 경우
        const newsItem: NewsItem = {
          id: `news_vol_leave_${Date.now()}`,
          week: state.week,
          title: `[계약 결렬] 연습생 ${displayName}, "다른 기획사를 알아 보겠어요." 2회 삭감에 자진 퇴소!`,
          content: `연습생 ${displayName}이(가) 2번째 주급 50% 삭감 결정에 "다른 기획사를 알아 보겠어요."라며 계약 갱신을 거부하고 기획사를 자진 퇴소하였습니다.`,
          type: 'EVENT',
          isNegative: true,
        };

        sound.playFailure();

        setDischargeNewsModalData({
          trainee,
          newsTitle: `[계약 결렬] 연습생 ${displayName}, "다른 기획사를 알아 보겠어요." 자진 퇴소!`,
          newsContent: `연습생 ${displayName}이(가) 연속된 주급 50% 삭감 결정에 "다른 기획사를 알아 보겠어요."라며 재계약을 최종 거부하고 기획사를 스스로 떠났습니다(자진 방출).`,
          quote: "다른 기획사를 알아 보겠어요.",
          isVoluntary: true,
          upkeepSaved: originalUpkeep,
        });

        const rawState: GameState = {
          ...state,
          trainees: updatedTrainees,
          newsList: [newsItem, ...state.newsList],
          lastInspectedTraineeId: state.lastInspectedTraineeId === trainee.id ? null : state.lastInspectedTraineeId,
        };

        if (onUpdateState) {
          onUpdateState(syncFandoms(rawState));
        } else {
          onUpdateTrainees(updatedTrainees);
          if (onAddNews) onAddNews(newsItem);
        }
      }

      setReleaseTargetTrainee(null);
      return;
    }

    // 1회차 삭감 정상 재계약
    const newUpkeep = Math.max(10000, Math.floor(originalUpkeep * 0.5));

    const updatedTrainees = state.trainees.map(t => 
      t.id === trainee.id ? { ...t, upkeep: newUpkeep, salaryCutCount: nextCutCount } : t
    );

    const newsItem: NewsItem = {
      id: `news_reneg_${Date.now()}`,
      week: state.week,
      title: `[계약 갱신] ${displayName}, 주급 50% 삭감 재계약 합의 (누적 1회)`,
      content: `${state.companyName}은(는) ${displayName}과(와) 주급을 기존 ₩${originalUpkeep.toLocaleString()}에서 50% 삭감된 ₩${newUpkeep.toLocaleString()}(으)로 재계약을 체결하였습니다. (주급 삭감 1회 누적)`,
      type: 'EVENT',
    };

    sound.playLevelUp();
    if (onUpdateState) {
      onUpdateState(syncFandoms({
        ...state,
        trainees: updatedTrainees,
        newsList: [newsItem, ...state.newsList],
      }));
    } else {
      onUpdateTrainees(updatedTrainees);
      if (onAddNews) onAddNews(newsItem);
    }

    setReleaseTargetTrainee(null);
    setRenegotiateSuccessMessage(`'${displayName}' 주급 50% 삭감(₩${originalUpkeep.toLocaleString()} ➔ ₩${newUpkeep.toLocaleString()}) 재계약 완료! (⚠️ 1회 누적 - 2회 누적 시 자진 방출됩니다)`);
    setTimeout(() => setRenegotiateSuccessMessage(null), 4000);
  };

  // Option 2: 기획사에서 방출
  const handleDischargeTrainee = (trainee: Trainee) => {
    const displayName = getTraineeDisplayName(trainee);
    const updatedTrainees = state.trainees.filter(t => t.id !== trainee.id);
    const targetGroup = state.groups.find(g => g.id === trainee.groupId || g.memberIds.includes(trainee.id));

    if (targetGroup) {
      // 1. 소속 그룹이 있는 경우: 그룹 멤버 제외, 평판 하락, 차트 곡 점수 하락, 속보 모달 팝업
      const updatedMemberIds = targetGroup.memberIds.filter(id => id !== trainee.id);
      const updatedGroups = state.groups.map(g => {
        if (g.id === targetGroup.id) {
          return {
            ...g,
            memberIds: updatedMemberIds,
            reputation: Math.max(0, g.reputation - 15),
          };
        }
        return g;
      });

      let updatedChart = state.currentChart.map(song => {
        if (song.artist === targetGroup.name && song.isUserGroup) {
          return { ...song, score: Math.max(10, song.score - 10) };
        }
        return song;
      });
      updatedChart.sort((a, b) => b.score - a.score);
      updatedChart = updatedChart.slice(0, 10).map((s, idx) => ({ ...s, rank: idx + 1 }));

      const newsItem: NewsItem = {
        id: `news_discharge_${Date.now()}`,
        week: state.week,
        title: `[속보] '${targetGroup.name}' 멤버 ${displayName} 전격 방출! 그룹 이미지에 큰 타격!`,
        content: `${targetGroup.name}의 핵심 멤버 ${displayName}이(가) 소속사 ${state.companyName}에서 전격 방출되었습니다. 팬덤의 거센 반발과 함께 그룹의 인기와 순위가 급락하고 있습니다.`,
        type: 'SCANDAL',
        isNegative: true,
      };

      sound.playFailure();

      setDischargeNewsModalData({
        trainee,
        groupName: targetGroup.name,
        newsTitle: `[속보] '${targetGroup.name}' 멤버 ${displayName} 전격 방출! 그룹 이미지에 큰 타격!`,
        newsContent: `${targetGroup.name}의 핵심 멤버 ${displayName}이(가) 소속사 ${state.companyName}에서 전격 방출되었습니다. 팬덤의 거센 반발과 함께 그룹의 인기와 순위가 급락하고 있습니다.`,
        fandomLoss: trainee.fandom || 0,
        scoreLoss: 10,
        upkeepSaved: trainee.upkeep || 150000,
      });

      const rawState: GameState = {
        ...state,
        trainees: updatedTrainees,
        groups: updatedGroups,
        currentChart: updatedChart,
        newsList: [newsItem, ...state.newsList],
        lastInspectedTraineeId: state.lastInspectedTraineeId === trainee.id ? null : state.lastInspectedTraineeId,
      };

      if (onUpdateState) {
        onUpdateState(syncFandoms(rawState));
      } else {
        onUpdateTrainees(updatedTrainees);
        if (onAddNews) onAddNews(newsItem);
      }
    } else {
      // 2. 소속 그룹이 없는 연습생인 경우: 조용히 퇴소 및 주급 절감
      const newsItem: NewsItem = {
        id: `news_discharge_${Date.now()}`,
        week: state.week,
        title: `[공지] 연습생 ${displayName} 전속계약 해지 및 방출 안내`,
        content: `연습생 ${displayName}이(가) 상호 협의 하에 기획사와의 계약을 종료하고 방출되었습니다.`,
        type: 'EVENT',
        isNegative: true,
      };

      sound.playClick();

      setDischargeNewsModalData({
        trainee,
        newsTitle: `[공지] 연습생 ${displayName} 방출 완료`,
        newsContent: `연습생 ${displayName}이(가) 기획사와의 계약을 종료하고 정식 방출되었습니다. 매주 고정 주급 ₩${(trainee.upkeep || 150000).toLocaleString()}이 절감됩니다.`,
        upkeepSaved: trainee.upkeep || 150000,
      });

      const rawState: GameState = {
        ...state,
        trainees: updatedTrainees,
        newsList: [newsItem, ...state.newsList],
        lastInspectedTraineeId: state.lastInspectedTraineeId === trainee.id ? null : state.lastInspectedTraineeId,
      };

      if (onUpdateState) {
        onUpdateState(syncFandoms(rawState));
      } else {
        onUpdateTrainees(updatedTrainees);
        if (onAddNews) onAddNews(newsItem);
      }
    }

    setReleaseTargetTrainee(null);
  };

  // Automatically check & resolve duplicate names in scout pool against existing trainees & sanitize celebrity names
  useEffect(() => {
    // 1. Sanitize any existing trainees with celebrity names or '윤도현'
    const sanitizedTrainees = sanitizeTraineesList(state.trainees);
    let traineesChanged = false;
    sanitizedTrainees.forEach((st, idx) => {
      if (st.name !== state.trainees[idx]?.name || st.stageName !== state.trainees[idx]?.stageName) {
        traineesChanged = true;
      }
    });
    if (traineesChanged) {
      onUpdateTrainees(sanitizedTrainees);
      return;
    }

    const existingNames = new Set<string>();
    state.trainees.forEach(t => {
      if (t.name) existingNames.add(sanitizeTraineeName(t.name.trim()));
      if (t.stageName) existingNames.add(sanitizeTraineeName(t.stageName.trim()));
    });

    let hasDuplicate = false;
    const checkedPool = scoutPool.map((candidate, idx) => {
      const candidateName = sanitizeTraineeName(candidate.name.trim());
      const isDuplicate = existingNames.has(candidateName);
      const duplicateInPool = scoutPool.findIndex((c, i) => i < idx && sanitizeTraineeName(c.name.trim()) === candidateName) !== -1;
      const isCeleb = isCelebrityName(candidate.name);

      if (isDuplicate || duplicateInPool || isCeleb || candidate.name.includes('윤도현')) {
        hasDuplicate = true;
        // Generate a fresh unique candidate
        const replacement = createUniqueCandidate(state.trainees, scoutPool.slice(0, idx), candidate.gender);
        existingNames.add(replacement.name.trim());
        return replacement;
      }
      existingNames.add(candidateName);
      return candidate;
    });

    if (hasDuplicate) {
      setScoutPool(checkedPool);
    }
  }, [state.trainees]);
  const [scandalModalData, setScandalModalData] = useState<{
    trainee: Trainee;
    newsTitle: string;
    newsContent: string;
    danceGain: number;
    moneyReward: number;
    extraReward: number;
    scandalCount: number;
  } | null>(null);
  const [alarmEffectActive, setAlarmEffectActive] = useState(true);

  useEffect(() => {
    if (scandalModalData) {
      setAlarmEffectActive(true);
      const timer = setTimeout(() => {
        setAlarmEffectActive(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [scandalModalData]);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Image Upload Handler
  const handleImageUpload = (traineeId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(jpeg|png|gif)$/i)) {
      alert('JPG, PNG, GIF 이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        sound.playClick();
        const dataUrl = event.target.result as string;
        const updated = state.trainees.map(t => {
          if (t.id === traineeId) {
            return { ...t, profileImage: dataUrl };
          }
          return t;
        });
        onUpdateTrainees(updated);
        if (onInspectTrainee) {
          onInspectTrainee(traineeId);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to compute training cost for a stat type based on facility level (기본 50만원 + 시설 레벨당 +10만원)
  const getTrainingCost = (statType: 'vocal' | 'dance' | 'charisma' | 'visual') => {
    const facility = state.facilities[statType] || (statType === 'charisma' ? state.facilities.recording : state.facilities.rest);
    const level = facility ? (facility.level || 1) : 1;
    return 500000 + (level - 1) * 100000;
  };

  // Training Action
  const handleTrain = (traineeId: string, statType: 'vocal' | 'dance' | 'charisma' | 'visual') => {
    sound.playClick();
    if (onInspectTrainee) onInspectTrainee(traineeId);

    const targetTrainee = state.trainees.find(t => t.id === traineeId);
    if (!targetTrainee) return;

    if (targetTrainee.stamina < 15 || targetTrainee.mental < 15) {
      alert('연습생의 체력 또는 멘탈이 너무 낮아 트레이닝을 진행할 수 없습니다! 휴식을 취하세요.');
      return;
    }

    const trainingCost = getTrainingCost(statType);
    if (state.money < trainingCost) {
      alert(`트레이닝 자금이 부족합니다! (필요 금액: ₩${trainingCost.toLocaleString()})`);
      return;
    }

    sound.playCash();
    onUpdateMoney(state.money - trainingCost);

    const updated = state.trainees.map(t => {
      if (t.id === traineeId) {
        const currentVal = t[statType];
        let baseGain = Math.floor(Math.random() * 4) + 3; // +3 ~ +6
        
        // Facility & Manager 130%~150% Reward Bonus
        const facility = state.facilities[statType] || (statType === 'charisma' ? state.facilities.recording : state.facilities.rest);
        if (facility) {
          const level = facility.level || 1;
          const levelBonus = 1 + (level - 1) * 0.15;
          const managerBonus = facility.hasManager ? (1.3 + Math.random() * 0.2) : 1; // 130% ~ 150%
          baseGain = Math.max(1, Math.round(baseGain * levelBonus * managerBonus));
        }

        const newVal = Math.min(100, currentVal + baseGain);
        const actualGain = newVal - currentVal;
        const staminaCost = 15;
        const mentalCost = 10;
        
        return {
          ...t,
          [statType]: newVal,
          upkeep: t.upkeep + (actualGain * 5000), // Stat +1 => Upkeep +₩5,000
          stamina: Math.max(0, t.stamina - staminaCost),
          mental: Math.max(0, t.mental - mentalCost),
        };
      }
      return t;
    });
    onUpdateTrainees(updated);
  };

  // Dark Dancer (어둠의 무희) Action
  const handleDarkDancer = (traineeId: string) => {
    sound.playClick();
    if (onInspectTrainee) onInspectTrainee(traineeId);

    const trainee = state.trainees.find(t => t.id === traineeId);
    if (!trainee) return;

    if (trainee.stamina < 15 || trainee.mental < 15) {
      alert('연습생의 체력 또는 멘탈이 너무 낮아 어둠의 무희 활동을 진행할 수 없습니다! 휴식을 취하세요.');
      return;
    }

    // Trigger 10-second mysterious dark & sexy BGM effect
    bgmPlayer.playDarkDancerEffect();

    // 1. Dance stat gain: 1 ~ 1.5x higher than normal dance training (+3 ~ +6 -> 1.0~1.5x multiplier)
    const baseGain = Math.floor(Math.random() * 4) + 3;
    const multiplier = 1 + Math.random() * 0.5; // 1.0 ~ 1.5
    const danceGain = Math.round(baseGain * multiplier);

    // 2. Base Money Reward: ₩2,000,000
    let moneyReward = 2000000;
    let extraReward = 0;

    // Visual >= 80 bonus: visual * (₩3,000 ~ ₩30,000)
    if (trainee.visual >= 80) {
      const rate = Math.floor(Math.random() * 27001) + 3000; // 3000 ~ 30000
      extraReward = trainee.visual * rate;
      moneyReward += extraReward;
    }

    // 3. Base Mental Penalty: -30
    let mentalPenalty = 30;
    let staminaPenalty = 0;

    // 4. Scandal Chance: 25%
    const isScandal = Math.random() < 0.25;
    const currentScandalCount = trainee.scandalCount || 0;
    const newScandalCount = isScandal ? currentScandalCount + 1 : currentScandalCount;

    if (isScandal) {
      staminaPenalty += 50;
      mentalPenalty += 50; // Scandal causes additional -50 stamina and -50 mental
    }

    sound.playCash();

    const displayName = getTraineeDisplayName(trainee);

    // Update Trainee
    const updatedTrainees = state.trainees.map(t => {
      if (t.id === traineeId) {
        const currentDance = t.dance;
        const newDance = Math.min(100, currentDance + danceGain);
        const actualDanceGain = newDance - currentDance;
        return {
          ...t,
          dance: newDance,
          upkeep: t.upkeep + (actualDanceGain * 5000), // Stat +1 => Upkeep +₩5,000
          stamina: Math.max(0, t.stamina - staminaPenalty),
          mental: Math.max(0, t.mental - mentalPenalty),
          scandalCount: newScandalCount,
        };
      }
      return t;
    });

    onUpdateTrainees(updatedTrainees);
    onUpdateMoney(state.money + moneyReward);

    if (isScandal) {
      let newsTitle = `[스캔들] ${displayName} 밀회 파문`;
      let newsContent = `${displayName}(이)가 재벌 3세와 호텔에서 만남? 밀회 의혹 커져.`;

      if (newScandalCount >= 2) {
        newsContent = `${displayName}(이)가 재벌 3세와 늦은 밤 호텔에서 만남? 팜므파탈 리스트에 올라`;
      }

      const scandalNews: NewsItem = {
        id: `news_scandal_${Date.now()}`,
        week: state.week,
        type: 'SCANDAL',
        title: newsTitle,
        content: newsContent,
        isNegative: true,
      };

      if (onAddNews) {
        onAddNews(scandalNews);
      }

      const updatedTraineeObj = updatedTrainees.find(t => t.id === traineeId) || trainee;

      setScandalModalData({
        trainee: updatedTraineeObj,
        newsTitle,
        newsContent,
        danceGain,
        moneyReward,
        extraReward,
        scandalCount: newScandalCount,
      });
    } else {
      alert(
        `💃 [어둠의 무희 무대 완료!]\n` +
        `• 댄스 능력치 +${danceGain}\n` +
        `• 자금 보상: +₩${moneyReward.toLocaleString()}` + (extraReward > 0 ? ` (비주얼 보너스 ₩${extraReward.toLocaleString()} 포함)` : '') + `\n` +
        `• 멘탈 -30`
      );
    }
  };

  // Rest & Spa Action
  const handleRestAndSpa = (traineeId: string) => {
    if (onInspectTrainee) onInspectTrainee(traineeId);
    const cost = 1000000; // ₩1,000,000
    if (state.money < cost) {
      alert('자금이 부족합니다! (필요 자금: ₩1,000,000)');
      return;
    }

    sound.playCash();
    onUpdateMoney(state.money - cost);
    const updated = state.trainees.map(t => {
      if (t.id === traineeId) {
        return {
          ...t,
          stamina: Math.min(100, t.stamina + 30),
          mental: Math.min(100, t.mental + 30),
        };
      }
      return t;
    });
    onUpdateTrainees(updated);
  };

  // Scout Candidate with duplicate name prevention
  const handleScout = (candidateIndex: number) => {
    const scoutFee = 5000000; // 5,000,000 KRW
    if (state.money < scoutFee) {
      alert('스카우트 자금이 부족합니다! (필요 금액: ₩5,000,000)');
      return;
    }

    sound.playCash();
    sound.playLevelUp();
    onUpdateMoney(state.money - scoutFee);

    let candidate = scoutPool[candidateIndex];

    // Double-check against existing trainees to guarantee zero name duplicate
    const existingNames = getAllExistingNames(state.trainees);
    if (existingNames.has(candidate.name.trim())) {
      candidate = createUniqueCandidate(state.trainees, scoutPool, candidate.gender);
    }

    const newTrainee: Trainee = {
      ...candidate,
      id: `tr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      joinedWeek: state.week,
    };

    onUpdateTrainees([...state.trainees, newTrainee]);
    setScoutPool(scoutPool.filter((_, idx) => idx !== candidateIndex));
    if (onInspectTrainee) {
      onInspectTrainee(newTrainee.id);
    }
  };

  // Run new audition to discover 3 fresh unique trainees
  const handleRunAudition = () => {
    const auditionFee = 2000000; // ₩2,000,000
    if (state.money < auditionFee) {
      alert('오디션 개최 자금이 부족합니다! (필요 금액: ₩2,000,000)');
      return;
    }

    sound.playCash();
    sound.playLevelUp();
    onUpdateMoney(state.money - auditionFee);

    const newCandidates: Omit<Trainee, 'id' | 'joinedWeek'>[] = [];
    for (let i = 0; i < 3; i++) {
      const candidate = createUniqueCandidate(state.trainees, [...scoutPool, ...newCandidates]);
      newCandidates.push(candidate);
    }

    setScoutPool(prev => [...prev, ...newCandidates]);
  };

  // Scout Special Trainee (기본 능력치 80+, 에이스 능력치 88~92, 개인 팬덤 300~1900명)
  const handleSpecialScout = (candidateIndex: number) => {
    let candidate = specialScoutPool[candidateIndex];
    if (!candidate) return;
    const scoutFee = candidate.scoutCost || 10000000;

    if (state.money < scoutFee) {
      alert(`특별 연습생 스카우트 자금이 부족합니다! (필요 금액: ₩${scoutFee.toLocaleString()})`);
      return;
    }

    sound.playCash();
    sound.playLevelUp();
    onUpdateMoney(state.money - scoutFee);

    const existingNames = getAllExistingNames(state.trainees);
    if (existingNames.has(candidate.name.trim())) {
      candidate = createSpecialCandidate(state.trainees, specialScoutPool, candidate.gender);
    }

    const newTrainee: Trainee = {
      ...candidate,
      id: `tr_sp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      joinedWeek: state.week,
    };

    onUpdateTrainees([...state.trainees, newTrainee]);
    setSpecialScoutPool(prev => prev.filter((_, idx) => idx !== candidateIndex));
    if (onInspectTrainee) {
      onInspectTrainee(newTrainee.id);
    }
  };

  // Search/refresh special trainees
  const handleRunSpecialAudition = () => {
    const fee = 10000000; // ₩10,000,000
    if (state.money < fee) {
      alert('특별 연습생 탐색 자금이 부족합니다! (필요 금액: ₩10,000,000)');
      return;
    }

    sound.playCash();
    sound.playLevelUp();
    onUpdateMoney(state.money - fee);

    const newCandidates: Omit<Trainee, 'id' | 'joinedWeek'>[] = [];
    for (let i = 0; i < 3; i++) {
      const candidate = createSpecialCandidate(state.trainees, [...specialScoutPool, ...newCandidates]);
      newCandidates.push(candidate);
    }

    setSpecialScoutPool(prev => [...prev, ...newCandidates]);
  };

  // Set Stage Name (예명)
  const handleSetStageName = (trainee: Trainee) => {
    sound.playClick();
    const currentStageName = trainee.stageName || '';
    const input = prompt(
      `'${trainee.name}'의 예명을 입력하세요.\n(예명을 작성하면 원래 이름 대신 예명으로 표기됩니다. 빈칸 입력 시 원래 이름으로 복원됩니다)\n* 현존 연예인의 이름은 사용할 수 없습니다.`,
      currentStageName
    );
    if (input !== null) {
      let newStageName = input.trim();

      if (newStageName.includes('윤도현')) {
        newStageName = newStageName.replace(/윤도현/g, '윤도헌');
        alert("⚠️ '윤도현'은 현존 연예인 이름 규칙에 따라 '윤도헌'으로 변경되었습니다.");
      } else if (newStageName && isCelebrityName(newStageName)) {
        alert(`⚠️ '${newStageName}'은(는) 현존 연예인의 이름으로 사용할 수 없습니다.\n다른 예명을 작성해 주세요.`);
        return;
      }

      const updated = state.trainees.map(t =>
        t.id === trainee.id ? { ...t, stageName: newStageName || undefined } : t
      );
      onUpdateTrainees(updated);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase mb-1">
            <Users className="w-4 h-4" />
            <span>Roster & Trainee Management</span>
          </div>
          <h2 className="text-xl font-bold text-white">연습생 트레이닝 & 프로필 관리</h2>
          <p className="text-xs text-slate-400 mt-1">
            연습생의 프로필 이미지를 등록(JPG, PNG, GIF)하고, 스킬 육성 및 체력/멘탈을 케어하세요.
          </p>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setShowScoutModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>신규 연습생 스카우트 (₩5,000,000)</span>
          </button>

          <button
            onClick={() => {
              sound.playClick();
              if (specialScoutPool.length === 0) {
                const initPool: Omit<Trainee, 'id' | 'joinedWeek'>[] = [];
                for (let i = 0; i < 3; i++) {
                  initPool.push(createSpecialCandidate(state.trainees, initPool));
                }
                setSpecialScoutPool(initPool);
              }
              setShowSpecialScoutModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:from-amber-400 hover:via-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2 cursor-pointer border border-amber-400/40"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>★ 특별 연습생 스카우트 (₩10M ~ ₩100M)</span>
          </button>
        </div>
      </div>

      {/* Trainees List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.trainees.map(t => {
          const isDanger = t.stamina <= 80 || t.mental <= 80;
          return (
            <div
              key={t.id}
              onClick={() => {
                if (onInspectTrainee) onInspectTrainee(t.id);
              }}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition relative overflow-hidden ${
                isDanger ? 'border-rose-800/80 bg-slate-900/90' : 'border-slate-800'
              }`}
            >
              {/* Hidden File Input for Trainee Profile Picture */}
              <input
                type="file"
                ref={(el) => (fileInputRefs.current[t.id] = el)}
                onChange={(e) => handleImageUpload(t.id, e)}
                accept="image/jpeg,image/png,image/gif"
                className="hidden"
              />

              {/* Header Info */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-4">
                  {/* Left Column: Enlarged Avatar Icon + Release Button directly underneath */}
                  <div className="flex flex-col items-center shrink-0 w-28 sm:w-32">
                    {/* Enlarged Avatar Icon (2x size: w-28 h-28 / 112px x 112px) with Breathing Motion & Paint / Image Upload click */}
                    {(() => {
                      const chartRank = getTraineeChartRank(t, state);
                      const auraClasses = getChartAuraClasses(chartRank);

                      return (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onInspectTrainee) onInspectTrainee(t.id);
                            setEditingPaintTraineeId(t.id);
                          }}
                          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl relative overflow-hidden shrink-0 group border-2 border-slate-700 hover:border-cyan-400 transition cursor-pointer shadow-xl bg-slate-950 flex items-center justify-center ${auraClasses}`}
                          title="아이콘을 눌러 직접 그림을 그리거나(그림판) 이미지(JPG, PNG, GIF)를 삽입하세요"
                        >
                          {t.profileImage ? (
                            <img
                              src={t.profileImage}
                              alt={t.name}
                              className="w-full h-full object-cover animate-breathing"
                            />
                          ) : (
                            <div className={`w-full h-full ${t.avatarBg} flex flex-col items-center justify-center font-bold text-white shadow-lg animate-breathing`}>
                              <span className="text-3xl sm:text-4xl">{t.name.slice(0, 1)}</span>
                              <span className="text-[10px] text-white/90 bg-black/40 px-2 py-0.5 rounded-full mt-1 backdrop-blur-xs font-normal">
                                그림판 / 사진
                              </span>
                            </div>
                          )}

                          {/* Animated GIF Badge */}
                          {isGifImage(t.profileImage) && (
                            <div className="absolute top-1 right-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-0.5 border border-white/30 animate-pulse z-10">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>움짤 GIF</span>
                            </div>
                          )}

                          {/* Top 8 Chart Rank Crown Badge */}
                          {chartRank !== null && (
                            <div className="absolute top-1 left-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-md flex items-center space-x-1 z-10">
                              <span>👑</span>
                              <span>차트 {chartRank}위</span>
                            </div>
                          )}

                          {/* Hover Overlay indicating click to draw/insert image */}
                          <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold p-2 text-center">
                            <Palette className="w-6 h-6 mb-1 text-cyan-300 animate-bounce" />
                            <span>그림판 & 이미지</span>
                            <span className="text-[9px] font-normal text-slate-300 mt-0.5">그리기 / 파일 업로드</span>
                          </div>

                          {/* Image indicator badge */}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-cyan-300 p-1 rounded-lg border border-slate-700 shadow backdrop-blur-xs">
                            <Palette className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      );
                    })()}

                    {/* 방출 버튼 (연습생 이미지 바로 아래) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onInspectTrainee) onInspectTrainee(t.id);
                        sound.playClick();
                        setReleaseTargetTrainee(t);
                      }}
                      className="w-full mt-2 py-1 px-2 bg-gradient-to-r from-rose-950/90 to-red-950/90 hover:from-rose-900 hover:to-red-900 border border-rose-700/60 hover:border-rose-500 text-rose-300 hover:text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95"
                      title="아이돌 방출 또는 주급 50% 삭감 재계약"
                    >
                      <UserMinus className="w-3.5 h-3.5 text-rose-400" />
                      <span>방출</span>
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="font-bold text-white text-lg">{getTraineeDisplayName(t)}</h3>
                      {t.stageName && (
                        <span className="text-[10px] text-slate-400 font-normal">(본명: {t.name})</span>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetStageName(t);
                        }}
                        className="text-[10px] bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800 flex items-center space-x-1 font-semibold transition"
                        title="아이돌 예명 작성/수정"
                      >
                        <Tag className="w-3 h-3" />
                        <span>예명 {t.stageName ? '수정' : '작성'}</span>
                      </button>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {t.age}세 / {t.gender === 'FEMALE' ? '여성' : '남성'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.personality}</p>
                    <div className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-3 flex-wrap">
                      <span>주급(Upkeep): ₩{t.upkeep.toLocaleString()} / 주</span>
                      <span className="text-pink-300 font-bold bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">💖 개인 팬덤: {(t.fandom || 0).toLocaleString()} 명</span>
                    </div>
                    
                    {/* Image Status indicator & GIF sample quick apply */}
                    <div className="mt-2 flex items-center space-x-2 flex-wrap gap-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectTrainee) onInspectTrainee(t.id);
                          fileInputRefs.current[t.id]?.click();
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t.profileImage ? '이미지 교체 (JPG/PNG/GIF)' : '프로필 이미지 등록하기'}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onInspectTrainee) onInspectTrainee(t.id);
                          const randomGif = PRESET_SAMPLE_GIFS[Math.floor(Math.random() * PRESET_SAMPLE_GIFS.length)];
                          const updated = state.trainees.map(tr => tr.id === t.id ? { ...tr, profileImage: randomGif.url } : tr);
                          onUpdateTrainees(updated);
                          sound.playClick();
                        }}
                        className="text-[10px] text-pink-300 hover:text-pink-200 bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-bold transition cursor-pointer"
                        title="랜덤 K-POP 움짤(GIF) 즉시 무대에 적용하기"
                      >
                        <Sparkles className="w-3 h-3 text-pink-400" />
                        <span>🎞️ 움짤(GIF) 적용</span>
                      </button>
                    </div>
                  </div>
                </div>

                {isDanger && (
                  <span className="flex items-center space-x-1 text-[10px] font-bold bg-rose-500/20 text-rose-300 px-2 py-1 rounded-lg border border-rose-500/30 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>휴식 필요!</span>
                  </span>
                )}
              </div>

              {/* Stats Bars Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 my-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                {/* Vocal */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Mic className="w-3 h-3 text-cyan-400" /> 보컬</span>
                    <span className="font-bold text-cyan-300">{t.vocal} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-400 transition-all" style={{ width: `${t.vocal}%` }} />
                  </div>
                </div>

                {/* Dance */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Flame className="w-3 h-3 text-pink-400" /> 댄스</span>
                    <span className="font-bold text-pink-300">{t.dance} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-pink-400 transition-all" style={{ width: `${t.dance}%` }} />
                  </div>
                </div>

                {/* Charisma */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Zap className="w-3 h-3 text-amber-400" /> 카리스마</span>
                    <span className="font-bold text-amber-300">{t.charisma} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 transition-all" style={{ width: `${t.charisma}%` }} />
                  </div>
                </div>

                {/* Visual */}
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400 flex items-center gap-1"><Heart className="w-3 h-3 text-purple-400" /> 비주얼</span>
                    <span className="font-bold text-purple-300">{t.visual} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-400 transition-all" style={{ width: `${t.visual}%` }} />
                  </div>
                </div>

                {/* Stamina Condition */}
                <div className="col-span-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">⚡ 체력 (Stamina)</span>
                    <span className={`font-bold ${t.stamina <= 80 ? 'text-rose-400' : 'text-emerald-300'}`}>{t.stamina} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${t.stamina <= 80 ? 'bg-rose-500' : 'bg-emerald-400'}`} style={{ width: `${t.stamina}%` }} />
                  </div>
                </div>

                {/* Mental Condition */}
                <div className="col-span-1">
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">🧠 멘탈 (Mental)</span>
                    <span className={`font-bold ${t.mental <= 80 ? 'text-rose-400' : 'text-purple-300'}`}>{t.mental} / 100</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${t.mental <= 80 ? 'bg-rose-500' : 'bg-purple-400'}`} style={{ width: `${t.mental}%` }} />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 pt-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrain(t.id, 'vocal');
                  }}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] font-semibold transition border border-slate-700 text-center flex flex-col items-center justify-center cursor-pointer"
                  title={`보컬 레슨 (트레이닝비: ₩${getTrainingCost('vocal').toLocaleString()})`}
                >
                  <span>보컬 레슨</span>
                  <span className="text-[9px] text-cyan-400/80 font-normal">₩{(getTrainingCost('vocal') / 10000).toLocaleString()}만</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrain(t.id, 'dance');
                  }}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-pink-300 rounded-lg text-[11px] font-semibold transition border border-slate-700 text-center flex flex-col items-center justify-center cursor-pointer"
                  title={`댄스 트레이닝 (트레이닝비: ₩${getTrainingCost('dance').toLocaleString()})`}
                >
                  <span>댄스 트레이닝</span>
                  <span className="text-[9px] text-pink-400/80 font-normal">₩{(getTrainingCost('dance') / 10000).toLocaleString()}만</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrain(t.id, 'charisma');
                  }}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-lg text-[11px] font-semibold transition border border-slate-700 text-center flex flex-col items-center justify-center cursor-pointer"
                  title={`카리스마 (트레이닝비: ₩${getTrainingCost('charisma').toLocaleString()})`}
                >
                  <span>카리스마</span>
                  <span className="text-[9px] text-amber-400/80 font-normal">₩{(getTrainingCost('charisma') / 10000).toLocaleString()}만</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrain(t.id, 'visual');
                  }}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[11px] font-semibold transition border border-slate-700 text-center flex flex-col items-center justify-center cursor-pointer"
                  title={`비주얼/스타일 (트레이닝비: ₩${getTrainingCost('visual').toLocaleString()})`}
                >
                  <span>비주얼/스타일</span>
                  <span className="text-[9px] text-purple-400/80 font-normal">₩{(getTrainingCost('visual') / 10000).toLocaleString()}만</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDarkDancer(t.id);
                  }}
                  className="py-1.5 bg-purple-950/90 hover:bg-purple-900 text-purple-200 rounded-lg text-[11px] font-bold transition border border-purple-800 text-center flex items-center justify-center space-x-1 shadow-sm"
                  title="어둠의 무희 (댄스 1~1.5배, 기본 200만원+비주얼80↑ 보너스, 멘탈 -30, 25% 스캔들 확률)"
                >
                  <Moon className="w-3 h-3 text-purple-400 shrink-0" />
                  <span>어둠의 무희</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRestAndSpa(t.id);
                  }}
                  className="py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 rounded-lg text-[11px] font-bold transition border border-rose-800 text-center flex items-center justify-center space-x-1"
                  title="스파 & 케어 (체력/멘탈 +30 회복, 비용: ₩1,000,000)"
                >
                  <Coffee className="w-3 h-3 shrink-0" />
                  <span>스파 휴식</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Scout Modal */}
      {showScoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 relative">
            <button
              onClick={() => setShowScoutModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <UserPlus className="w-5 h-5 text-cyan-400" />
                  <span>신규 연습생 스카우트 센터</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  스카우트 비용 ₩5,000,000 지불 후 기획사의 새로운 신인으로 영입할 수 있습니다.
                </p>
              </div>

              <button
                onClick={handleRunAudition}
                className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center space-x-1.5 shrink-0 cursor-pointer"
                title="₩2,000,000을 지불하여 중복 없는 신규 연습생 3명을 새로 발굴합니다"
              >
                <Sparkles className="w-4 h-4 text-pink-300" />
                <span>공개 오디션 개최 (₩2M)</span>
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scoutPool.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">스카우트 가능한 영입 후보가 없습니다.</p>
              ) : (
                scoutPool.map((c, idx) => (
                  <div key={idx} className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white text-sm">{c.name} ({c.age}세)</div>
                      <div className="text-xs text-slate-400">{c.personality}</div>
                      <div className="flex space-x-3 text-[11px] text-slate-300 mt-2">
                        <span>보컬: {c.vocal}</span>
                        <span>댄스: {c.dance}</span>
                        <span>카리스마: {c.charisma}</span>
                        <span>비주얼: {c.visual}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleScout(idx)}
                      className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition shadow-md shadow-cyan-600/20 shrink-0"
                    >
                      영입하기 (₩5M)
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Special Scout Modal */}
      {showSpecialScoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-amber-900/50 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-gradient-to-r from-amber-500 via-pink-500 to-purple-600 rounded-xl text-slate-950 font-bold shadow-lg shadow-amber-500/20">
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <span>★ 특별 연습생 스카우트</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-extrabold tracking-wide">
                      ALL STATS 80+ / ACE 88~92
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    기본 능력치 80 이상, 에이스 능력치(88~92), 개인 팬덤(300~1900명)을 보유한 최정상 영입 인재
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSpecialScoutModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Money & Audition Button */}
            <div className="flex justify-between items-center text-xs bg-amber-950/40 border border-amber-800/40 p-3.5 rounded-xl text-amber-200">
              <span className="font-medium">
                💰 보유 자금: <strong className="text-amber-300 font-extrabold text-sm ml-1">₩{state.money.toLocaleString()}</strong>
              </span>
              <button
                onClick={handleRunSpecialAudition}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white font-extrabold rounded-xl transition flex items-center space-x-1.5 shadow-md shadow-amber-500/20 cursor-pointer border border-amber-300/40"
                title="₩10,000,000을 지불하여 특별 연습생 3명을 추가 탐색합니다"
              >
                <Sparkles className="w-4 h-4 text-amber-200 animate-spin" style={{ animationDuration: '4s' }} />
                <span>특별 오디션 개최 (₩10M)</span>
              </button>
            </div>

            {/* Candidates List */}
            <div className="space-y-3.5 max-h-[26rem] overflow-y-auto pr-1">
              {specialScoutPool.length === 0 ? (
                <p className="text-xs text-slate-500 py-10 text-center">스카우트 가능한 특별 연습생 후보가 없습니다.</p>
              ) : (
                specialScoutPool.map((c, idx) => {
                  const cost = c.scoutCost || 10000000;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-950/80 border border-amber-500/40 hover:border-amber-400/80 rounded-2xl p-4 transition shadow-lg space-y-3 relative overflow-hidden group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-white text-base">{c.name}</span>
                            <span className="text-xs text-slate-400">({c.age}세 / {c.gender === 'FEMALE' ? '여성' : '남성'})</span>
                            <span className="text-[10px] bg-gradient-to-r from-amber-500 to-pink-500 text-slate-950 font-black px-2 py-0.5 rounded-full shadow">
                              SPECIAL
                            </span>
                          </div>
                          <div className="text-xs text-slate-300 font-medium mt-1">{c.personality}</div>
                          <div className="flex flex-wrap items-center gap-3 text-xs mt-2">
                            <span className="text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                              💵 주급: ₩{c.upkeep.toLocaleString()} / 주
                            </span>
                            <span className="text-pink-300 font-bold bg-pink-950/80 px-2.5 py-1 rounded-lg border border-pink-800/60">
                              💖 개인 팬덤: {(c.fandom || 0).toLocaleString()} 명
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => handleSpecialScout(idx)}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-pink-600 to-purple-600 hover:from-amber-400 hover:to-purple-500 text-white rounded-xl text-xs font-extrabold transition shadow-lg shadow-amber-500/30 shrink-0 cursor-pointer border border-amber-300/50"
                        >
                          영입하기 (₩{(cost / 10000).toLocaleString()}만)
                        </button>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
                        <div className={`p-2 rounded-xl border text-center transition ${c.vocal >= 88 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-md' : 'bg-slate-900/90 border-slate-800 text-slate-300'}`}>
                          보컬: <strong className={c.vocal >= 88 ? 'text-amber-300 text-sm' : 'text-cyan-300 font-bold'}>{c.vocal}</strong> {c.vocal >= 88 && '👑'}
                        </div>
                        <div className={`p-2 rounded-xl border text-center transition ${c.dance >= 88 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-md' : 'bg-slate-900/90 border-slate-800 text-slate-300'}`}>
                          댄스: <strong className={c.dance >= 88 ? 'text-amber-300 text-sm' : 'text-cyan-300 font-bold'}>{c.dance}</strong> {c.dance >= 88 && '👑'}
                        </div>
                        <div className={`p-2 rounded-xl border text-center transition ${c.charisma >= 88 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-md' : 'bg-slate-900/90 border-slate-800 text-slate-300'}`}>
                          카리스마: <strong className={c.charisma >= 88 ? 'text-amber-300 text-sm' : 'text-cyan-300 font-bold'}>{c.charisma}</strong> {c.charisma >= 88 && '👑'}
                        </div>
                        <div className={`p-2 rounded-xl border text-center transition ${c.visual >= 88 ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-extrabold shadow-md' : 'bg-slate-900/90 border-slate-800 text-slate-300'}`}>
                          비주얼: <strong className={c.visual >= 88 ? 'text-amber-300 text-sm' : 'text-cyan-300 font-bold'}>{c.visual}</strong> {c.visual >= 88 && '👑'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Paint Modal */}
      {editingPaintTraineeId && (() => {
        const trainee = state.trainees.find(t => t.id === editingPaintTraineeId);
        if (!trainee) return null;
        return (
          <PaintModal
            traineeName={trainee.name}
            initialImage={trainee.profileImage}
            onSave={(imageDataUrl) => {
              const updated = state.trainees.map(t =>
                t.id === trainee.id ? { ...t, profileImage: imageDataUrl } : t
              );
              onUpdateTrainees(updated);
              if (onInspectTrainee) {
                onInspectTrainee(trainee.id);
              }
              setEditingPaintTraineeId(null);
            }}
            onClose={() => setEditingPaintTraineeId(null)}
          />
        );
      })()}

      {/* Scandal Modal */}
      {scandalModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-600/70 rounded-2xl max-w-md w-full p-6 text-center shadow-[0_0_50px_rgba(225,29,72,0.4)] relative overflow-hidden">
            {/* Background Decorative Ambient Light */}
            <div className={`absolute -top-20 -left-20 w-56 h-56 bg-rose-600/20 rounded-full blur-3xl transition-opacity duration-1000 ${alarmEffectActive ? 'opacity-100' : 'opacity-20'}`} />
            <div className={`absolute -bottom-20 -right-20 w-56 h-56 bg-pink-600/20 rounded-full blur-3xl transition-opacity duration-1000 ${alarmEffectActive ? 'opacity-100' : 'opacity-20'}`} />

            {/* Header Badge */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-red-950/80 border border-red-700/80 rounded-full text-red-400 text-xs font-extrabold tracking-wider mb-2 uppercase shadow-sm">
              <Siren className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
              <span>실시간 연예 가십 속보</span>
            </div>

            {/* Avatar Image Container with Pink Glow & Red Alarm Animation */}
            <div className="relative flex items-center justify-center my-6">
              {/* Pink Glow Aura (약간 분홍빛 후광) */}
              <div
                className={`absolute w-40 h-40 rounded-full bg-pink-500/50 blur-2xl transition-all duration-1000 pointer-events-none ${
                  alarmEffectActive ? 'opacity-100 scale-125 animate-pulse' : 'opacity-0 scale-90'
                }`}
              />

              {/* Idol Avatar Frame (반투명 이미지) */}
              <div
                className={`relative w-36 h-36 rounded-full overflow-hidden border-2 transition-all duration-1000 shadow-2xl z-10 ${
                  alarmEffectActive
                    ? 'border-pink-400/90 shadow-[0_0_35px_rgba(244,114,182,0.85)] opacity-80'
                    : 'border-slate-700 opacity-90'
                }`}
              >
                <img
                  src={scandalModalData.trainee.profileImage || scandalModalData.trainee.avatar}
                  alt={scandalModalData.trainee.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-pink-950/20 mix-blend-color-burn" />
              </div>

              {/* Top-Right Red Alarm Animation (우측 상단 붉은 경보 애니메이션 5회 깜빡임) */}
              {alarmEffectActive && (
                <div className="absolute top-0 right-1/4 translate-x-3 -translate-y-2 z-20">
                  <motion.div
                    initial={{ opacity: 1, scale: 1 }}
                    animate={{
                      opacity: [1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1, 0.1, 1],
                      scale: [1, 1.25, 1, 1.25, 1, 1.25, 1, 1.25, 1, 1.25, 1]
                    }}
                    transition={{ duration: 2.5, ease: "easeInOut" }}
                    className="relative inline-flex rounded-full h-11 w-11 bg-red-600 border-2 border-white items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.9)]"
                  >
                    <Siren className="w-6 h-6 text-white" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Article Headline & Content */}
            <div className="space-y-2 mb-6 text-left bg-slate-950/70 p-4 rounded-xl border border-rose-900/50 shadow-inner">
              <div className="text-base font-extrabold text-rose-300 flex items-center space-x-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{scandalModalData.newsTitle}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-medium pt-1">
                "{scandalModalData.newsContent}"
              </p>
            </div>

            {/* Stat changes summary */}
            <div className="bg-red-950/40 border border-red-900/40 rounded-xl p-3 text-left text-xs space-y-1 text-slate-300 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">댄스 능력치:</span>
                <span className="text-emerald-400 font-bold">+{scandalModalData.danceGain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">자금 보상:</span>
                <span className="text-amber-300 font-bold">
                  +₩{scandalModalData.moneyReward.toLocaleString()}
                  {scandalModalData.extraReward > 0 && ` (비주얼 보너스 ₩${scandalModalData.extraReward.toLocaleString()} 포함)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">스캔들 피해:</span>
                <span className="text-rose-400 font-bold">체력 -50, 멘탈 -80 (기본 -30 + 스캔들 -50)</span>
              </div>
              {scandalModalData.scandalCount >= 2 && (
                <div className="flex justify-between pt-1 border-t border-red-900/40 text-purple-300 font-bold">
                  <span>누적 스캔들:</span>
                  <span>{scandalModalData.scandalCount}회 (팜므파탈 리스트 등재)</span>
                </div>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={() => setScandalModalData(null)}
              className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-bold rounded-xl transition shadow-lg shadow-rose-900/40 text-sm cursor-pointer"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* Trainee Release & Renegotiation Selection Modal */}
      {releaseTargetTrainee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-rose-950/50 to-slate-900 border-b border-slate-800 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">아이돌 방출 & 계약 심사</h3>
                  <p className="text-xs text-slate-400">재계약 협상 또는 기획사 퇴소 조치</p>
                </div>
              </div>
              <button
                onClick={() => setReleaseTargetTrainee(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trainee Brief Card */}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0">
                  {releaseTargetTrainee.profileImage ? (
                    <img
                      src={releaseTargetTrainee.profileImage}
                      alt={releaseTargetTrainee.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full ${releaseTargetTrainee.avatarBg} flex items-center justify-center font-bold text-white text-xl`}>
                      {releaseTargetTrainee.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-white text-base">
                      {getTraineeDisplayName(releaseTargetTrainee)}
                    </span>
                    {releaseTargetTrainee.stageName && (
                      <span className="text-xs text-slate-400">({releaseTargetTrainee.name})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 flex-wrap">
                    {(() => {
                      const group = state.groups.find(g => g.id === releaseTargetTrainee.groupId || g.memberIds.includes(releaseTargetTrainee.id));
                      return group ? (
                        <span className="text-purple-300 font-semibold bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/60">
                          소속 그룹: {group.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          연습생
                        </span>
                      );
                    })()}
                    <span className="text-pink-300">팬덤: {(releaseTargetTrainee.fandom || 0).toLocaleString()}명</span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                      (releaseTargetTrainee.salaryCutCount || 0) >= 1
                        ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      주급 삭감 이력: {(releaseTargetTrainee.salaryCutCount || 0)} / 2회
                    </span>
                  </div>
                  <div className="text-xs text-amber-300 font-bold mt-1">
                    현재 주급: ₩{releaseTargetTrainee.upkeep.toLocaleString()} / 주
                  </div>
                </div>
              </div>

              {/* Warning banner when salary cut is already 1 */}
              {(releaseTargetTrainee.salaryCutCount || 0) >= 1 && (
                <div className="bg-rose-950/70 border border-rose-600/80 rounded-xl p-3 text-xs text-rose-200 flex items-start gap-2.5 shadow-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
                  <div className="leading-relaxed">
                    <strong className="text-rose-100 block mb-0.5">⚠️ 자진 방출 위험 (누적 2회차 도달)</strong>
                    이미 주급 50% 삭감이 1회 누적된 상태입니다. 이번에 다시 주급 50% 삭감을 결정하면, 해당 아이돌은 <span className="text-yellow-300 font-black">"다른 기획사를 알아 보겠어요."</span>라며 재계약을 거부하고 <span className="text-rose-300 font-extrabold underline">스스로 기획사를 떠납니다(자진 방출)</span>!
                  </div>
                </div>
              )}

              {/* 2 Options */}
              <div className="space-y-3 pt-1">
                {/* Option 1: 주급을 50%로 감소시켜 재계약을 시도한다. */}
                <button
                  onClick={() => handleRenegotiateSalary(releaseTargetTrainee)}
                  className={`w-full text-left p-4 rounded-xl transition shadow group cursor-pointer border ${
                    (releaseTargetTrainee.salaryCutCount || 0) >= 1
                      ? 'bg-gradient-to-r from-amber-950/70 to-rose-950/70 hover:from-amber-900/80 hover:to-rose-900/80 border-amber-600/80 hover:border-amber-400'
                      : 'bg-gradient-to-r from-cyan-950/60 to-slate-900 hover:from-cyan-900/60 hover:to-slate-800 border-cyan-800/60 hover:border-cyan-500'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-lg group-hover:scale-110 transition shrink-0 mt-0.5 border ${
                      (releaseTargetTrainee.salaryCutCount || 0) >= 1
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    }`}>
                      <DollarSign className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-cyan-200 group-hover:text-cyan-100 flex items-center justify-between">
                        <span>
                          {(releaseTargetTrainee.salaryCutCount || 0) >= 1
                            ? '주급을 50%로 감소시켜 재계약을 시도한다. (2회 누적 시도)'
                            : '주급을 50%로 감소시켜 재계약을 시도한다.'}
                        </span>
                        <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${
                          (releaseTargetTrainee.salaryCutCount || 0) >= 1
                            ? 'bg-rose-950 text-rose-300 border-rose-600 animate-pulse'
                            : 'bg-cyan-950 text-cyan-400 border-cyan-700/60'
                        }`}>
                          {(releaseTargetTrainee.salaryCutCount || 0) >= 1 ? '자진 방출 발생' : '50% 절감 (1회)'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        {(releaseTargetTrainee.salaryCutCount || 0) >= 1 ? (
                          <span className="text-rose-200">
                            2번째 주급 50% 삭감 요구로, 아이돌이 <strong className="text-yellow-300 font-bold">"다른 기획사를 알아 보겠어요."</strong>라며 재계약을 단호히 거부하고 스스로 기획사를 떠납니다.
                          </span>
                        ) : (
                          <span>
                            주급을 기존 ₩{releaseTargetTrainee.upkeep.toLocaleString()}에서 <span className="text-cyan-300 font-bold">₩{Math.floor(releaseTargetTrainee.upkeep * 0.5).toLocaleString()}</span>(으)로 삭감하여 고정 지출을 절감합니다. (누적 2회차 시 자진 방출)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </button>

                {/* Option 2: 기획사에서 방출시킨다. */}
                <button
                  onClick={() => handleDischargeTrainee(releaseTargetTrainee)}
                  className="w-full text-left p-4 bg-gradient-to-r from-rose-950/60 to-slate-900 hover:from-rose-900/60 hover:to-slate-800 border border-rose-800/60 hover:border-rose-500 rounded-xl transition shadow group cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 group-hover:scale-110 transition shrink-0 mt-0.5">
                      <UserX className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-sm text-rose-200 group-hover:text-rose-100 flex items-center justify-between">
                        <span>기획사에서 방출시킨다.</span>
                        <span className="text-xs text-rose-400 font-extrabold bg-rose-950 px-2 py-0.5 rounded border border-rose-700/60">
                          방출 조치
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                        기획사에서 즉시 방출합니다. <span className="text-rose-300 font-medium">소속되어 있던 그룹이 있을 경우 아이돌 {getTraineeDisplayName(releaseTargetTrainee)}의 방출로 그룹 이미지에 타격, 그룹의 인기와 순위가 하락합니다.</span>
                      </p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer Close */}
            <div className="bg-slate-950 border-t border-slate-800 p-3.5 flex justify-end">
              <button
                onClick={() => setReleaseTargetTrainee(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition cursor-pointer"
              >
                취소하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Discharge Breaking News / Article Popup Modal */}
      {dischargeNewsModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-950 text-slate-100 rounded-2xl border-2 border-red-700/80 shadow-[0_0_50px_rgba(239,68,68,0.35)] overflow-hidden">
            {/* Top Shock Alarm Header */}
            <div className="bg-gradient-to-r from-red-950 via-rose-900 to-red-950 border-b border-red-700 p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2 font-black text-rose-200 tracking-wider text-sm">
                <Siren className="w-5 h-5 text-red-400 animate-pulse" />
                <span>
                  {dischargeNewsModalData.isVoluntary
                    ? '[ 연예가 긴급 속보 / 계약 결렬 자진 탈퇴 ]'
                    : '[ 연예가 긴급 속보 / BREAKING NEWS ]'}
                </span>
              </div>
              <div className="text-[11px] text-rose-300 bg-red-950/80 px-2 py-0.5 rounded border border-red-600 font-mono">
                {state.week}주차 속보
              </div>
            </div>

            <div className="p-6 text-center">
              {/* Idol Avatar with Shock Frame */}
              <div className="relative mx-auto w-28 h-28 mb-4">
                <div className="w-full h-full rounded-2xl overflow-hidden border-2 border-rose-500 shadow-xl bg-slate-900">
                  {dischargeNewsModalData.trainee.profileImage ? (
                    <img
                      src={dischargeNewsModalData.trainee.profileImage}
                      alt={dischargeNewsModalData.trainee.name}
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                  ) : (
                    <div className={`w-full h-full ${dischargeNewsModalData.trainee.avatarBg} flex items-center justify-center font-bold text-white text-3xl`}>
                      {dischargeNewsModalData.trainee.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white shadow">
                  {dischargeNewsModalData.isVoluntary ? '자진 방출' : '방출'}
                </div>
              </div>

              {/* Speech bubble dialogue if voluntary departure */}
              {dischargeNewsModalData.quote && (
                <div className="mb-4 p-3.5 bg-gradient-to-r from-rose-950 via-red-950 to-rose-950 border-2 border-rose-500 rounded-2xl text-center shadow-lg relative animate-pulse">
                  <div className="text-[11px] font-bold text-rose-300 mb-0.5">💬 아이돌의 결별 발언</div>
                  <div className="text-base sm:text-lg font-black text-yellow-300 tracking-wide">
                    "{dischargeNewsModalData.quote}"
                  </div>
                </div>
              )}

              {/* Headline & Content */}
              <h3 className="text-lg font-black text-white mb-2 leading-snug">
                {dischargeNewsModalData.newsTitle}
              </h3>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-900/90 p-4 rounded-xl border border-red-900/40 text-left mb-4 font-medium">
                "{dischargeNewsModalData.newsContent}"
              </p>

              {/* Impact Breakdown */}
              <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3.5 text-xs text-left space-y-1.5 mb-5">
                <div className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  <span>{dischargeNewsModalData.isVoluntary ? '자진 방출 결과 및 파장:' : '방출 조치 결과 및 영향:'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>소속 상태:</span>
                  <span className="text-rose-400 font-bold">
                    {dischargeNewsModalData.isVoluntary ? '재계약 최종 거부 및 자진 탈퇴' : '기획사 전속계약 해지 (방출 완료)'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>주급 고정 지출:</span>
                  <span className="text-emerald-400 font-bold">+₩{dischargeNewsModalData.upkeepSaved.toLocaleString()} / 주 절감</span>
                </div>
                {dischargeNewsModalData.groupName && (
                  <>
                    <div className="flex justify-between text-slate-300">
                      <span>그룹 [{dischargeNewsModalData.groupName}] 이미지 & 평판:</span>
                      <span className="text-rose-400 font-bold">
                        {dischargeNewsModalData.isVoluntary ? '-20 (심각한 타격)' : '-15 (이미지 타격)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>그룹 인기 및 음원 차트:</span>
                      <span className="text-rose-400 font-bold">인기 급락 & 차트 순위 하락</span>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => setDischargeNewsModalData(null)}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-extrabold text-sm rounded-xl shadow-lg transition cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Renegotiate Success Toast */}
      {renegotiateSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-950/95 border border-emerald-500 text-emerald-100 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{renegotiateSuccessMessage}</span>
        </div>
      )}

    </div>
  );
};
