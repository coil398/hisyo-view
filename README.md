# HISYO VIEW

Claude Code / Codex / OpenCode / Cursor / Grok のセッションを一覧する Mac アプリ。

**AIへ:** [AI.md](./AI.md) を読んで、書いてある手順を最後まで自分で実行する。人にコマンドをコピーさせない。

```
zsh scripts/setup.sh
npx tauri dev
```

Command Line Tools が必要。Xcode 本体は不要。

起動中は GitHub の `main` を見る。新しいコミットがあれば左下にインストールの案内を出す。適用は手動。

| id | path |
| --- | --- |
| claude | `~/.claude/projects` |
| codex | `~/.codex/sessions` |
| opencode | `~/.local/share/opencode` |
| cursor | `~/.cursor/projects`, `~/.cursor/chats` |
| grok | `~/.grok/sessions` |

追加: `~/.hisyo/plugins/<id>.json`  
無効化: `~/.hisyo/config.json` `{ "disabled": ["amp"] }`  
クラウド: Cursor / Codex (ChatGPT) / Claude / Grok は CLI のログインで席を取る。`codex cloud list`、`claude agents --json`、Cursor API、`grok sessions list`。

スキル: 秘書への手順書。画面の「使い方」を読む。フォルダをドロップして ON にすると、秘書がその本文を読んで答える。md / html は人が見る説明。
