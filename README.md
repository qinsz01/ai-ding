# notify-me

Cross-platform notification plugin for Claude Code and Codex CLI.

Sends notifications when AI finishes responding, a long-running command completes, or you need attention — via desktop popup, sound, Telegram, Bark, Server酱, Slack, email, and more.

## Features

- **8 notification channels**: Desktop, Sound, ntfy.sh, Telegram, Bark, Server酱, Slack, Email
- **Auto environment detection**: Desktop notifications locally, automatic fallback over SSH
- **SSH remote support**: Terminal bell → ntfy push → local relay, progressive fallback
- **Dual plugin**: Works with both Claude Code and Codex CLI
- **Zero native deps**: Pure TypeScript, all notifiers use HTTP APIs or built-in OS commands

## Install

### As Claude Code Plugin

```bash
# From GitHub marketplace
/plugin marketplace add qinsz01/notify-me
/plugin install notify-me@qinsz01
```

### As npm CLI tool

```bash
npm install -g notify-me
notify-me --init    # Create ~/.notify-me.yaml
notify-me --test    # Test all enabled channels
```

## Usage

```bash
# Send notification (auto-detects environment)
notify-me "Build complete"

# Specify title
notify-me --title "CI" "Build passed"

# Disable specific channels
notify-me --no-sound "Deploy done"

# Test all configured channels
notify-me --test

# Initialize config file
notify-me --init
```

## Configuration

Edit `~/.notify-me.yaml`:

```yaml
channels:
  desktop:
    enabled: true
  sound:
    enabled: true
  telegram:
    enabled: true
    bot_token: "YOUR_BOT_TOKEN"
    chat_id: "YOUR_CHAT_ID"
  bark:
    enabled: false
    url: "https://api.day.app"
    device_key: ""
  serverchan:
    enabled: false
    sendkey: ""
  slack:
    enabled: false
    webhook_url: ""
  ntfy:
    enabled: false
    url: "https://ntfy.sh/your-topic"
  email:
    enabled: false
    smtp_host: ""
    smtp_port: 587
    from: ""
    to: ""
    user: ""
    password: ""

remote:
  fallback_order:
    - sound
    - ntfy

defaults:
  title: "notify-me"
```

Environment variables override config: `NOTIFY_ME_TELEGRAM_BOT_TOKEN`, `NOTIFY_ME_SLACK_WEBHOOK_URL`, etc.

## How It Works

When installed as a Claude Code plugin, it hooks into the `Stop` event — every time Claude finishes responding, you get notified. Over SSH, it falls back to terminal bell or ntfy.sh push.

```
Notification request
  ├─ Local desktop → Desktop popup + Sound
  └─ SSH/CI → Fallback chain:
       ├─ Terminal bell (\a) — zero config
       ├─ ntfy.sh push — one URL config
       └─ Always: Telegram/Bark/Slack/Email if enabled
```

## License

MIT
