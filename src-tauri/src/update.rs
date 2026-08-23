use serde::Serialize;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct UpdateResult {
    pub available: bool,
    pub pulled: bool,
    pub local: String,
    pub remote: String,
    pub message: String,
}

fn empty() -> UpdateResult {
    UpdateResult { available: false, pulled: false, local: String::new(), remote: String::new(), message: String::new() }
}

pub fn check() -> Result<UpdateResult, String> {
    let Some(root) = find_repo() else { return Ok(empty()); };
    remember(&root);
    let local_sha = git(&root, &["rev-parse", "HEAD"]).unwrap_or_default();
    if local_sha.is_empty() { return Ok(empty()); }
    let remote_sha = remote_sha(&root);
    if remote_sha.is_empty() || same_sha(&local_sha, &remote_sha) {
        return Ok(UpdateResult { available: false, pulled: false, local: short_sha(&local_sha), remote: short_sha(&remote_sha), message: String::new() });
    }
    let message = git(&root, &["log", "-1", "--pretty=%s", &remote_sha]).unwrap_or_default();
    Ok(UpdateResult { available: true, pulled: false, local: short_sha(&local_sha), remote: short_sha(&remote_sha), message })
}

pub fn install() -> Result<UpdateResult, String> {
    let Some(root) = find_repo() else { return Err("リポジトリがない".into()); };
    remember(&root);
    let dirty = git(&root, &["status", "--porcelain"])?;
    if !dirty.trim().is_empty() { return Err("ローカルに変更がある".into()); }
    let local = git(&root, &["rev-parse", "HEAD"])?;
    if git_timeout(&root, &["pull", "--ff-only", "origin", "main"], 30_000).is_err() { git_timeout(&root, &["pull", "--ff-only"], 30_000)?; }
    let now = git(&root, &["rev-parse", "HEAD"])?; let pulled = now != local;
    Ok(UpdateResult { available: false, pulled, local: short_sha(&now), remote: short_sha(&now), message: if pulled { "入れた".into() } else { String::new() } })
}

fn remote_sha(root: &Path) -> String {
    for spec in ["HEAD", "refs/heads/main", "refs/heads/master"] {
        if let Ok(out) = git_timeout(root, &["ls-remote", "origin", spec], 10_000) {
            if let Some(sha) = out.split_whitespace().next() {
                if sha.len() >= 7 && sha.chars().all(|c| c.is_ascii_hexdigit()) { return sha.to_string(); }
            }
        }
    }
    let _ = git_timeout(root, &["-c", "http.lowSpeedLimit=1000", "-c", "http.lowSpeedTime=8", "fetch", "--quiet", "origin"], 12_000);
    git(root, &["rev-parse", "origin/main"]).or_else(|_| git(root, &["rev-parse", "origin/master"])).unwrap_or_default()
}
fn same_sha(a:&str,b:&str)->bool{let a=a.trim();let b=b.trim();if a.is_empty()||b.is_empty(){return false;}a==b||a.starts_with(b)||b.starts_with(a)}
fn short_sha(sha:&str)->String{sha.chars().take(7).collect()}
pub fn repo_path()->Option<PathBuf>{find_repo()}
fn find_repo()->Option<PathBuf>{let home=std::env::var("HOME").ok().map(PathBuf::from);if let Some(home)=&home{let cfg=crate::plugins::load_config(home);if let Some(p)=cfg.clone_path{let pb=PathBuf::from(p);if is_repo(&pb){return Some(pb);}}}let mut cands:Vec<PathBuf>=Vec::new();if let Ok(c)=std::env::current_dir(){cands.push(c);}if let Ok(exe)=std::env::current_exe(){if let Some(p)=exe.parent(){cands.push(p.to_path_buf());}}if let Some(m)=option_env!("CARGO_MANIFEST_DIR"){let p=PathBuf::from(m);if let Some(parent)=p.parent(){cands.push(parent.to_path_buf());}cands.push(p);}if let Some(home)=&home{for rel in ["hisyo-view","src/hisyo-view","code/hisyo-view","dev/hisyo-view","git/hisyo-view","Projects/hisyo-view","projects/hisyo-view"]{cands.push(home.join(rel));}}for c in cands{let mut p=c;for _ in 0..8{if is_repo(&p){return Some(p);}if !p.pop(){break;}}}None}
fn is_repo(p:&Path)->bool{p.join(".git").exists()&&p.join("src-tauri").exists()}
fn remember(root:&Path){let Ok(home)=std::env::var("HOME").map(PathBuf::from)else{return;};let mut cfg=crate::plugins::load_config(&home);let s=root.to_string_lossy().to_string();if cfg.clone_path.as_deref()!=Some(s.as_str()){cfg.clone_path=Some(s);let _=crate::plugins::save_config(&home,&cfg);}}
fn git(root:&Path,args:&[&str])->Result<String,String>{git_timeout(root,args,4000)}
fn git_timeout(root:&Path,args:&[&str],ms:u64)->Result<String,String>{let mut child=Command::new("git").args(args).current_dir(root).env("GIT_TERMINAL_PROMPT","0").env("GIT_OPTIONAL_LOCKS","0").stdout(std::process::Stdio::piped()).stderr(std::process::Stdio::piped()).spawn().map_err(|e|e.to_string())?;let start=std::time::Instant::now();loop{match child.try_wait(){Ok(Some(st))=>{let mut stdout=String::new();let mut stderr=String::new();if let Some(mut o)=child.stdout.take(){let _=std::io::Read::read_to_string(&mut o,&mut stdout);}if let Some(mut o)=child.stderr.take(){let _=std::io::Read::read_to_string(&mut o,&mut stderr);}if !st.success(){return Err(stderr.trim().to_string());}return Ok(stdout.trim().to_string());}Ok(None)if start.elapsed().as_millis()as u64>ms=>{let _=child.kill();let _=child.wait();return Err("timeout".into());}Ok(None)=>std::thread::sleep(std::time::Duration::from_millis(30)),Err(e)=>return Err(e.to_string())}}}
