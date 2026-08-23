#!/bin/zsh
set -euo pipefail

need() { command -v "$1" >/dev/null 2>&1; }

if ! xcode-select -p >/dev/null 2>&1; then
  xcode-select --install
  echo "Command Line Tools のダイアログを終えてから、もう一度このスクリプトを実行する"
  exit 1
fi

if ! need brew; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [ -x /opt/homebrew/bin/brew ]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [ -x /usr/local/bin/brew ]; then
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi

need node || brew install node
if ! need rustc; then
  curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
fi
[ -f "$HOME/.cargo/env" ] && source "$HOME/.cargo/env"
need gh || brew install gh

if ! gh auth status >/dev/null 2>&1; then
  gh auth login
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
npm i
echo "OK  cd \"$ROOT\" && npx tauri dev"
