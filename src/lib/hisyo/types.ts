export type AgentStatus =
  | "running"
  | "waiting"
  | "watching"
  | "idle"
  | "done"
  | "error";

export type Runtime = string;
export type LogStream = "stdout" | "system" | "tool";
export type LogLine = { id: string; at: number; stream: LogStream; text: string; role?: string };
export type FileChange = { path: string; additions: number; deletions: number };
export type ChatTurn = { id: string; at: number; role: "user" | "assistant" | "tool" | string; text: string; reasoning?: string; images?: string[] };
export type Agent = { id: string; name: string; slug: string; status: AgentStatus; runtime: Runtime; model: string; task: string; lastEvent: string; startedAt: number; lastBeatAt: number; tokensIn: number; tokensOut: number; files: FileChange[]; logs: LogLine[]; heartbeat: number[]; waitingNotified: boolean; sessionId?: string; cwd?: string; path?: string; turns?: ChatTurn[]; goal?: string; permit?: { kind: string; title: string; detail: string; callId: string }; parentId?: string; agentKind?: string; touching?: string };
export type HisyoEventKind = "status" | "log" | "watch" | "mail" | "decision";
export type HisyoEvent = { id: string; at: number; agentId: string | null; kind: HisyoEventKind; text: string };
export type ChatRole = "user" | "secretary" | "system";
export type ChatMessage = { id: string; at: number; role: ChatRole; text: string };
export type WatcherKind = "mail" | "x" | "cal" | "other";
export type WatcherMode = "on" | "off" | "readonly";
export type WatcherItem = { id: string; title: string; preview: string; at: number; urgent: boolean };
export type Watcher = { id: string; name: string; kind: WatcherKind; mode: WatcherMode; summary: string; lastAt: number; items: WatcherItem[] };
export type ScheduleItem = { id: string; when: string; title: string; warn: boolean };
export type AppView = "fleet" | "timeline" | "watchers" | "secretary" | "skills" | "settings" | "feedback" | "kanban";
export type FleetLayout = "table" | "board";
export type StatusFilter = AgentStatus | "all";
export const STATUS_LABEL: Record<AgentStatus,string> = { running:"実行中", waiting:"待ち", watching:"監視", idle:"待機", done:"完了", error:"エラー" };
export const STATUS_ORDER: AgentStatus[] = ["running","waiting","watching","idle","done","error"];
export const FLEET_RANK: Record<AgentStatus,number> = { running:0, waiting:1, error:2, watching:3, idle:4, done:5 };
export function isMainAgent(a:Agent):boolean{return !a.parentId;}
export function childrenOf(agents:Agent[],parent:Agent):Agent[]{const keys=new Set<string>([parent.id]);if(parent.sessionId)keys.add(parent.sessionId);return agents.filter(c=>Boolean(c.parentId)&&keys.has(c.parentId as string)).sort((a,b)=>b.lastBeatAt-a.lastBeatAt);}
export function parentOf(agents:Agent[],child:Agent):Agent|undefined{if(!child.parentId)return undefined;return agents.find(a=>a.id===child.parentId||a.sessionId===child.parentId);}
export function sortAgents<T extends {status:AgentStatus;lastBeatAt:number}>(list:T[]):T[]{return [...list].sort((a,b)=>{const r=(FLEET_RANK[a.status]??9)-(FLEET_RANK[b.status]??9);if(r)return r;return b.lastBeatAt-a.lastBeatAt;});}
export { RUNTIME_LABEL, runtimeLabel } from "./plugins";
export const VIEW_LABEL: Record<AppView,string> = { fleet:"一覧", kanban:"カンバン", timeline:"履歴", watchers:"監視", secretary:"秘書", skills:"スキル", settings:"設定", feedback:"報告" };
export const CHAT_RUNTIMES = ["claude","codex","opencode"] as const;
