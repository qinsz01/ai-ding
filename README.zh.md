[English](README.md) | **中文**

<h1 align="center">🔔 ai-ding</h1>

<p align="center">
  <strong>再也不用盯着终端等 AI 回复了。</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/ai-ding"><img src="https://img.shields.io/npm/v/ai-ding.svg" alt="npm"></a>
  <a href="https://github.com/qinsz01/ai-ding/actions"><img src="https://img.shields.io/github/actions/workflow/status/qinsz01/ai-ding/ci.yml?branch=master" alt="CI"></a>
  <a href="https://www.npmjs.com/package/ai-ding"><img src="https://img.shields.io/npm/dw/ai-ding" alt="downloads"></a>
  <img src="https://img.shields.io/badge/Node.js-18%2B-brightgreen" alt="Node.js">
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://github.com/qinsz01/ai-ding/issues"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg" alt="PRs Welcome"></a>
</p>

<p align="center">
  <strong>Claude Code</strong> 和 <strong>Codex CLI</strong> 的跨平台通知工具。<br>
  桌面弹窗、声音提醒、Telegram、Bark、Server酱、Slack、邮件 —— 按需选择。<br>
  SSH 远程也能用，基础功能零配置。
</p>

---

## 为什么需要 ai-ding？

你运行 `claude` 然后等……等……10 分钟后发现它 5 分钟前就完成了。更糟的是 —— 它在问你问题，你根本没注意到。

**ai-ding 在 AI 需要你关注时立即提醒：**

- **回复结束时** — 附带回复内容摘要
- **问你问题时** — 直接看到问题文本
- **请求权限时** — 不再错过审批对话框
- **等待你操作时** — 再也不会漏掉提示

## 支持的通知渠道

| 渠道 | macOS | Linux | SSH | 需要配置 |
|------|:-----:|:-----:|:---:|:--------:|
| **桌面弹窗** | ✅ | ✅ | ❌ | 无 |
| **声音提醒** | ✅ | ✅ | ✅ | 无 |
| **Telegram** | ✅ | ✅ | ✅ | Bot token |
| **Slack** | ✅ | ✅ | ✅ | Webhook URL |
| **Bark**（iOS） | ✅ | ✅ | ✅ | Device key |
| **Server酱**（微信） | ✅ | ✅ | ✅ | SendKey |
| **ntfy.sh** | ✅ | ✅ | ✅ | Topic URL |
| **邮件** | ✅ | ✅ | ✅ | SMTP 凭据 |

声音和桌面弹窗开箱即用。在 `~/.ai-ding.yaml` 中启用更多渠道。

## 快速开始

### 作为 Claude Code 插件（推荐）

```
/plugin marketplace add qinsz01/ai-ding
/plugin install ai-ding@qinsz01
```

就这样。Claude 回复结束、提问、请求权限时都会自动通知你。

### 作为 CLI 工具

```bash
npm install -g ai-ding
ai-ding --init    # 创建 ~/.ai-ding.yaml
ai-ding --test    # 测试所有已启用的通知渠道
```

### 作为 Codex CLI 插件

将 marketplace 添加到 `~/.agents/plugins/marketplace.json` 或项目仓库的 `.agents/plugins/marketplace.json`，然后通过 `/plugins` 安装。

## 使用方法

```bash
# 发送通知（自动检测环境）
ai-ding "构建完成"

# 指定标题
ai-ding --title "CI 流水线" "所有测试通过"

# 只发送到指定渠道
ai-ding --channel telegram "部署失败"

# 禁用特定渠道
ai-ding --no-desktop --no-sound "静默提醒"

# 测试所有已配置的通知渠道
ai-ding --test

# 初始化配置文件
ai-ding --init
```

### 输出反馈

每次调用都会打印各渠道的发送结果：

```
[ai-ding] ✓ sound: terminal bell
[ai-ding] ✓ telegram: sent to chat 1234...
[ai-ding] ✓ slack: sent to Slack webhook
[ai-ding] Done: 3 sent.
```

如果某个渠道发送失败，会显示具体错误：

```
[ai-ding] ✓ sound: terminal bell
[ai-ding] ✗ telegram: HTTP 401: Unauthorized
[ai-ding] Done: 1 sent, 1 failed.
```

### 智能通知（插件模式）

作为 Claude Code 插件安装后，ai-ding 会发送上下文感知的通知：

| 触发时机 | 通知内容 |
|----------|---------|
| Claude 回复结束 | 最后一条回复的摘要 |
| Claude 提问 | 问题文本 |
| Claude 请求权限 | "Permission needed: Bash" |
| Claude 等待操作 | "Claude is waiting for your input" |

Subagent 活动（Explore、code-reviewer 等）**不会触发通知** —— 只在你需要操作时才提醒。

## 配置

编辑 `~/.ai-ding.yaml`：

```yaml
channels:
  desktop:
    enabled: true
  sound:
    enabled: true
    file: null           # 可选：自定义音频文件路径
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
  title: "ai-ding"
```

### 环境变量

