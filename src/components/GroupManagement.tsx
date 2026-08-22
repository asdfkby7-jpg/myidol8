import React, { useState, useEffect } from 'react';
import { GameState, Group, Trainee } from '../types';
import { ALBUM_CONCEPTS } from '../data/initialData';
import { getTraineeDisplayName } from '../utils/gameEngine';
import { getTraineeChartRank, getChartAuraClasses } from '../utils/chartUtils';
import { Sparkles, Users, Disc, Plus, Star, Check } from 'lucide-react';
import { sound } from '../utils/sound';

interface GroupManagementProps {
  state: GameState;
  onUpdateGroups: (groups: Group[], updatedTrainees: Trainee[]) => void;
  onOpenAlbumModalWithGroup?: (groupId: string) => void;
}

export const GroupManagement: React.FC<GroupManagementProps> = ({
  state,
  onUpdateGroups,
  onOpenAlbumModalWithGroup,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedConcept, setSelectedConcept] = useState(ALBUM_CONCEPTS[0].id);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);

  // Available trainees not yet in another group or solos
  const availableTrainees = state.trainees;

  const toggleSelectTrainee = (id: string) => {
    sound.playClick();
    if (selectedTraineeIds.includes(id)) {
      setSelectedTraineeIds(selectedTraineeIds.filter(i => i !== id));
    } else {
      setSelectedTraineeIds([...selectedTraineeIds, id]);
    }
  };

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('그룹명을 입력해주세요!');
      return;
    }
    if (selectedTraineeIds.length === 0) {
      alert('최소 1명 이상의 멤버를 선택해야 합니다!');
      return;
    }

    sound.playLevelUp();

    const perMemberInitialFandom = Math.floor(500 / (selectedTraineeIds.length || 1));

    const updatedTrainees = state.trainees.map(t => {
      if (selectedTraineeIds.includes(t.id)) {
        return {
          ...t,
          groupId: `grp_${Date.now()}`,
          fandom: (t.fandom || 0) + perMemberInitialFandom,
          status: 'DEBUTED' as const,
        };
      }
      return t;
    });

    const groupMembers = updatedTrainees.filter(t => selectedTraineeIds.includes(t.id));
    const groupFandomSum = groupMembers.reduce((sum, m) => sum + (m.fandom || 0), 0);

    const newGroup: Group = {
      id: `grp_${Date.now()}`,
      name: groupName.trim(),
      memberIds: selectedTraineeIds,
      concept: selectedConcept,
      debutWeek: state.week,
      fandom: groupFandomSum,
      totalAlbumSales: 0,
      reputation: 20,
    };

    onUpdateGroups([...state.groups, newGroup], updatedTrainees);
    setShowCreateModal(false);
    setGroupName('');
    setSelectedTraineeIds([]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-purple-400 text-xs font-semibold uppercase mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Group Debut & Roster</span>
          </div>
          <h2 className="text-xl font-bold text-white">아티스트 & 데뷔 그룹 결성</h2>
          <p className="text-xs text-slate-400 mt-1">
            소속 연습생들을 조합하여 신인 아이돌 그룹 및 솔로 아티스트로 정식 데뷔시키세요.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setShowCreateModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center space-x-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>신규 그룹 데뷔 결성</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {state.groups.length === 0 ? (
          <div className="col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center space-y-3">
            <Sparkles className="w-10 h-10 text-purple-400 mx-auto opacity-50" />
            <h3 className="font-bold text-slate-200 text-sm">아직 데뷔한 그룹이 없습니다.</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              우측 상단의 [신규 그룹 데뷔 결성] 버튼을 눌러 연습생들을 모아 아이돌 그룹을 데뷔시키세요!
            </p>
          </div>
        ) : (
          state.groups.map(g => {
            const members = state.trainees.filter(t => g.memberIds.includes(t.id));
            return (
              <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                      컨셉: {g.concept}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{g.name}</h3>
                    <p className="text-xs text-slate-400">{members.length}인조 그룹 | 데뷔 {g.debutWeek}주차</p>
                  </div>
                  <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    팬클럽 {g.fandom.toLocaleString()} 명
                  </span>
                </div>

                {/* Member avatars */}
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-400">소속 멤버 라인업:</div>
                  <div className="flex flex-wrap gap-2">
                    {members.map(m => {
                      const chartRank = getTraineeChartRank(m, state);
                      const auraClasses = getChartAuraClasses(chartRank);
                      return (
                        <div key={m.id} className={`flex items-center space-x-1.5 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 text-xs text-slate-200 relative ${auraClasses}`}>
                          <span className={`w-2 h-2 rounded-full ${m.avatarBg}`} />
                          <span className="font-medium">{getTraineeDisplayName(m)}</span>
                          <span className="text-[10px] text-pink-300 font-medium ml-1">({(m.fandom || 0).toLocaleString()}명)</span>
                          {chartRank !== null && (
                            <span className="text-[10px] text-amber-300 font-bold ml-1">👑{chartRank}위</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Group Stats */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-xl">
                  <div>총 음반 누적 판매량: <span className="font-bold text-cyan-300">{g.totalAlbumSales.toLocaleString()} 장</span></div>
                  <div>아티스트 인지도: <span className="font-bold text-amber-300">{g.reputation} / 100</span></div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span>신규 데뷔 그룹 결성</span>
            </h3>

            {/* Group Name input */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">그룹 / 솔로 아티스트 이름</label>
              <input
                type="text"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="예: 뉴청바지, 아이브로, 방탄청년단, 아스파"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            {/* Concept Choice */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">대표 아티스트 컨셉</label>
              <select
                value={selectedConcept}
                onChange={e => setSelectedConcept(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                {ALBUM_CONCEPTS.map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.desc}</option>
                ))}
              </select>
            </div>

            {/* Trainee Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">멤버 선택 (다중 선택 가능)</label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {availableTrainees.map(t => {
                  const isSelected = selectedTraineeIds.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={() => toggleSelectTrainee(t.id)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 text-white'
                          : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="font-bold">{getTraineeDisplayName(t)}</span> ({t.age}세)
                        <div className="text-[10px] text-slate-400">
                          보컬: {t.vocal} | 댄스: {t.dance} | 체력: {t.stamina} | 멘탈: {t.mental}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-purple-600/30"
              >
                데뷔 결성 완료
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
