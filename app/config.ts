import type { LayoutMatrix } from './lib/atomicLayout';

// ─── Existing types (preserved for backward compatibility) ───────────────────

export interface Prize {
  id: number;
  name: string;
}

export interface DemoConfig {
  theme: string;
  carModel: string;
  tag: string;
  title: string;
  subtitle: string;
  sellingPoints: string[];
  prizes: Prize[];
  layoutMatrix?: LayoutMatrix;
}

export const config: DemoConfig = {
  theme: "luxury_ai",
  carModel: "小鹏 GX",
  tag: "AI新豪华大六座SUV旗舰",
  title: "小鹏 GX 智享品鉴礼遇",
  subtitle: "预约首批进店品鉴，100%赢取上市限定豪华周边",
  sellingPoints: [
    "✨ AI 新豪华旗舰：六座宽奢大空间，打造前所未有的全感官高定座舱",
    "☕ 专属Fellow接待：成功留资即刻锁定 1对1 豪华产品专家尊享品鉴方案",
    "🎁 首批品鉴特权：限时进店即赠首发精美随手礼，现场体验大六座空间美美学",
  ],
  prizes: [
    { id: 1, name: "小鹏 GX 1:18 高精车模" },
    { id: 2, name: "新豪华大六座定制车载香薰" },
    { id: 3, name: "小鹏上市限定多功能折叠箱" },
    { id: 4, name: "门店尊享特调咖啡兑换券" },
  ],
};

// ─── New types ────────────────────────────────────────────────────────────────

export type CarModelId = "gx" | "x9" | "g6" | "p7i" | "m03";
export type Theme =
  | "luxury_ai"
  | "cyber_future"
  | "pop_active"
  | "sport_tech"
  | "youth_trend";

export interface CarModelMeta {
  id: CarModelId;
  displayName: string;
  tag: string;
  sellingPoints: string[];
  theme: Theme;
  promptPlaceholder: string;
}

export interface ThemeTokens {
  bg: string;
  primary: string;
  secondary: string;
  haloColor: string;
  cardBorder: string;
  buttonGradient: string;
  sectorColors: [string, string];
  pointerColor: string;
  ringColor: string;
}

// ─── Car model knowledge base ─────────────────────────────────────────────────

export const CAR_MODEL_MAP: Record<CarModelId, CarModelMeta> = {
  gx: {
    id: "gx",
    displayName: "小鹏 GX",
    tag: "AI新豪华大六座SUV旗舰",
    sellingPoints: ["六座宽奢大空间", "全感官高定座舱", "空间美学"],
    theme: "luxury_ai",
    promptPlaceholder:
      "我是广州正佳广场店的销售阿强，周末想办个小鹏 GX「AI新豪华大六座SUV旗舰」的门店首批品鉴抽奖活动，语气要高级、吸引人。",
  },
  x9: {
    id: "x9",
    displayName: "小鹏 X9",
    tag: "明日星舰超智驾大七座MPV",
    sellingPoints: ["全系后轮转向", "冰箱彩电大沙发", "魔方三排空间"],
    theme: "cyber_future",
    promptPlaceholder:
      "我是正佳店Fellow，周末想针对家庭用户办个小鹏 X9「明日星舰大七座」星舰体验日活动，突出科技感和家庭空间。",
  },
  g6: {
    id: "g6",
    displayName: "小鹏 G6",
    tag: "超智驾纯电SUV",
    sellingPoints: ["800V高压SiC碳化硅平台", "XNGP全场景智驾", "超快充"],
    theme: "pop_active",
    promptPlaceholder:
      "我是深圳南山店销售，想办一个小鹏 G6「超智驾纯电SUV」的试驾体验活动，主打年轻活力和智能科技。",
  },
  p7i: {
    id: "p7i",
    displayName: "小鹏 P7i",
    tag: "超智驾轿跑旗舰",
    sellingPoints: ["经典美学轿跑身姿", "鹏翼门瞩目设计", "瞬时操控"],
    theme: "sport_tech",
    promptPlaceholder:
      "我是上海徐汇店销售，想为小鹏 P7i「超智驾轿跑旗舰」策划一场赛道风格的品鉴活动，突出运动性能和设计美学。",
  },
  m03: {
    id: "m03",
    displayName: "小鹏 MONA M03",
    tag: "智能纯电掀背轿跑",
    sellingPoints: ["全系标配高阶智驾", "年轻人的第一台轿跑", "高颜值掀背设计"],
    theme: "youth_trend",
    promptPlaceholder:
      "我是北京朝阳店销售，想为小鹏 MONA M03「智能纯电掀背轿跑」策划一场面向年轻人的潮流发布活动。",
  },
};

