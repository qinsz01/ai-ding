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

## SSH & Remote Setup

When you're connected via SSH, desktop notifications won't reach your local machine. notify-me uses a progressive fallback:

1. **Terminal bell (`\a`)** — zero config, but your local terminal must support it
2. **ntfy.sh** — push notification to your phone/browser, one URL to configure

### Enabling Terminal Bell Over SSH

Your local terminal decides whether `\a` produces a sound. Here's how to enable it:

| Terminal | How to enable |
|----------|---------------|
| **Windows Terminal** | Open `settings.json` (Settings → bottom left "Open JSON file"), add to your profile: `"bellStyle": "audible"` or `"bellStyle": "all"`. Optionally set `"bellSound": "C:/path/to/bell.wav"` for a custom sound |
| **iTerm2** (macOS) | Preferences → Profiles → Terminal → check "Audible bell" |
| **macOS Terminal** | Preferences → Profiles → Advanced → check "Audible bell" |
| **VS Code Terminal** | Add to settings: `"terminal.integrated.enableBell": true` |
| **PuTTY** | Configuration → Terminal → Bell → set to "Play default sound" |
| **tmux** | Add to `~/.tmux.conf`: `set -g bell-action any` |

After enabling, test with: `printf '\a'` — you should hear a beep.

### Setting Up ntfy.sh (Recommended for SSH)

ntfy.sh is the most reliable way to get notifications over SSH. No account, no app install required on the server.

**Step 1: Pick a unique topic name**

A topic is like a channel — anyone who knows the name can send/receive. Use something unique:

```
my-dev-notifications-a1b2c3
```

**Step 2: Subscribe on your device**

- **Phone**: Install [ntfy app](https://ntfy.sh) ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)), subscribe to your topic
- **Browser**: Open `https://ntfy.sh/your-topic-name` and allow notifications
- **Desktop**: [ntfy desktop app](https://ntfy.sh) or PWA

**Step 3: Configure notify-me**

```yaml
# ~/.notify-me.yaml
channels:
  ntfy:
    enabled: true
    url: "https://ntfy.sh/my-dev-notifications-a1b2c3"
```

Or via environment variable (no config file needed):

```bash
export NOTIFY_ME_NTFY_URL="https://ntfy.sh/my-dev-notifications-a1b2c3"
```

**Step 4: Test**

```bash
notify-me "Hello from notify-me"
```

You should receive a push notification on your subscribed device within seconds.

> **Tip**: For sensitive notifications, you can [self-host ntfy.sh](https://docs.ntfy.sh/install/) or enable [access control](https://docs.ntfy.sh/config/#access-control) on a topic.

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

Free, open-source push notification service. **No account needed.** Best option for SSH.

1. Pick a unique topic name (e.g. `my-dev-alerts-xyz123`)
2. Subscribe on your device:
   - **iOS**: [App Store](https://apps.apple.com/us/app/ntfy/id1625396347)
   - **Android**: [Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
   - **Browser**: Open `https://ntfy.sh/your-topic` and allow notifications
3. Test: `curl -d "Hello" https://ntfy.sh/your-topic`

```yaml
ntfy:
  enabled: true
  url: "https://ntfy.sh/your-topic-name"
```

Self-hosting: `docker run -p 80:80 binwiederhier/ntfy serve` — see [docs](https://docs.ntfy.sh/install/).
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
