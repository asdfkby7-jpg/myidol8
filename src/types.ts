export type TraineeStatus = 'TRAINING' | 'DEBUTED' | 'RESTING';
export type Gender = 'FEMALE' | 'MALE';

export interface Trainee {
  id: string;
  name: string;
  stageName?: string; // 예명 (설정 시 원래 이름 대신 표시)
  age: number;
  gender: Gender;
  avatarBg: string;
  avatarIcon: string; // lucide icon identifier or visual seed
  profileImage?: string; // Image URL / Data URL (jpg, png, gif)
  personality: string;
  
  // Stats (0 ~ 100)
  vocal: number;
  dance: number;
  charisma: number;
  visual: number;
  
  // Condition
  stamina: number; // 0 ~ 100
  mental: number;  // 0 ~ 100
  
  // Progression
  popularity: number; // 0 ~ 100
  fandom: number;     // 개인 팬덤 수
  upkeep: number;     // 주급 (₩ / week)
  scoutCost?: number; // 스카우트 비용 (특별 연습생 등)
  groupId?: string;   // Null if solo trainee
  status: TraineeStatus;
  
  joinedWeek: number;
  scandalCount?: number;
  salaryCutCount?: number; // 주급 50% 삭감 누적 횟수 (2회 누적 시 자진 방출)
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
  concept: string; // e.g. "청량", "걸크러쉬", "힙합", "서정적", "파워풀", "몽환"
  debutWeek: number;
  fandom: number;
  totalAlbumSales: number;
  reputation: number; // 0 ~ 100
}

export interface Composer {
  id: string;
  name: string;
  style: string;
  cost: number;
  hitChanceBonus: number;
}

export interface Album {
  id: string;
  groupId: string;
  groupName: string;
  title: string;
  concept: string;
  composerName: string;
  mvBudget: number; // ₩
  releaseWeek: number;
  isSuccess: boolean;
  failReason?: string;
  
  salesCount: number;      // 음반 판매량
  settlementAmount: number;// 정산 금액
  fandomGained: number;    // 증가된 팬클럽
  chartRank: number;       // 1 ~ 100
  criticReview: string;    // AI/룰베이스 평론
}

export interface Venue {
  id: string;
  name: string;
  capacity: number;
  rentCost: number;
  ticketPrice: number;
  minFandomRequired: number;
}

export interface Facility {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  upgradeCost: number;
  weeklyUpkeep: number;
  description: string;
  benefitText: string;
  hasManager?: boolean;
}

export interface NewsItem {
  id: string;
  week: number;
  type: 'ALBUM' | 'CONCERT' | 'SCANDAL' | 'TRAINING' | 'CHART' | 'EVENT';
  title: string;
  content: string;
  isNegative?: boolean;
}

export interface ChartSong {
  rank: number;
  title: string;
  artist: string;
  albumId?: string;
  isUserGroup: boolean;
  score: number;
  weeksOnChart: number;
}

export interface MonthlyRecord {
  year: number;
  month: number;
  money: number;        // 해당 월말 시점 자금
  revenue: number;      // 해당 월 총 매출
  expense: number;      // 해당 월 총 지출
  netProfit: number;    // 해당 월 순손익 (revenue - expense)
}

export interface TraineeReportStat {
  id: string;
  name: string;
  stageName?: string;
  groupName?: string;
  upkeep: number;
  fandom: number;
  fandomChange: number; // 지난달(4주간) 팬덤 변동량
}

export interface MonthlyReportData {
  year: number;
  month: number;
  weekOfMonth: number;
  reportWeek: number;
  lastMonthRevenue: number;
  lastMonthExpense: number;
  lastMonthProfit: number;
  history: MonthlyRecord[];
  traineeStats: TraineeReportStat[];
  topUpkeepTraineeName?: string;
  topUpkeepAmount?: number;
}

export interface GameState {
  companyName: string;
  repName: string;
  money: number;       // ₩ 자금
  fandom: number;      // 총 공식 팬클럽 수
  week: number;        // 진행 주차 (1주차부터)
  reputation: number;  // 기획사 명성 (0~100)
  
  trainees: Trainee[];
  groups: Group[];
  albums: Album[];
  facilities: Record<string, Facility>;
  newsList: NewsItem[];
  currentChart: ChartSong[];
  
  // Weekly & Monthly Stats Tracking
  weeklyRevenue: number;
  weeklyExpense: number;
  currentMonthRevenue?: number;
  currentMonthExpense?: number;
  monthlyHistory?: MonthlyRecord[];
  prevMonthTraineeFandoms?: Record<string, number>; // traineeId -> fandom at start of month
  pendingMonthlyReport?: MonthlyReportData | null;
  showMonthlyReportModal?: boolean;

  lastInspectedTraineeId?: string | null;
  isSetupCompleted?: boolean;
  agencyBranches?: string[]; // Overseas branches created per country ID
}

export type ActiveTab = 'DASHBOARD' | 'TRAINEE' | 'GROUPS' | 'ALBUM' | 'CONCERT' | 'FACILITY' | 'CHARTS';