// ─── Theme token map ──────────────────────────────────────────────────────────

export const THEME_MAP: Record<Theme, ThemeTokens> = {
  luxury_ai: {
    bg: "#0A0A0A",
    primary: "#00D4AA",
    secondary: "#F5A623",
    haloColor: "rgba(0,212,170,0.20)",
    cardBorder: "rgba(0,212,170,0.20)",
    buttonGradient: "linear-gradient(135deg, #00D4AA, #00A882)",
    sectorColors: ["#00D4AA", "#1A2744"],
    pointerColor: "#F5A623",
    ringColor: "#F5A623",
  },
  cyber_future: {
    bg: "#0A0A1A",
    primary: "#6366F1",
    secondary: "#8B5CF6",
    haloColor: "rgba(99,102,241,0.20)",
    cardBorder: "rgba(99,102,241,0.20)",
    buttonGradient: "linear-gradient(135deg, #6366F1, #8B5CF6)",
    sectorColors: ["#6366F1", "#1E1B4B"],
    pointerColor: "#8B5CF6",
    ringColor: "#8B5CF6",
  },
  pop_active: {
    bg: "#F8F9FA",
    primary: "#F97316",
    secondary: "#FB923C",
    haloColor: "rgba(249,115,22,0.15)",
    cardBorder: "rgba(249,115,22,0.25)",
    buttonGradient: "linear-gradient(135deg, #F97316, #FB923C)",
    sectorColors: ["#F97316", "#FED7AA"],
    pointerColor: "#F97316",
    ringColor: "#F97316",
  },
  sport_tech: {
    bg: "#0D0D0D",
    primary: "#EF4444",
    secondary: "#DC2626",
    haloColor: "rgba(239,68,68,0.20)",
    cardBorder: "rgba(239,68,68,0.20)",
    buttonGradient: "linear-gradient(135deg, #EF4444, #DC2626)",
    sectorColors: ["#EF4444", "#1C0A0A"],
    pointerColor: "#EF4444",
    ringColor: "#EF4444",
  },
  youth_trend: {
    bg: "#F1F5F9",
    primary: "#64748B",
    secondary: "#94A3B8",
    haloColor: "rgba(100,116,139,0.12)",
    cardBorder: "rgba(100,116,139,0.20)",
    buttonGradient: "linear-gradient(135deg, #64748B, #94A3B8)",
    sectorColors: ["#64748B", "#E2E8F0"],
    pointerColor: "#64748B",
    ringColor: "#64748B",
  },
};

// ─── Helper constants (useful for tests and consumers) ────────────────────────

export const CAR_MODEL_IDS = Object.keys(CAR_MODEL_MAP) as CarModelId[];
export const THEME_IDS = Object.keys(THEME_MAP) as Theme[];

// ─── Pure function: theme token lookup with fallback ─────────────────────────

export function getThemeTokens(theme: string): ThemeTokens {
  if (Object.prototype.hasOwnProperty.call(THEME_MAP, theme)) {
    return THEME_MAP[theme as Theme];
  }
  return THEME_MAP["luxury_ai"];
}
