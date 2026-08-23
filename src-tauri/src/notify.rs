use serde::Serialize;
use std::collections::HashMap;
use std::process::Command;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, UserAttentionType};

use crate::scan::Seat;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub kind: String,
    pub id: String,
    pub name: String,
    pub title: String,
    pub body: String,
}

struct State { seen: HashMap<String, String>, last_fire: HashMap<String, Instant>, primed: bool }
static STATE: Mutex<Option<State>> = Mutex::new(None);
fn state() -> std::sync::MutexGuard<'static, Option<State>> { STATE.lock().unwrap_or_else(|e| e.into_inner()) }

pub fn ingest(app: &AppHandle, seats: &[Seat]) {
    if !crate::extra::get().notify { return; }
    let mut g=state(); let st=g.get_or_insert_with(||State{seen:HashMap::new(),last_fire:HashMap::new(),primed:false});
    if !st.primed { for s in seats { st.seen.insert(s.id.clone(),sig(s)); } st.primed=true; badge(app,count(seats)); return; }
    let mut notes=Vec::new(); let now=Instant::now();
    for s in seats { let next=sig(s); let prev=st.seen.get(&s.id).cloned().unwrap_or_default(); if next!=prev { if let Some(n)=diff(&prev,s){let key=format!("{}:{}",n.kind,n.id);let cool=st.last_fire.get(&key).is_some_and(|t|now.saturating_duration_since(*t)<Duration::from_secs(45));if !cool{st.last_fire.insert(key,now);notes.push(n);}}} st.seen.insert(s.id.clone(),next); }
    st.seen.retain(|id,_|seats.iter().any(|s|s.id==*id)); badge(app,count(seats)); drop(g); for n in notes { fire(app,n); }
}

pub fn push(app:&AppHandle,kind:&str,id:&str,name:&str,title:&str,body:&str){if !crate::extra::get().notify{return;} {let mut g=state();let st=g.get_or_insert_with(||State{seen:HashMap::new(),last_fire:HashMap::new(),primed:false});let key=format!("{kind}:{id}");let now=Instant::now();let wait=if kind=="update"{Duration::from_secs(1800)}else{Duration::from_secs(45)};if st.last_fire.get(&key).is_some_and(|t|now.saturating_duration_since(*t)<wait){return;}st.last_fire.insert(key,now);}fire(app,Note{kind:kind.into(),id:id.into(),name:name.into(),title:title.into(),body:body.into()});}
fn fire(app:&AppHandle,n:Note){let _=app.emit("hisyo-note",&n);mac_banner(&n);if n.kind=="permit"||n.kind=="error"{if let Some(w)=app.get_webview_window("main"){let kind=if n.kind=="permit"{UserAttentionType::Critical}else{UserAttentionType::Informational};let _=w.request_user_attention(Some(kind));}}crate::extra::audit("note",&format!("{} {}",n.kind,n.name));}
fn mac_banner(n:&Note){let sound=match n.kind.as_str(){"permit"=>"Glass","error"=>"Basso","whip"=>"Purr","update"=>"Submarine","done"=>"Tink",_=>"Pop"};let script=format!(r#"display notification "{}" with title "{}" subtitle "{}" sound name "{}""#,esc(&n.body),esc("HISYO"),esc(&format!("{} · {}",n.title,n.name)),sound);let _=Command::new("osascript").args(["-e",&script]).status();}
fn badge(app:&AppHandle,n:usize){let title=if n==0{"HISYO VIEW".into()}else{format!("HISYO VIEW · {n}")};if let Some(w)=app.get_webview_window("main"){let _=w.set_title(&title);}}
fn count(seats:&[Seat])->usize{seats.iter().filter(|s|!s.permit.kind.is_empty()||s.status=="error"||s.status=="waiting").count()}
fn sig(s:&Seat)->String{format!("{}|{}",s.status,s.permit.kind)}
fn diff(prev:&str,s:&Seat)->Option<Note>{let prev_kind=prev.split_once('|').map(|x|x.1).unwrap_or("");if !s.permit.kind.is_empty()&&prev_kind!=s.permit.kind{return Some(Note{kind:"permit".into(),id:s.id.clone(),name:s.name.clone(),title:"承認待ち".into(),body:clip(&s.permit.title,80)});}let prev_st=prev.split_once('|').map(|x|x.0).unwrap_or("");if s.status=="error"&&prev_st!="error"{return Some(Note{kind:"error".into(),id:s.id.clone(),name:s.name.clone(),title:"エラー".into(),body:clip(&s.task,80)});}if s.status=="done"&&(prev_st=="running"||prev_st=="waiting"){return Some(Note{kind:"done".into(),id:s.id.clone(),name:s.name.clone(),title:"終わった".into(),body:clip(&s.task,80)});}if s.status=="waiting"&&prev_st=="running"{return Some(Note{kind:"wait".into(),id:s.id.clone(),name:s.name.clone(),title:"待ち".into(),body:clip(&s.task,80)});}None}
fn clip(s:&str,n:usize)->String{let t=s.trim();if t.chars().count()<=n{return t.into();}t.chars().take(n).collect::<String>()+"…"}
fn esc(s:&str)->String{s.replace('\\',"\\\\").replace('"',"\\\"")}
