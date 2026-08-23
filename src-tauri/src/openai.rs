use serde_json::Value;
use std::fs;
use std::path::PathBuf;

pub fn chat(
    system: &str,
    history: &[(String, String)],
    user: &str,
    model: &str,
    oauth: bool,
) -> Result<String, String> {
    let tok = if oauth {
        token_oauth().ok_or("codex login して。~/.codex/auth.json")?
    } else {
        token_key().ok_or("OPENAI_API_KEY がない")?
    };
    crate::xai::post(
        "https://api.openai.com/v1/chat/completions",
        &tok,
        if model.trim().is_empty() { "gpt-5.4" } else { model.trim() },
        system,
        history,
        user,
    )
}

pub fn has_oauth() -> bool {
    token_oauth().is_some()
}

pub fn has_key() -> bool {
    token_key().is_some()
}

fn token_key() -> Option<String> {
    std::env::var("OPENAI_API_KEY")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn token_oauth() -> Option<String> {
    let home = std::env::var("HOME").ok().map(PathBuf::from)?;
    let path = home.join(".codex/auth.json");
    let raw = fs::read_to_string(path).ok()?;
    let v: Value = serde_json::from_str(&raw).ok()?;
    for key in [
        "/tokens/access_token",
        "/access_token",
        "/OPENAI_API_KEY",
        "/api_key",
    ] {
        if let Some(s) = v.pointer(key).and_then(|x| x.as_str()) {
            let s = s.trim();
            if !s.is_empty() {
                return Some(s.into());
            }
        }
    }
    None
}
