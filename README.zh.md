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

## SSH 远程环境设置

通过 SSH 连接时，桌面通知无法传到你的本地电脑。notify-me 使用逐级降级策略：

1. **终端响铃 (`\a`)** — 零配置，但需要你的本地终端支持
2. **ntfy.sh** — 推送通知到手机/浏览器，只需配置一个 URL

### 开启 SSH 终端响铃

终端响铃能不能发出声音，取决于你的**本地终端软件**。以下是各终端的开启方法：

| 终端 | 开启方法 |
|------|---------|
| **Windows Terminal** | 打开 `settings.json`（设置 → 左下角"打开 JSON 文件"），在 profile 中添加：`"bellStyle": "audible"` 或 `"bellStyle": "all"`。还可以用 `"bellSound": "C:/path/to/bell.wav"` 自定义铃声 |
| **iTerm2**（macOS） | Preferences → Profiles → Terminal → 勾选 "Audible bell" |
| **macOS Terminal** | 偏好设置 → 描述文件 → 高级 → 勾选 "声音响铃" |
| **VS Code Terminal** | 设置中添加：`"terminal.integrated.enableBell": true` |
| **PuTTY** | Configuration → Terminal → Bell → 设为 "Play default sound" |
| **tmux** | 在 `~/.tmux.conf` 中添加：`set -g bell-action any` |

设置完成后，用这个命令测试：`printf '\a'` — 应该能听到"嘟"的一声。

### 配置 ntfy.sh（SSH 推荐方案）

ntfy.sh 是 SSH 下最可靠的通知方式。无需注册，服务器端不需要安装任何东西。

**第一步：选一个唯一的主题名**

主题名类似频道名 — 知道名字的人都能发送/接收。建议用难以猜到的名字：

```
my-dev-notifications-a1b2c3
```

**第二步：在你的设备上订阅**

- **手机**：安装 [ntfy 应用](https://ntfy.sh)（[iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)），订阅你的主题
- **浏览器**：打开 `https://ntfy.sh/your-topic-name`，允许通知
- **桌面**：使用 [ntfy 桌面版](https://ntfy.sh) 或 PWA

**第三步：配置 notify-me**

```yaml
# ~/.notify-me.yaml
channels:
  ntfy:
    enabled: true
    url: "https://ntfy.sh/my-dev-notifications-a1b2c3"
```

或者直接用环境变量（无需配置文件）：

```bash
export NOTIFY_ME_NTFY_URL="https://ntfy.sh/my-dev-notifications-a1b2c3"
```

**第四步：测试**

```bash
notify-me "Hello from notify-me"
```

几秒内你应该能在订阅设备上收到推送通知。

> **提示**：如果推送内容敏感，可以[自建 ntfy.sh](https://docs.ntfy.sh/install/) 或开启[访问控制](https://docs.ntfy.sh/config/#access-control)。

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

免费开源推送通知服务。**无需注册。** SSH 下最佳方案。

1. 选一个唯一的主题名（如 `my-dev-alerts-xyz123`）
2. 在你的设备上订阅：
   - **iOS**：[App Store](https://apps.apple.com/us/app/ntfy/id1625396347)
   - **Android**：[Google Play](https://play.google.com/store/apps/details?id=io.heckel.ntfy)
   - **浏览器**：打开 `https://ntfy.sh/your-topic` 允许通知
3. 测试：`curl -d "Hello" https://ntfy.sh/your-topic`

```yaml
ntfy:
  enabled: true
  url: "https://ntfy.sh/your-topic-name"
```

自建服务：`docker run -p 80:80 binwiederhier/ntfy serve` — 详见 [文档](https://docs.ntfy.sh/install/)。
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
