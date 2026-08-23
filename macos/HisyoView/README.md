# HISYO VIEW

Claude Code / Codex / OpenCode / Cursor / Grok のセッションを一覧する。

```
npm i
npx tauri dev
```

Command Line Tools が必要。Xcode 本体は不要。

| id | path |
| --- | --- |
| claude | `~/.claude/projects` |
| codex | `~/.codex/sessions` |
| opencode | `~/.local/share/opencode` |
| cursor | `~/.cursor/projects`, `~/.cursor/chats` |
| grok | `~/.grok/sessions` |

追加: `~/.hisyo/plugins/<id>.json`
無効化: `~/.hisyo/config.json` `{ "disabled": ["amp"] }`
