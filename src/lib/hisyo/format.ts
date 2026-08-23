export function pad2(n:number):string{return n.toString().padStart(2,"0");}
export function formatElapsed(ms:number):string{const s=Math.max(0,Math.floor(ms/1000));if(s<60)return`${s}秒`;const m=Math.floor(s/60);if(m<60)return`${m}分`;const h=Math.floor(m/60);const rem=m%60;if(h<48)return rem?`${h}時間${rem}分`:`${h}時間`;return`${Math.floor(h/24)}日`;}
export function formatTokens(n:number):string{if(n<1000)return String(Math.round(n));if(n<10_000)return`${(n/1000).toFixed(1)}k`;if(n<1_000_000)return`${Math.round(n/1000)}k`;return`${(n/1_000_000).toFixed(1)}M`;}
export function formatClock(d:Date):string{return`${pad2(d.getHours())}:${pad2(d.getMinutes())}`;}
export function formatDateJa(d:Date):string{return`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;}
export function greetingForHour(h:number):string{if(h<5||h>=18)return"こんばんは";if(h<11)return"おはよう";return"こんにちは";}
export function formatBeatAgo(ms:number):string{const s=Math.max(0,Math.floor(ms/1000));if(s<3)return"いま";if(s<60)return`${s}秒前`;const m=Math.floor(s/60);if(m<60)return`${m}分前`;return`${Math.floor(m/60)}時間前`;}