通过 `AI_DING_*` 环境变量覆盖任意配置项：

| 环境变量 | 对应配置路径 |
|----------|-------------|
| `AI_DING_TELEGRAM_BOT_TOKEN` | `channels.telegram.bot_token` |
| `AI_DING_TELEGRAM_CHAT_ID` | `channels.telegram.chat_id` |
| `AI_DING_SLACK_WEBHOOK_URL` | `channels.slack.webhook_url` |
| `AI_DING_NTFY_URL` | `channels.ntfy.url` |
| `AI_DING_BARK_URL` | `channels.bark.url` |
| `AI_DING_BARK_DEVICE_KEY` | `channels.bark.device_key` |
| `AI_DING_SERVERCHAN_SENDKEY` | `channels.serverchan.sendkey` |
| `AI_DING_EMAIL_SMTP_HOST` | `channels.email.smtp_host` |
| `AI_DING_EMAIL_FROM` | `channels.email.from` |
| `AI_DING_EMAIL_TO` | `channels.email.to` |
| `AI_DING_EMAIL_USER` | `channels.email.user` |
| `AI_DING_EMAIL_PASSWORD` | `channels.email.password` |

环境变量优先级高于 YAML 配置文件。

## SSH 远程环境设置

通过 SSH 连接时，桌面通知无法传到你的本地电脑。ai-ding 使用逐级降级策略：

1. **终端响铃 (`\a`)** — 零配置，但在 tmux 下可能不生效
2. **ntfy.sh** — 推送通知到手机/浏览器，只需配置一个 URL（推荐）

### 开启 SSH 终端响铃

| 终端 | 开启方法 |
|------|---------|
| **Windows Terminal** | 打开 `settings.json`，在 profile 中添加 `"bellStyle": "audible"` |
| **iTerm2**（macOS） | Preferences → Profiles → Terminal → 勾选 "Audible bell" |
| **macOS Terminal** | 偏好设置 → 描述文件 → 高级 → 勾选 "声音响铃" |
| **VS Code Terminal** | 设置中添加 `"terminal.integrated.enableBell": true` |
| **PuTTY** | Configuration → Terminal → Bell → 设为 "Play default sound" |
| **tmux** | 在 `~/.tmux.conf` 中添加 `set -g bell-action any` |

> **注意：** 通过 tmux + SSH 使用终端响铃不可靠。如果你使用 tmux，强烈建议配置 ntfy.sh。

### 配置 ntfy.sh（SSH 推荐方案）

ntfy.sh 是 SSH 下最可靠的通知方式。无需注册，服务器端不需要安装任何东西。

**第一步：** 选一个唯一的主题名：`my-dev-notifications-a1b2c3`

**第二步：** 在你的设备上订阅：
- **手机**：安装 [ntfy 应用](https://ntfy.sh)（[iOS](https://apps.apple.com/us/app/ntfy/id1625396347) / [Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy)）
- **浏览器**：打开 `https://ntfy.sh/your-topic-name` 允许通知

**第三步：** 配置：

```yaml
channels:
  ntfy:
    enabled: true
    url: "https://ntfy.sh/my-dev-notifications-a1b2c3"
```

或者直接用环境变量：

```bash
export AI_DING_NTFY_URL="https://ntfy.sh/my-dev-notifications-a1b2c3"
```

## 工作原理

```
通知请求
  │
  ├─ 本地桌面环境？
  │    ├─ 是 → 桌面弹窗 + 声音提醒
  │    └─ 否（SSH/CI） → 降级策略：
  │         ├─ 终端响铃 (\a) — 零配置
  │         └─ ntfy.sh 推送 — 只需一个 URL
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

## 常见问题

<details>
<summary>SSH 远程能用吗？</summary>

可以。终端响铃（`\a`）无需配置即可在 SSH 下工作。如果需要更可靠的通知，推荐配置 ntfy.sh —— 只需一个 URL 就能推送通知到手机/浏览器。
</details>

<details>
<summary>不配置能用吗？</summary>

可以。`npm install -g ai-ding` 安装后声音和桌面通知立即生效。如需更多渠道（Telegram、Slack 等），运行 `ai-ding --init` 编辑配置。
</details>

<details>
<summary>可以同时启用多个渠道吗？</summary>

可以。所有已启用的渠道并行发送。你可以同时收到桌面弹窗 + 声音 + Telegram + 邮件。
</details>

<details>
<summary>和 cc-notify 有什么区别？</summary>

cc-notify 是一个 Tauri 桌面应用（Rust + React），较重。ai-ding 是轻量 Node.js CLI —— 秒装，不需要 GUI。ai-ding 还支持中国特色渠道（Server酱、Bark），同时兼容 Claude Code 和 Codex CLI。
</details>

## 参与贡献

欢迎提交 PR！Fork 本仓库，做出修改，然后发起 Pull Request。

```bash
git clone https://github.com/qinsz01/ai-ding.git
cd ai-ding
npm install
npm test
```

## 许可证

[MIT](LICENSE)
