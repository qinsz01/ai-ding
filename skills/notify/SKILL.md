---
name: notify
description: Send a notification to the user via configured channels (desktop, sound, Telegram, Bark, Slack, email). Use when a long task completes or when you need the user's attention.
---

Send a notification to the user by running the CLI tool:

```bash
ai-ding "<message>"
```

**Important:** Always include a concise summary of what was accomplished or what needs attention in the message. Do not use generic messages like "Task completed" or "Done".

Examples:
- `ai-ding "Fixed auth bug: session tokens now expire after 24h"` — descriptive message
- `ai-ding --title "Build" "All 48 tests passed, pushed to master"` — with a custom title
- `ai-ding --channel telegram "Deploy failed: connection refused on port 443"` — to specific channel
- `ai-ding --test` — test all configured channels

The user must have configured channels in `~/.ai-ding.yaml` (run `ai-ding --init` to create).
