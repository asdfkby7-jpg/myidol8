import { Trainee, GameState } from '../types';

/**
 * Returns the best chart rank (1~8) of the trainee's group in state.currentChart.
 * Returns null if not in top 8 or no song on chart.
 */
export function getTraineeChartRank(trainee: Trainee, state: GameState): number | null {
  if (!trainee.groupId) return null;
  const group = state.groups.find(g => g.id === trainee.groupId);
  if (!group) return null;

  // Find user songs in currentChart that belong to this group or album
  const chartSongs = state.currentChart.filter(
    s => s.isUserGroup && (
      s.artist === group.name || 
      (s.albumId && state.albums.find(a => a.id === s.albumId)?.groupId === group.id)
    )
  );

  if (chartSongs.length === 0) return null;

  const bestRank = Math.min(...chartSongs.map(s => s.rank));
  if (bestRank <= 8) {
    return bestRank;
  }
  return null;
}

/**
 * Calculates bonus multiplier (0.10 to 0.30) for chart rank 1~8.
 * Rank 1 = +30% (+0.30)
 * Rank 8 = +10% (+0.10)
 * Linear formula: 0.10 + (8 - rank) * (0.20 / 7)
 */
export function getChartRankBonusMultiplier(rank: number | null): number {
  if (!rank || rank < 1 || rank > 8) return 0;
  return 0.10 + (8 - rank) * (0.20 / 7);
}

/**
 * Calculates average/highest chart bonus for a list of participating trainees.
 */
export function getParticipantsChartBonusRatio(participants: Trainee[], state: GameState): {
  bonusRatio: number;
  bestRank: number | null;
} {
  let maxBonus = 0;
  let bestRank: number | null = null;

  participants.forEach(t => {
    const rank = getTraineeChartRank(t, state);
    if (rank !== null) {
      const bonus = getChartRankBonusMultiplier(rank);
      if (bonus > maxBonus) {
        maxBonus = bonus;
        bestRank = rank;
      }
    }
  });

  return { bonusRatio: maxBonus, bestRank };
}

/**
 * Returns Tailwind CSS classes for the top 8 chart aura effect on idol icons.
 * Rank 1~8 produces a subtle golden halo aura with pulse animation.
 */
export function getChartAuraClasses(rank: number | null): string {
  if (!rank || rank < 1 || rank > 8) return '';
  if (rank === 1) {
    return 'ring-2 ring-amber-300 shadow-[0_0_22px_rgba(251,191,36,0.95)] animate-pulse';
  } else if (rank <= 3) {
    return 'ring-2 ring-yellow-400 shadow-[0_0_18px_rgba(250,204,21,0.85)] animate-pulse';
  } else {
    return 'ring-2 ring-amber-400/80 shadow-[0_0_14px_rgba(251,191,36,0.7)]';
  }
}
