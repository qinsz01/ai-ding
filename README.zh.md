[English](README.md) | **中文**

<h1 align="center">notify-me</h1>

<p align="center">
  <strong>AI 编程助手的跨平台通知工具</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/notify-me"><img src="https://img.shields.io/npm/v/notify-me.svg" alt="npm"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js">
</p>

<p align="center">
  当 Claude Code 或 Codex CLI 完成回复时，自动发送通知。<br>
  支持桌面弹窗、声音提醒、Telegram、Bark、Server酱、Slack、邮件 —— 按需选择通知渠道。
</p>

---

## 功能特性

- **桌面通知** — macOS 和 Linux 原生弹窗，开箱即用
- **声音提醒** — 终端响铃，SSH 远程也能用
- **即时消息** — Telegram Bot、Bark（iOS）、Server酱（微信）、Slack Webhook
- **邮件通知** — 支持任意 SMTP 邮件服务
- **SSH 感知** — 自动检测远程环境，桌面 → 响铃 → 推送 逐级降级
- **双平台插件** — 一套代码，同时支持 Claude Code 和 Codex CLI

## 快速开始

### 作为 CLI 工具安装

```bash
npm install -g notify-me
notify-me --init    # 创建 ~/.notify-me.yaml 配置文件
notify-me --test    # 测试所有已启用的通知渠道
```

### 作为 Claude Code 插件安装

```
/plugin marketplace add qinsz01/notify-me
/plugin install notify-me@qinsz01
```

安装后，每次 Claude 回复完毕都会自动通知你。

### 作为 Codex CLI 插件安装

将 marketplace 添加到 `~/.agents/plugins/marketplace.json` 或项目仓库的 `.agents/plugins/marketplace.json`，然后通过 `/plugins` 安装。

## 使用方法

```bash
# 发送通知（自动检测环境）
notify-me "构建完成"

# 指定标题
notify-me --title "CI 流水线" "所有测试通过"

# 禁用特定渠道
notify-me --no-desktop --no-sound "静默提醒"

# 测试所有已配置的通知渠道
notify-me --test

# 初始化配置文件
notify-me --init
```

## 配置

编辑 `~/.notify-me.yaml`：

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

### 环境变量

通过 `NOTIFY_ME_*` 环境变量覆盖任意配置项：

| 环境变量 | 对应配置路径 |
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

环境变量优先级高于 YAML 配置文件。

## 工作原理

```
通知请求
  │
  ├─ 本地桌面环境？
  │    ├─ 是 → 桌面弹窗 + 声音提醒
  │    └─ 否（SSH/CI） → 降级策略：
  │         ├─ 终端响铃 (\a) — 零配置，始终可用
  │         ├─ ntfy.sh 推送 — 只需一个 URL
  │         └─ 本地中继 — SSH 隧道转发完整桌面弹窗
  │
  └─ 并行推送：Telegram / Bark / Slack / 邮件
               （启用即发送，不受环境影响）
```

### 渠道配置指南

<details>
<summary>Telegram Bot</summary>

1. 在 Telegram 上找到 [@BotFather](https://t.me/BotFather) 创建一个 Bot
2. 从 BotFather 获取 `bot_token`
3. 给你的 Bot 发一条消息，然后访问：
   ```
   https://api.telegram.org/bot<TOKEN>/getUpdates
   ```
4. 在返回结果中找到你的 `chat_id`

```yaml
telegram:
  enabled: true
  bot_token: "123456:ABC-DEF"
  chat_id: "987654321"
```
</details>

<details>
<summary>Bark（iOS 推送）</summary>

1. 从 App Store 安装 [Bark](https://apps.apple.com/app/bark-customed-notifications/id1403753865)
2. 打开 App 获取服务器 URL 和设备密钥

```yaml
bark:
  enabled: true
  url: "https://api.day.app"
  device_key: "your-device-key"
```
</details>

<details>
<summary>Server酱（微信推送）</summary>

1. 在 [sct.ftqq.com](https://sct.ftqq.com/) 注册
2. 关注微信公众号，获取 SendKey

```yaml
serverchan:
  enabled: true
  sendkey: "SCTxxxx"
```
</details>

<details>
<summary>Slack</summary>

1. 在 Slack 工作区创建一个 [Incoming Webhook](https://api.slack.com/messaging/webhooks)
2. 复制 Webhook URL

```yaml
slack:
  enabled: true
  webhook_url: "https://hooks.slack.com/services/T.../B.../xxx"
```
</details>

<details>
<summary>ntfy.sh（SSH 远程降级方案）</summary>

ntfy.sh 是一个免费的开源推送通知服务，无需注册。

1. 选一个唯一的主题名（类似频道名）
2. 在 [ntfy 应用](https://ntfy.sh)（iOS/Android/Web）中订阅该主题

```yaml
ntfy:
  enabled: true
  url: "https://ntfy.sh/your-unique-topic-name"
```

也可以自建 ntfy.sh 服务以保护隐私。
</details>

<details>
<summary>邮件通知（SMTP）</summary>

支持任意 SMTP 服务（Gmail、SendGrid、Mailgun 等）。

Gmail 用户需要使用[应用专用密码](https://support.google.com/accounts/answer/185833)：

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

## 参与贡献

欢迎提交 PR！Fork 本仓库，做出修改，然后发起 Pull Request。

```bash
git clone https://github.com/qinsz01/notify-me.git
cd notify-me
npm install
npm test
```

## 许可证

[MIT](LICENSE)
