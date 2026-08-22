import React from 'react';
import { GameState } from '../types';
import { getChartRankBonusMultiplier } from '../utils/chartUtils';
import { Radio, Trophy, Disc, MessageSquare, Newspaper, Sparkles, Crown } from 'lucide-react';

interface ChartAndNewsViewProps {
  state: GameState;
}

export const ChartAndNewsView: React.FC<ChartAndNewsViewProps> = ({ state }) => {
  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-2 text-cyan-400 text-xs font-semibold uppercase mb-1">
          <Radio className="w-4 h-4 animate-pulse" />
          <span>Billboard & Melon Music Charts & Media Feed</span>
        </div>
        <h2 className="text-xl font-bold text-white">실시간 음원 차트 & 미디어 피드</h2>
        <p className="text-xs text-slate-400 mt-1">
          현재 K-Pop 실시간 음원 차트 순위 및 평론가 음반 리뷰, 언론 헤드라인을 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Billboard Top Chart (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>실시간 K-Pop 음원 차트 (TOP 10)</span>
            </h3>
            <span className="text-xs text-slate-400">기준: {state.week}주차</span>
          </div>

          <div className="space-y-2">
            {state.currentChart.map(song => {
              const bonusRatio = song.isUserGroup && song.rank <= 8 ? getChartRankBonusMultiplier(song.rank) : 0;

              return (
                <div
                  key={`${song.rank}_${song.title}`}
                  className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition ${
                    song.isUserGroup
                      ? 'bg-gradient-to-r from-pink-950/80 to-purple-950/80 border-pink-500 shadow-lg shadow-pink-500/10'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                      song.rank === 1
                        ? 'bg-amber-400 text-slate-950'
                        : song.rank === 2
                        ? 'bg-slate-300 text-slate-950'
                        : song.rank === 3
                        ? 'bg-amber-700 text-white'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {song.rank}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm flex items-center space-x-2">
                        <span>{song.title}</span>
                        {song.isUserGroup && (
                          <span className="text-[10px] bg-pink-500 text-white font-extrabold px-2 py-0.5 rounded-full">
                            소속 아티스트!
                          </span>
                        )}
                        {bonusRatio > 0 && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center space-x-0.5 animate-pulse">
                            <Crown className="w-3 h-3 shrink-0" />
                            <span>아이돌 후광 & 보상 +{Math.round(bonusRatio * 100)}%</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">{song.artist}</div>
                    </div>
                  </div>

                  <div className="text-right text-slate-400 text-[11px]">
                    <div>점수: <span className="font-bold text-cyan-300">{song.score}</span></div>
                    <div>차트 {song.weeksOnChart}주 연속 진입</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Music Critics & Album Reviews Feed (1 col) */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center space-x-2">
              <Disc className="w-4 h-4 text-pink-400" />
              <span>평론가 음반 리뷰 모음</span>
            </h3>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {state.albums.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">발매된 앨범이 없습니다.</p>
              ) : (
                state.albums.map(album => (
                  <div key={album.id} className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{album.groupName} - '{album.title}'</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        album.isSuccess ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {album.isSuccess ? '흥행 성공' : '흥행 무산'}
                      </span>
                    </div>
                    <p className="text-slate-300 italic text-[11px] leading-relaxed">
                      "{album.criticReview}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
