use serde::Deserialize;
use std::path::Path;
use std::process::{Command, Stdio};

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendReq {
    pub runtime: String,
    pub session_id: String,
    pub cwd: String,
    pub text: String,
}

pub fn send(req: SendReq) -> Result<String, String> {
    let text = req.text.trim();
    if text.is_empty() {
        return Err("空".into());
    }
    let home = std::env::var("HOME").map(std::path::PathBuf::from).unwrap_or_default();
    let cfg = crate::plugins::load_config(&home);
    let plug = cfg.plugins.get(&req.runtime);
    let model = plug.and_then(|p| p.model.clone()).unwrap_or_default();
    let effort = plug.and_then(|p| p.effort.clone()).unwrap_or_default();
    let cwd = if req.cwd.is_empty() { home.clone() } else { std::path::PathBuf::from(&req.cwd) };
    let cmd = match req.runtime.as_str() {
        "codex" => codex_cmd(&req.session_id, text, &model, &effort),
        "claude" => claude_cmd(&req.session_id, text, &model),
        "opencode" => opencode_cmd(&req.session_id, text),
        _ => return Err("このランタイムは送信未対応".into()),
    };
    spawn(&cmd, &cwd)
}

fn codex_cmd(id: &str, text: &str, model: &str, effort: &str) -> String {
    let mut s = String::from("codex exec resume"); s.push(' '); s.push_str(&sh_quote(id));
    if !effort.is_empty() { s.push_str(" --effort "); s.push_str(&sh_quote(effort)); }
    if !model.is_empty() { s.push_str(" --model "); s.push_str(&sh_quote(model)); }
    s.push(' '); s.push_str(&sh_quote(text)); s
}
fn claude_cmd(id: &str, text: &str, model: &str) -> String {
    let mut s = String::from("claude -p --output-format text --resume"); s.push(' '); s.push_str(&sh_quote(id));
    if !model.is_empty() { s.push_str(" --model "); s.push_str(&sh_quote(model)); }
    s.push(' '); s.push_str(&sh_quote(text)); s
}
fn opencode_cmd(id: &str, text: &str) -> String { format!("opencode run --session {} {}", sh_quote(id), sh_quote(text)) }
fn spawn(cmd: &str, cwd: &Path) -> Result<String, String> {
    let dir = if cwd.is_dir() { cwd.to_path_buf() } else { std::env::var("HOME").map(std::path::PathBuf::from).unwrap_or_default() };
    Command::new("/bin/zsh").args(["-lc", cmd]).current_dir(dir).stdin(Stdio::null()).stdout(Stdio::null()).stderr(Stdio::null()).spawn().map_err(|e| e.to_string())?;
    Ok("sent".into())
}
fn sh_quote(s: &str) -> String { format!("'{}'", s.replace('\'', "'\\''")) }
