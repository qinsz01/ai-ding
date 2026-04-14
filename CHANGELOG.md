# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-04-15

### Added
- Desktop notifications for macOS (osascript) and Linux (notify-send)
- Sound alerts via terminal bell and audio file playback
- Telegram Bot notifications
- Bark (iOS push) notifications
- Server酱 (WeChat) notifications
- Slack webhook notifications
- Email notifications via SMTP
- ntfy.sh push notifications (recommended for SSH)
- SSH-aware environment detection with progressive fallback
- Contextual hook-mode notifications for Claude Code:
  - Stop: shows last assistant message summary
  - AskUserQuestion: shows the question text
  - PermissionRequest: alerts on permission dialogs
  - Notification (idle_prompt): alerts when waiting for input
- Per-channel success/failure feedback with ✓/✗ output
- `--title` and `--channel` CLI options
- `--hook` flag for stdin-based event processing
- `--init` to create default config file
- `--test` to verify all enabled channels
- Subagent event filtering (only notifies on user-facing actions)
- YAML config file (`~/.ai-ding.yaml`)
- Environment variable overrides (`AI_DING_*`)
- Claude Code plugin manifest
- Codex CLI plugin manifest
- Dual-language README (English + Chinese)

### Security
- Shell injection prevention via `execFile` with argument arrays
- Telegram chatId truncation in output to prevent info leak
