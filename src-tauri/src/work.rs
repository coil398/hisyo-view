use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct Job {
    pub id: String,
    pub title: String,
    pub body: String,
    pub status: String,
    pub seat_id: String,
    pub at: u64,
    #[serde(default)]
    pub runtime: String,
    #[serde(default)]
    pub cwd: String,
    #[serde(default)]
    pub model: String,
}

fn path() -> PathBuf { crate::secretary::home_dir().join("work/jobs.json") }
pub fn list() -> Vec<Job> { let raw=fs::read_to_string(path()).unwrap_or_default(); serde_json::from_str(&raw).unwrap_or_default() }
fn save(rows:&[Job]) { let dir=crate::secretary::home_dir().join("work"); let _=fs::create_dir_all(&dir); let _=fs::write(path(),serde_json::to_string_pretty(rows).unwrap_or_else(|_|"[]".into())); let open:Vec<_>=rows.iter().filter(|j|j.status=="open").cloned().collect(); let _=fs::write(crate::secretary::home_dir().join("state/jobs.json"),serde_json::to_string_pretty(&rows).unwrap_or_else(|_|"[]".into())); let _=open; }
pub fn add(title:&str,body:&str)->Job { let mut rows=list(); let (runtime,cwd,model)=crate::launch::last().unwrap_or_default(); let job=Job{id:format!("w-{}",now()),title:title.trim().into(),body:body.trim().into(),status:"open".into(),seat_id:String::new(),at:now(),runtime,cwd,model}; rows.insert(0,job.clone()); if rows.len()>80{rows.truncate(80);} save(&rows);job }
pub fn assign(job_id:&str,seat_id:&str)->Result<Job,String>{ let mut rows=list(); let Some(job)=rows.iter_mut().find(|j|j.id==job_id||j.title==job_id) else{return Err("仕事がない".into())}; job.status="assigned".into();job.seat_id=seat_id.into();let job=job.clone();save(&rows);let seats=crate::scan::last_list();let Some(s)=seats.iter().find(|s|s.id==seat_id||s.name==seat_id||s.session_id==seat_id) else{return Ok(job)};let text=if job.body.is_empty(){job.title.clone()}else{format!("{}\n\n{}",job.title,job.body)};let _=crate::send::send(crate::send::SendReq{runtime:s.runtime.clone(),session_id:s.session_id.clone(),cwd:s.cwd.clone(),text});crate::extra::audit("assign",&format!("{} → {}",job.id,s.name));Ok(job)}
pub fn done(job_id:&str)->Result<Job,String>{let mut rows=list();let Some(job)=rows.iter_mut().find(|j|j.id==job_id||j.title==job_id) else{return Err("仕事がない".into())};job.status="done".into();let job=job.clone();save(&rows);Ok(job)}
pub fn pop(job_id:&str)->Result<Job,String>{let rows=list();let Some(job)=rows.iter().find(|j|j.id==job_id||j.title==job_id).cloned() else{return Err("仕事がない".into())};let last=crate::launch::last();let cwd=if job.cwd.trim().is_empty(){last.as_ref().map(|l|l.1.clone()).unwrap_or_default()}else{job.cwd.clone()};let runtime=if job.runtime.trim().is_empty(){last.as_ref().map(|l|l.0.clone()).unwrap_or_else(||"codex".into())}else{job.runtime.clone()};let model=if job.model.trim().is_empty(){last.as_ref().map(|l|l.2.clone()).unwrap_or_default()}else{job.model.clone()};if cwd.trim().is_empty(){return Err("フォルダがない。作業フォルダを決めて。".into())}let idle=crate::scan::last_list().into_iter().find(|s|s.parent_id.is_empty()&&(s.status=="waiting"||s.status=="idle"||s.status=="watching")&&(s.cwd==cwd||s.cwd.trim_end_matches('/')==cwd.trim_end_matches('/')));if let Some(s)=idle{return assign(&job.id,&s.id)}let prompt=if job.body.is_empty(){job.title.clone()}else{format!("{}\n\n{}",job.title,job.body)};crate::launch::launch(crate::launch::LaunchReq{runtime,model,cwd,prompt,effort:String::new()})?;let mut rows=list();if let Some(j)=rows.iter_mut().find(|j|j.id==job.id){j.status="assigned".into();j.seat_id="pop".into();}save(&rows);crate::extra::audit("pop",&job.id);rows.into_iter().find(|j|j.id==job.id).ok_or_else(||"仕事がない".into())}
pub fn open_count()->usize{list().iter().filter(|j|j.status=="open").count()}
fn now()->u64{SystemTime::now().duration_since(UNIX_EPOCH).map(|d|d.as_millis() as u64).unwrap_or(0)}
#[cfg(test)] mod tests{use super::*;#[test]fn default_job(){let j=Job::default();assert_eq!(j.id,"");assert_eq!(j.status,"");}#[test]fn open_count_is_finite(){let n=open_count();assert!(n<10_000);}}
