use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use std::process::Command;

pub fn chat(
    system: &str,
    history: &[ (String, String) ],
    user: &str,
    model: &str,
    oauth: bool,
) -> Result<String, String> {
    let tok = if oauth {
        token_oauth().ok_or("grok login して。~/.grok/auth.json")?
    } else {
        token_key().ok_or("XAI_API_KEY がない")?
    };
    post(
        "https://api.x.ai/v1/chat/completions",
        &tok,
        if model.trim().is_empty() { "grok-4.5" } else { model.trim() },
        system,
        history,
        user,
    )
}

pub fn has_oauth() -> bool { token_oauth().is_some() }
pub fn has_key() -> bool { token_key().is_some() }

fn token_key() -> Option<String> {
    std::env::var("XAI_API_KEY").ok().map(|s| s.trim().to_string()).filter(|s| !s.is_empty())
}

fn token_oauth() -> Option<String> {
    let home = std::env::var("HOME").ok().map(PathBuf::from)?;
    for path in [home.join(".grok/auth.json"), home.join(".pi/agent/auth.json"), home.join(".hisyo/xai.json")] {
        if let Some(t) = read_token(&path) { return Some(t); }
    }
    None
}

pub fn post(url: &str, tok: &str, model: &str, system: &str, history: &[(String, String)], user: &str) -> Result<String, String> {
    let mut messages = vec![json!({"role": "system", "content": system})];
    for (role, text) in history {
        let role = if role == "secretary" || role == "assistant" { "assistant" } else { "user" };
        messages.push(json!({"role": role, "content": text}));
    }
    messages.push(json!({"role": "user", "content": user}));
    let body = json!({"model": model, "messages": messages, "temperature": 0.6});
    let path = std::env::temp_dir().join(format!("hisyo-llm-{}.json", std::process::id()));
    fs::write(&path, body.to_string()).map_err(|e| e.to_string())?;
    let out = Command::new("curl").args(["-sS","--max-time","90","-X","POST",url,"-H",&format!("Authorization: Bearer {tok}"),"-H","Content-Type: application/json","--data-binary",&format!("@{}", path.display())]).output().map_err(|e| e.to_string());
    let _ = fs::remove_file(&path);
    let out = out?;
    let raw = String::from_utf8_lossy(&out.stdout).to_string();
    let err = String::from_utf8_lossy(&out.stderr).trim().to_string();
    if !out.status.success() { return Err(if err.is_empty() { raw } else { err }); }
    let v: Value = serde_json::from_str(&raw).map_err(|_| clip(&raw, 240))?;
    if let Some(msg) = v.pointer("/error/message").and_then(|x| x.as_str()) { return Err(msg.into()); }
    v.pointer("/choices/0/message/content").and_then(|x| x.as_str()).map(|s| s.trim().to_string()).filter(|s| !s.is_empty()).ok_or_else(|| clip(&raw, 240))
}

fn read_token(path: &PathBuf) -> Option<String> {
    let raw = fs::read_to_string(path).ok()?;
    let v: Value = serde_json::from_str(&raw).ok()?;
    for key in ["/access_token","/accessToken","/token","/api_key","/apiKey","/tokens/access_token","/auth/access_token","/providers/xai/access_token","/providers/xai-auth/access_token"] {
        if let Some(s) = v.pointer(key).and_then(|x| x.as_str()) { let s=s.trim(); if !s.is_empty() { return Some(s.into()); } }
    }
    None
}

fn clip(s: &str, n: usize) -> String {
    let t=s.trim(); if t.chars().count() <= n { return t.into(); } t.chars().take(n).collect::<String>() + "…"
}
