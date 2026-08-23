# AI セットアップ

人間にコマンドを渡さない。このファイルを上から実行する。完了条件は HISYO VIEW のウィンドウが開いていること。

対象: macOS。リポジトリは `https://github.com/coil398/hisyo-view`。

## 方針

- ツールが無ければ自分で入れる
- 失敗したら自分で直して続きから再開する
- Xcode 本体は入れない。Command Line Tools だけ

## 1. リポジトリ

すでに `hisyo-view` の中にいるならその場で続ける。いなければ:

```
gh auth status || gh auth login
gh repo clone coil398/hisyo-view
cd hisyo-view
```

## 2. ツール

`scripts/setup.sh` を実行する。実行ビットが無ければ `zsh scripts/setup.sh`。

入るもの:

- Xcode Command Line Tools
- Homebrew
- Node.js
- Rust (`rustup`)
- GitHub CLI (`gh`)
- `npm i`

`gh auth status` が失敗したら `gh auth login` を対話で終わらせる。

## 3. 起動

```
npx tauri dev
```

初回の Rust ビルドは数分かかる。ウィンドウが開くまで待つ。開いたら完了。

止め方は Ctrl+C。次からは同じディレクトリで `npx tauri dev` だけ。

## 4. 動いたあとのこと

- `~/.claude/projects` `~/.codex/sessions` `~/.cursor` `~/.grok/sessions` などを自動で読む。デモデータは出さない
- クラウド席: 有効なソースなら `codex cloud list --json`、`claude agents --json --all`、Cursor API / `cursor-agent ls`、`grok sessions list --json`。Claude は `session_` / `cse_` と claude.ai/code。タイムアウト付き。45秒キャッシュ。CLI が無いときはしばらく再試行しない
- 左の「報告」は GitHub Issues（label `feedback`）に送る。`gh` のログインが要る
- スキルは秘書への手順書。画面の「使い方」を読む。`~/.hisyo/home/skills/<id>/SKILL.md` が秘書が読む本文。docs は人が読む。ドロップで入る。ON だと会話に載る
- 起動時と 5 分ごとに `origin/main` を fetch する。新しいコミットがあれば左下にインストール案内を出す。適用は手動。ローカルに未コミットの変更があるときは出さない

## うまくいかないとき

- `xcode-select` のダイアログが出た → インストール完了後に setup.sh を再実行
- `gh` が失敗する → `gh auth login` を確認
- `Could not compile` → `rustup update` のあと `npx tauri dev`
- ポート 8080 が埋まっている → 占有プロセスを止めて再実行
