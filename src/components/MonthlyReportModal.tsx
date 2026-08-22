import React, { useState } from 'react';
import { MonthlyReportData } from '../types';
import { sound } from '../utils/sound';
import { FileText, TrendingUp, TrendingDown, Users, CheckCircle, AlertTriangle, ShieldCheck, DollarSign } from 'lucide-react';

interface MonthlyReportModalProps {
  data: MonthlyReportData;
  companyName: string;
  repName: string;
  onClose: () => void;
}

export const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({
  data,
  companyName,
  repName,
  onClose,
}) => {
  const [isApproved, setIsApproved] = useState(false);

  const handleApproveClick = () => {
    sound.playLevelUp();
    setIsApproved(true);
    setTimeout(() => {
      onClose();
    }, 700);
  };

  const formattedWeekTitle = `${data.year}년 ${data.month}월 ${data.weekOfMonth}주차 경영보고서`;
  const isLoss = data.lastMonthProfit < 0;

  // Render SVG Financial & Profit Graph
  const renderGraph = () => {
    const rawHistory = data.history && data.history.length > 0 ? data.history : [
      { year: data.year, month: Math.max(1, data.month - 1), money: 30000000, revenue: 0, expense: 0, netProfit: 0 }
    ];

    // 최근 6개월 데이터만 표기
    const history = rawHistory.slice(-6);

    const graphWidth = 540;
    const graphHeight = 160;
    const padding = 35;

    // Calculate max values for Y scaling
    const maxMoney = Math.max(...history.map(h => Math.abs(h.money)), 10000000);
    const maxProfitAbs = Math.max(...history.map(h => Math.abs(h.netProfit)), 1000000);

    const pointsCount = history.length;
    const stepX = pointsCount > 1 ? (graphWidth - padding * 2) / (pointsCount - 1) : 0;

    // Line points for Money
    const moneyPoints = history.map((h, i) => {
      const x = pointsCount === 1 ? graphWidth / 2 : padding + i * stepX;
      // Normalizing money (0 ~ maxMoney) to height
      const y = graphHeight - padding - (Math.max(0, h.money) / (maxMoney * 1.2)) * (graphHeight - padding * 2);
      return { x, y, val: h.money, label: `${h.year}년 ${h.month}월` };
    });

    const moneyPathD = moneyPoints.length === 1
      ? `M ${padding},${moneyPoints[0].y} L ${graphWidth - padding},${moneyPoints[0].y}`
      : moneyPoints.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x},${p.y}` : `${acc} L ${p.x},${p.y}`), '');

    return (
      <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700/60 shadow-inner my-3">
        <div className="flex items-center justify-between mb-2 text-xs">
          <div className="flex items-center gap-2 font-medium text-slate-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>매달 보유 자금 추이 및 순손익 변동 (최근 6개월)</span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-cyan-300 font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
              보유 자금 (₩)
            </span>
            <span className="flex items-center gap-1 text-emerald-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
              월 순이익
            </span>
            <span className="flex items-center gap-1 text-rose-400 font-semibold">
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block"></span>
              월 적자
            </span>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${graphWidth} ${graphHeight}`} className="w-full h-auto min-w-[480px]">
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={graphWidth - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
            <line x1={padding} y1={graphHeight / 2} x2={graphWidth - padding} y2={graphHeight / 2} stroke="#475569" strokeDasharray="2 2" />
            <line x1={padding} y1={graphHeight - padding} x2={graphWidth - padding} y2={graphHeight - padding} stroke="#334155" />

            {/* Net Profit Bars */}
            {history.map((h, i) => {
              const x = pointsCount === 1 ? graphWidth / 2 - 15 : padding + i * stepX - 12;
              const barWidth = 24;
              const zeroY = graphHeight - padding;
              const isPos = h.netProfit >= 0;
              const barHeight = Math.min(graphHeight - padding * 2, (Math.abs(h.netProfit) / (maxProfitAbs * 1.5)) * (graphHeight - padding * 2));
              const y = isPos ? zeroY - barHeight : zeroY - 4;

              return (
                <g key={`bar-${i}`}>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={Math.max(4, barHeight)}
                    rx={3}
                    fill={isPos ? '#10b981' : '#f43f5e'}
                    opacity={0.85}
                  />
                  {/* Profit Value Text on Bar */}
                  <text
                    x={x + barWidth / 2}
                    y={isPos ? Math.max(15, y - 4) : Math.min(graphHeight - 5, y + barHeight + 10)}
                    textAnchor="middle"
                    fill={isPos ? '#34d399' : '#f87171'}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {isPos ? `+${(h.netProfit / 10000).toFixed(0)}만` : `-${(Math.abs(h.netProfit) / 10000).toFixed(0)}만`}
                  </text>
                </g>
              );
            })}

            {/* Money Line Path */}
            <path d={moneyPathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" />

            {/* Money Points & Labels */}
            {moneyPoints.map((p, i) => (
              <g key={`point-${i}`}>
                <circle cx={p.x} cy={p.y} r="4.5" fill="#0891b2" stroke="#67e8f9" strokeWidth="2" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="bold">
                  {(p.val / 10000).toFixed(0)}만원
                </text>
                {/* Month Label */}
                <text x={p.x} y={graphHeight - 12} textAnchor="middle" fill="#94a3b8" fontSize="10">
                  {p.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto animate-fadeIn">
      {/* Official Clipboard Document Paper Frame */}
      <div className="relative w-full max-w-2xl bg-slate-950 text-slate-100 rounded-2xl border-2 border-slate-700 shadow-2xl overflow-hidden my-auto">
        
        {/* Top Metallic Board Clip Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-cyan-400 font-mono font-bold">
                {companyName || 'K-POP AGENCY'} OFFICIAL REPORT
              </div>
              <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                {formattedWeekTitle}
              </h2>
            </div>
          </div>

          {/* Top Right Approval Stamp Box (결재란) */}
          <div className="flex items-center border border-slate-600 rounded-lg overflow-hidden bg-slate-900 text-xs shadow-md">
            {/* 담당자 김나박 란 */}
            <div className="border-r border-slate-700 px-3 py-1.5 text-center bg-slate-800/80 min-w-[70px]">
              <div className="text-[10px] text-slate-400 font-semibold mb-1">담당자</div>
              <div className="font-serif italic font-bold text-amber-300 tracking-wider text-sm">
                김나박 ✍️
              </div>
            </div>

            {/* 대표이사 결재 란 */}
            <div className="px-3 py-1.5 text-center min-w-[85px] relative">
              <div className="text-[10px] text-slate-400 font-semibold mb-1">대표이사</div>
              {isApproved ? (
                <div className="text-rose-500 font-black text-xs border-2 border-rose-500 rounded px-1.5 py-0.5 transform -rotate-12 animate-bounce inline-block shadow-lg bg-rose-950/30">
                  결재승인 💮
                </div>
              ) : (
                <button
                  onClick={handleApproveClick}
                  className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded text-[11px] shadow-sm transition transform hover:scale-105 active:scale-95"
                >
                  결재
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Paper Document Inner Body */}
        <div className="p-5 md:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Executive Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400 font-medium">지난달 총 매출</div>
              <div className="text-sm md:text-base font-bold text-cyan-300 mt-1">
                +₩{(data.lastMonthRevenue || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
              <div className="text-[11px] text-slate-400 font-medium">지난달 총 지출</div>
              <div className="text-sm md:text-base font-bold text-rose-300 mt-1">
                -₩{(data.lastMonthExpense || 0).toLocaleString()}
              </div>
            </div>
            <div className={`bg-slate-900/90 border rounded-xl p-3 text-center ${isLoss ? 'border-rose-500/40' : 'border-emerald-500/40'}`}>
              <div className="text-[11px] text-slate-400 font-medium">지난달 순손익</div>
              <div className={`text-sm md:text-base font-extrabold mt-1 ${isLoss ? 'text-rose-400' : 'text-emerald-400'}`}>
                {data.lastMonthProfit >= 0 ? '+' : ''}₩{(data.lastMonthProfit || 0).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Management Advice Banner (Required for deficit/loss) */}
          {isLoss ? (
            <div className="bg-rose-950/50 border-l-4 border-rose-500 p-3.5 rounded-r-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-rose-200 leading-relaxed">
                <span className="font-bold text-rose-300 block mb-0.5">⚠️ 경영 진단 및 조언</span>
                지난달 <span className="font-bold text-white">₩{Math.abs(data.lastMonthProfit).toLocaleString()}</span>의 적자가 발생하였습니다.{' '}
                {data.topUpkeepTraineeName ? (
                  <>
                    주급이 가장 많은 아이돌 <span className="font-extrabold text-amber-300 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-600/40">'{data.topUpkeepTraineeName}'</span>
                    (주급 ₩{(data.topUpkeepAmount || 0).toLocaleString()})의 방출 및 세션 조절을 고려할 수 있습니다.
                  </>
                ) : (
                  '시설 지출 축소 및 주급 관리를 권장합니다.'
                )}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-950/40 border-l-4 border-emerald-500 p-3.5 rounded-r-xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs md:text-sm text-emerald-200 leading-relaxed">
                <span className="font-bold text-emerald-300 block mb-0.5">💡 경영 리포트 및 평가</span>
                지난달 <span className="font-bold text-white">₩{(data.lastMonthProfit || 0).toLocaleString()}</span>의 순이익을 기록하며 우수한 자금 상태를 유지하고 있습니다.
              </div>
            </div>
          )}

          {/* Section 1: Financial Graph */}
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              1. 월별 자금 상태 & 수익 증감 추이 (최근 6개월)
            </h3>
            {renderGraph()}
          </div>

          {/* Section 2: Idol Weekly Salary & Fandom Changes (Sorted by upkeep DESC) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                2. 소속 아이돌 주급 & 팬덤 변동 현황 (주급 높은 순)
              </h3>
              <span className="text-[11px] text-slate-400">총 {data.traineeStats?.length || 0}명</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              {data.traineeStats && data.traineeStats.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-800/80 text-slate-400 font-semibold border-b border-slate-700">
                        <th className="py-2.5 px-3 w-10 text-center">순위</th>
                        <th className="py-2.5 px-3">아이돌 명</th>
                        <th className="py-2.5 px-3">소속</th>
                        <th className="py-2.5 px-3 text-right">주급 (₩)</th>
                        <th className="py-2.5 px-3 text-right">현재 팬덤</th>
                        <th className="py-2.5 px-3 text-right">지난달 변동</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {data.traineeStats.map((item, idx) => {
                        const displayName = item.stageName || item.name;
                        const isFandomUp = item.fandomChange >= 0;

                        return (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-white">
                              {displayName}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {item.groupName ? (
                                <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded text-[11px]">
                                  {item.groupName}
                                </span>
                              ) : (
                                <span className="text-slate-500">연습생</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-amber-300">
                              ₩{(item.upkeep || 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-medium text-slate-200">
                              {(item.fandom || 0).toLocaleString()}명
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold">
                              {isFandomUp ? (
                                <span className="text-emerald-400 flex items-center justify-end gap-0.5">
                                  ▲ +{(item.fandomChange || 0).toLocaleString()}
                                </span>
                              ) : (
                                <span className="text-rose-400 flex items-center justify-end gap-0.5">
                                  ▼ {(item.fandomChange || 0).toLocaleString()}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500 text-xs">
                  현재 영입된 아이돌이 없습니다. 오디션을 통해 인재를 영입하세요!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-900 border-t border-slate-800 p-4 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            * 대표이사 결재 시 해당 주차의 업무가 정식 승인되어 이행됩니다.
          </div>
          <button
            onClick={handleApproveClick}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition transform active:scale-95 flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            보고서 결재 및 확인
          </button>
        </div>

      </div>
    </div>
  );
};
