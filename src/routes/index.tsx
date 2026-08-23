import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/hisyo/app-shell";
import { SkillDocWindow } from "@/components/hisyo/skill-doc-window";
import { useHisyoStore } from "@/lib/hisyo/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const pollMs = useHisyoStore((s) => s.pollMs);
  const [doc, setDoc] = useState<{ id: string; rel: string } | null>(null);
  useEffect(() => { const p=new URLSearchParams(window.location.search); if(p.get("view")==="skill-doc"&&p.get("id")){setDoc({id:p.get("id")||"",rel:p.get("rel")||"SKILL.md"});return;} void useHisyoStore.getState().boot(); }, []);
  useEffect(() => { if(doc)return; const tick=window.setInterval(()=>useHisyoStore.getState().tick(),5000); return()=>window.clearInterval(tick); }, [doc]);
  useEffect(() => { if(doc||!pollMs)return; if(typeof window!=="undefined"&&"__TAURI_INTERNALS__" in window)return; const refresh=window.setInterval(()=>{void useHisyoStore.getState().refresh();},Math.max(pollMs,2000)); return()=>window.clearInterval(refresh); }, [pollMs,doc]);
  useEffect(() => { if(doc||!pollMs)return; if(typeof window!=="undefined"&&"__TAURI_INTERNALS__" in window)return; const updateMs=useHisyoStore.getState().updateMs; if(!updateMs)return; const update=window.setInterval(()=>{void useHisyoStore.getState().checkUpdate();},updateMs); return()=>window.clearInterval(update); }, [pollMs,doc]);
  if(doc)return <SkillDocWindow id={doc.id} rel={doc.rel}/>; return <AppShell/>;
}
