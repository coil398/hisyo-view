use serde::Serialize;
use std::process::Command;

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Provider { pub id: String, pub label: String, pub ready: bool, pub hint: String }

pub fn list() -> Vec<Provider> {
    vec![
        p("auto", "自動", true, "入っている契約を使う"),
        p("xai-oauth", "xAI (OAuth)", crate::xai::has_oauth(), "grok login · ~/.grok/auth.json"),
        p("codex-oauth", "Codex (OAuth)", crate::openai::has_oauth(), "codex login · ~/.codex/auth.json"),
        p("xai", "xAI", crate::xai::has_key(), "XAI_API_KEY"),
        p("codex", "Codex", crate::openai::has_key() || has("codex"), "OPENAI_API_KEY か Codex CLI"),
        p("claude", "Claude Code", has("claude"), "claude"),
        p("cursor", "Cursor", has("cursor-agent"), "cursor-agent"),
        p("opencode", "OpenCode Go", has("opencode"), "opencode"),
        p("opencode-oauth", "OpenCode Go (OAuth)", opencode_oauth(), "opencode のログイン"),
    ]
}

pub fn resolve(pref: &str) -> String {
    let pref=pref.trim(); if !pref.is_empty() && pref != "auto" && pref != "pi" { return pref.into(); }
    let all=list();
    for id in ["xai-oauth","codex-oauth","opencode-oauth","xai","codex","claude","cursor","opencode"] {
        if all.iter().any(|p| p.id == id && p.ready) { return id.into(); }
    }
    String::new()
}

pub fn chat(pref: &str, system: &str, history: &[(String,String)], user: &str, model: &str) -> Result<String,String> {
    let id=resolve(pref); if id.is_empty() { return Err("契約がない。設定で選ぶ".into()); }
    match id.as_str() {
        "xai-oauth" => crate::xai::chat(system,history,user,model,true),
        "xai" => crate::xai::chat(system,history,user,model,false),
        "codex-oauth" => crate::openai::chat(system,history,user,model,true),
        "codex" => crate::openai::chat(system,history,user,model,false).or_else(|_| cli("codex",model,&format!("{system}\n\n{user}"))),
        "claude" => cli("claude",model,&format!("{system}\n\n{user}")),
        "cursor" => cli("cursor",model,&format!("{system}\n\n{user}")),
        "opencode" | "opencode-oauth" => cli("opencode",model,&format!("{system}\n\n{user}")),
        "grok" => cli("grok",model,&format!("{system}\n\n{user}")),
        other => Err(format!("{other} は未対応")),
    }
}

fn p(id:&str,label:&str,ready:bool,hint:&str)->Provider { Provider{id:id.into(),label:label.into(),ready,hint:hint.into()} }
fn has(bin:&str)->bool { Command::new("/bin/zsh").args(["-lc",&format!("command -v {bin}")]).output().map(|o|o.status.success()).unwrap_or(false) }
fn opencode_oauth()->bool { let home=std::env::var("HOME").unwrap_or_default(); ["/.local/share/opencode/auth.json","/.opencode/auth.json"].iter().any(|p|std::path::Path::new(&(home.clone()+p)).exists()) && has("opencode") }
fn cli(bin:&str,model:&str,prompt:&str)->Result<String,String> {
    let exe=match bin {"cursor"=>"cursor-agent", other=>other}; if !has(exe){return Err(format!("{exe} がない"));}
    let mut s=match bin {"claude"=>String::from("claude -p --output-format text"),"codex"=>String::from("codex exec --skip-git-repo-check"),"grok"=>String::from("grok -p"),"cursor"=>String::from("cursor-agent -p"),"opencode"=>String::from("opencode run"),_=>return Err("不明".into())};
    if !model.trim().is_empty(){s.push_str(" --model ");s.push_str(&sh(model));} s.push(' ');s.push_str(&sh(prompt));
    let out=Command::new("/bin/zsh").args(["-lc",&s]).current_dir(crate::secretary::home_dir()).output().map_err(|e|e.to_string())?;
    let stdout=String::from_utf8_lossy(&out.stdout).trim().to_string(); let stderr=String::from_utf8_lossy(&out.stderr).trim().to_string();
    if !out.status.success(){return Err(if stderr.is_empty(){stdout}else{stderr});} if stdout.is_empty(){return Err(format!("{bin} が空"));} Ok(stdout)
}
fn sh(s:&str)->String { format!("'{}'",s.replace('\'',"'\\''")) }
