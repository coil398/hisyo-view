export type PluginKind = "jsonl" | "json-dir" | "opencode-db" | "hisyo-seats" | "mixed" | "sqlite-walk";
export type HisyoPlugin = { id:string; name:string; kind:PluginKind; roots:string[]; glob?:string; enabled:boolean; model?:string|null; effort?:string|null; mode?:string|null };
export const BUILTIN_PLUGINS: HisyoPlugin[] = [
{id:"claude",name:"Claude Code",kind:"jsonl",roots:["~/.claude/projects"],glob:"**/*.jsonl",enabled:true},
{id:"codex",name:"Codex",kind:"jsonl",roots:["~/.codex/sessions"],glob:"**/*.jsonl",enabled:true},
{id:"opencode",name:"OpenCode",kind:"opencode-db",roots:["~/.local/share/opencode","~/.opencode"],enabled:true},
{id:"cursor",name:"Cursor",kind:"mixed",roots:["~/.cursor/projects","~/.cursor/chats"],enabled:true},
{id:"grok",name:"Grok",kind:"jsonl",roots:["~/.grok/sessions"],glob:"**/updates.jsonl",enabled:true},
{id:"amp",name:"Amp",kind:"json-dir",roots:["~/.local/share/amp/threads"],glob:"*.json",enabled:true},
{id:"seats",name:"Hisyo",kind:"hisyo-seats",roots:["~/.hisyo/seats"],glob:"*.json",enabled:true}];
export const RUNTIME_LABEL:Record<string,string>={claude:"Claude",codex:"Codex",opencode:"OpenCode",amp:"Amp",grok:"Grok",cursor:"Cursor",seats:"Hisyo",chatgpt:"ChatGPT"};
export function runtimeLabel(id:string):string{return RUNTIME_LABEL[id]??id;}
export function isCloudAgent(a:{slug?:string;cwd?:string;path?:string}):boolean{return a.slug==="クラウド"||a.cwd==="cloud"||(a.path??"").startsWith("https://");}
export const MODE_CATALOG:Record<string,{id:string;label:string}[]>={claude:[{id:"default",label:"手動"},{id:"acceptEdits",label:"編集OK"},{id:"plan",label:"Plan"},{id:"auto",label:"Auto"},{id:"dontAsk",label:"聞かない"},{id:"bypassPermissions",label:"全部"}],codex:[{id:"untrusted",label:"毎回"},{id:"on-request",label:"要求時"},{id:"on-failure",label:"失敗時"},{id:"never",label:"自動"}],cursor:[{id:"agent",label:"Agent"},{id:"plan",label:"Plan"},{id:"ask",label:"Ask"},{id:"debug",label:"Debug"}],opencode:[{id:"build",label:"Build"},{id:"plan",label:"Plan"}]};
export function parsePluginManifest(raw:unknown):HisyoPlugin|null{if(!raw||typeof raw!=="object")return null;const v=raw as Record<string,unknown>;if(typeof v.id!=="string"||!v.id)return null;const kind=v.kind as PluginKind;if(!["jsonl","json-dir","opencode-db","hisyo-seats","mixed","sqlite-walk"].includes(kind))return null;const roots=Array.isArray(v.roots)?v.roots.filter((r):r is string=>typeof r==="string"):[];if(!roots.length)return null;return{id:v.id,name:typeof v.name==="string"?v.name:v.id,kind,roots,glob:typeof v.glob==="string"?v.glob:undefined,enabled:v.enabled!==false};}
export function mergePlugins(extra:HisyoPlugin[],disabled:string[]):HisyoPlugin[]{const map=new Map<string,HisyoPlugin>();for(const p of BUILTIN_PLUGINS)map.set(p.id,{...p});for(const p of extra)map.set(p.id,{...p});return[...map.values()].map(p=>({...p,enabled:p.enabled&&!disabled.includes(p.id)}));}
