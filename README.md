**English** | [中文](README.zh.md)

<h1 align="center">🔔 notify-me</h1>

<p align="center">
  <strong>Never stare at a terminal waiting for AI to finish again.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notify-me"><img src="https://img.shields.io/npm/v/notify-me.svg" alt="npm"></a>
  <a href="https://github.com/qinsz01/notify-me/actions"><img src="https://img.shields.io/github/actions/workflow/status/qinsz01/notify-me/ci.yml?branch=master" alt="CI"></a>
  <a href="https://www.npmjs.com/package/notify-me"><img src="https://img.shields.io/npm/dw/notify-me" alt="downloads"></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/qinsz01/notify-me/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

<p align="center">
  Cross-platform notifications for <strong>Claude Code</strong> and <strong>Codex CLI</strong>.<br>
  Desktop popups, sound alerts, Telegram, Bark, Slack, email — pick your channels.<br>
  Works over SSH. Zero config for basic usage.
</p>

---

## Why notify-me?

You run `claude` and wait... and wait... 10 minutes later you realize it finished 5 minutes ago. Or worse — it's asking you a question and you didn't notice.

**notify-me alerts you the instant your AI assistant needs your attention:**

- When it **finishes responding** — with a summary of what it said
- When it **asks you a question** — so you can answer immediately
- When it **needs permission** — no more missed approval dialogs
- When it's **waiting for your input** — never miss a prompt again

## Supported Channels

| Channel | macOS | Linux | SSH | Config Required |
|---------|:-----:|:-----:|:---:|:---------------:|
| **Desktop** | ✅ | ✅ | ❌ | None |
| **Sound** | ✅ | ✅ | ✅ | None |
| **Telegram** | ✅ | ✅ | ✅ | Bot token |
| **Slack** | ✅ | ✅ | ✅ | Webhook URL |
| **Bark** (iOS) | ✅ | ✅ | ✅ | Device key |
| **Server酱** (WeChat) | ✅ | ✅ | ✅ | SendKey |
| **ntfy.sh** | ✅ | ✅ | ✅ | Topic URL |
| **Email** | ✅ | ✅ | ✅ | SMTP credentials |

Sound + desktop work out of the box. Enable more channels in `~/.notify-me.yaml`.

## Quick Start

### As a Claude Code plugin (recommended)

```
/plugin marketplace add qinsz01/notify-me
/plugin install notify-me@qinsz01
```

That's it. You'll get notifications automatically when Claude finishes, asks a question, or needs permission.

### As a CLI tool

```bash
npm install -g notify-me
notify-me --init    # Create ~/.notify-me.yaml
notify-me --test    # Test all enabled channels
```

### As a Codex CLI plugin

Add the marketplace to `~/.agents/plugins/marketplace.json` or your repo's `.agents/plugins/marketplace.json`, then install via `/plugins`.

## Usage

```bash
# Send a notification (auto-detects environment)
notify-me "Build complete"

# With a custom title
notify-me --title "CI Pipeline" "All tests passed"

# Send to a specific channel only
notify-me --channel telegram "Deploy failed"

# Disable specific channels
notify-me --no-desktop --no-sound "Silent alert"

# Test all configured channels
notify-me --test

# Initialize config file
notify-me --init
```

### Output

Every invocation prints per-channel results so you know exactly what happened:

```
[notify-me] ✓ sound: terminal bell
[notify-me] ✓ telegram: sent to chat 1234...
[notify-me] ✓ slack: sent to Slack webhook
[notify-me] Done: 3 sent.
```

If a channel fails, it shows the error:

```
[notify-me] ✓ sound: terminal bell
[notify-me] ✗ telegram: HTTP 401: Unauthorized
[notify-me] Done: 1 sent, 1 failed.
```

### Smart Notifications (Plugin Mode)

When installed as a Claude Code plugin, notify-me sends contextual notifications:

| When | Notification |
|------|-------------|
| Claude finishes responding | Summary of the last message |
| Claude asks a question | The question text |
| Claude needs permission | "Permission needed: Bash" |
| Claude waits for input | "Claude is waiting for your input" |

Subagent activity (Explore, code-reviewer, etc.) is **not** notified — only main agent actions that require your attention.

## Configuration

Edit `~/.notify-me.yaml`:

```yaml
channels:
  desktop:
    enabled: true
  sound:
    enabled: true
    file: null           # Optional: path to custom audio file
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
  message: "Task completed"
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

1. **Terminal bell (`\a`)** — zero config, but may not work through tmux
2. **ntfy.sh** — push notification to your phone/browser, one URL to configure (recommended)

### Enabling Terminal Bell Over SSH

Your local terminal decides whether `\a` produces a sound. Here's how to enable it:

| Terminal | How to enable |
|----------|---------------|
| **Windows Terminal** | Open `settings.json`, add to profile: `"bellStyle": "audible"` or `"bellStyle": "all"` |
| **iTerm2** (macOS) | Preferences → Profiles → Terminal → check "Audible bell" |
| **macOS Terminal** | Preferences → Profiles → Advanced → check "Audible bell" |
| **VS Code Terminal** | Add to settings: `"terminal.integrated.enableBell": true` |
| **PuTTY** | Configuration → Terminal → Bell → set to "Play default sound" |
| **tmux** | Add to `~/.tmux.conf`: `set -g bell-action any` |

> **Note:** Terminal bell through tmux over SSH is unreliable. If you're using tmux, we strongly recommend setting up ntfy.sh instead.

### Setting Up ntfy.sh (Recommended for SSH)

ntfy.sh is the most reliable way to get notifications over SSH. No account, no app install required on the server.

**Step 1:** Pick a unique topic name: `my-dev-notifications-a1b2c3`

**Step 2:** Subscribe on your device:
- **Phone**: Install [ntfy app](https://ntfy.sh) ([iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy))
- **Browser**: Open `https://ntfy.sh/your-topic-name` and allow notifications

**Step 3:** Configure:

```yaml
channels:
  ntfy:
    enabled: true
    url: "https://ntfy.sh/my-dev-notifications-a1b2c3"
```

Or via environment variable:

```bash
export NOTIFY_ME_NTFY_URL="https://ntfy.sh/my-dev-notifications-a1b2c3"
```

## How It Works

```
Notification request
  │
  ├─ Local desktop?
  │    ├─ Yes → Desktop notification + Sound
  │    └─ No (SSH/CI) → Fallback chain:
  │         ├─ Terminal bell (\a) — zero config
  │         └─ ntfy.sh push — one URL
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

## FAQ

<details>
<summary>Does it work over SSH?</summary>

Yes. Terminal bell (`\a`) works over SSH with no configuration. For reliable notifications, we recommend setting up ntfy.sh — it sends push notifications to your phone/browser with just a URL.
</details>

<details>
<summary>What works without any configuration?</summary>

Sound and desktop notifications work immediately after `npm install -g notify-me`. No config file needed. For more channels (Telegram, Slack, etc.), run `notify-me --init` and edit `~/.notify-me.yaml`.
</details>

<details>
<summary>Can I use multiple channels at once?</summary>

Yes. All enabled channels fire in parallel. You can have desktop + sound + Telegram + email all going off at the same time.
</details>

<details>
<summary>How is this different from cc-notify?</summary>

cc-notify is a Tauri desktop app (Rust + React). notify-me is a lightweight Node.js CLI — install in seconds, no GUI needed. notify-me also supports China-specific channels (Server酱, Bark) and works as both a Claude Code and Codex CLI plugin.
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
