**English** | [中文](README.zh.md)

<h1 align="center">notify-me</h1>

<p align="center">
  <strong>Cross-platform notifications for AI coding assistants</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notify-me"><img src="https://img.shields.io/npm/v/notify-me.svg" alt="npm"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js">
</p>

<p align="center">
  Get notified when Claude Code or Codex CLI finishes responding.<br>
  Desktop popups, sound alerts, Telegram, Bark, Server酱, Slack, email — pick your channels.
</p>

---

## Features

- **Desktop notifications** — Native popups on macOS and Linux, no setup required
- **Sound alerts** — Terminal bell that works everywhere, even over SSH
- **Instant messaging** — Telegram Bot, Bark (iOS), Server酱 (WeChat), Slack Webhook
- **Email** — SMTP support for any mail provider
- **SSH-aware** — Auto-detects remote sessions, falls back from desktop → sound → push
- **Dual plugin** — One codebase, both Claude Code and Codex CLI

## Quick Start

### Install as CLI tool

```bash
npm install -g notify-me
notify-me --init    # Create ~/.notify-me.yaml
notify-me --test    # Test all enabled channels
```

### Install as Claude Code plugin

```
/plugin marketplace add qinsz01/notify-me
/plugin install notify-me@qinsz01
```

After installation, you'll be automatically notified every time Claude finishes responding.

### Install as Codex CLI plugin

Add the marketplace to `~/.agents/plugins/marketplace.json` or your repo's `.agents/plugins/marketplace.json`, then install via `/plugins`.

## Usage

```bash
# Send a notification (auto-detects environment)
notify-me "Build complete"

# With a title
notify-me --title "CI Pipeline" "All tests passed"

# Disable specific channels
notify-me --no-desktop --no-sound "Silent alert"

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
  ntfy:
    enabled: false
    url: "https://ntfy.sh/your-topic"
  telegram:
    enabled: false
    bot_token: ""
    chat_id: ""
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

### Environment Variables

Override any config value with `NOTIFY_ME_*` environment variables:

| Variable | Config Path |
|----------|-------------|
| `NOTIFY_ME_TELEGRAM_BOT_TOKEN` | `channels.telegram.bot_token` |
| `NOTIFY_ME_TELEGRAM_CHAT_ID` | `channels.telegram.chat_id` |
| `NOTIFY_ME_SLACK_WEBHOOK_URL` | `channels.slack.webhook_url` |
| `NOTIFY_ME_NTFY_URL` | `channels.ntfy.url` |
| `NOTIFY_ME_BARK_URL` | `channels.bark.url` |
| `NOTIFY_ME_BARK_DEVICE_KEY` | `channels.bark.device_key` |
| `NOTIFY_ME_SERVERCHAN_SENDKEY` | `channels.serverchan.sendkey` |
| `NOTIFY_ME_EMAIL_SMTP_HOST` | `channels.email.smtp_host` |
| `NOTIFY_ME_EMAIL_FROM` | `channels.email.from` |
| `NOTIFY_ME_EMAIL_TO` | `channels.email.to` |
| `NOTIFY_ME_EMAIL_USER` | `channels.email.user` |
| `NOTIFY_ME_EMAIL_PASSWORD` | `channels.email.password` |

Environment variables take precedence over the YAML config file.

## How It Works

```
Notification request
  │
  ├─ Local desktop?
  │    ├─ Yes → Desktop notification + Sound
  │    └─ No (SSH/CI) → Fallback chain:
  │         ├─ Terminal bell (\a) — zero config, always works
  │         ├─ ntfy.sh push — one URL, works everywhere
  │         └─ Local relay — SSH tunnel for full desktop popups
  │
  └─ Parallel: Telegram / Bark / Slack / Email
               (always fire if enabled, regardless of environment)
```

### Channel Setup Guides

<details>
<summary>Telegram Bot</summary>

1. Message [@BotFather](https://t.me/BotFather) on Telegram to create a bot
2. Get your `bot_token` from BotFather
3. Send a message to your bot, then visit:
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. Find your `chat_id` in the response

```yaml
telegram:
  enabled: true
  bot_token: "123456:ABC-DEF"
  chat_id: "987654321"
```
</details>

<details>
<summary>Bark (iOS)</summary>

1. Install [Bark](https://apps.apple.com/app/bark-customed-notifications/id1403753865) from the App Store
2. Open the app to get your server URL and device key

```yaml
bark:
  enabled: true
  url: "https://api.day.app"
  device_key: "your-device-key"
```
</details>

<details>
<summary>Server酱 (WeChat)</summary>

1. Sign up at [sct.ftqq.com](https://sct.ftqq.com/)
2. Follow the WeChat official account and get your SendKey

```yaml
serverchan:
  enabled: true
  sendkey: "SCTxxxx"
```
</details>

<details>
<summary>Slack</summary>

1. Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) in your Slack workspace
2. Copy the webhook URL

```yaml
slack:
  enabled: true
  webhook_url: "https://hooks.slack.com/services/T.../B.../xxx"
```
</details>

<details>
<summary>ntfy.sh (SSH Fallback)</summary>

ntfy.sh is a free, open-source push notification service. No account needed.

1. Pick a unique topic name (like a channel name)
2. Subscribe to it in the [ntfy app](https://ntfy.sh) (iOS/Android/Web)

```yaml
ntfy:
  enabled: true
  url: "https://ntfy.sh/your-unique-topic-name"
```

You can also self-host ntfy.sh for privacy.
</details>

<details>
<summary>Email (SMTP)</summary>

Works with any SMTP provider (Gmail, SendGrid, Mailgun, etc.).

For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833):

```yaml
email:
  enabled: true
  smtp_host: "smtp.gmail.com"
  smtp_port: 587
  from: "you@gmail.com"
  to: "you@gmail.com"
  user: "you@gmail.com"
  password: "your-app-password"
```
</details>

## Contributing

PRs are welcome! Fork the repo, make your changes, and open a pull request.

```bash
git clone https://github.com/qinsz01/notify-me.git
cd notify-me
npm install
npm test
```

## License

[MIT](LICENSE)
