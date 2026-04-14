import { Command } from "commander";
import { resolve } from "node:path";
import { writeFileSync, existsSync, readFileSync } from "node:fs";
import { loadConfig } from "./config.js";
import { detectEnvironment } from "./env.js";
import { dispatch } from "./core.js";

const program = new Command();

program
  .name("notify-me")
  .description("Cross-platform notifications for AI coding assistants")
  .version("1.0.0")
  .argument("[message]", "notification message", "Task completed")
  .option("-t, --title <title>", "notification title")
  .option("-c, --channel <channel>", "send to specific channel only")
  .option("--no-desktop", "disable desktop notification")
  .option("--no-sound", "disable sound notification")
  .option("--init", "create default config file")
  .option("--test", "test all enabled notification channels")
  .option("--hook", "read hook event from stdin and send contextual notification")
  .action(async (message: string, opts: Record<string, unknown>) => {
    if (opts.init) {
      initConfig();
      return;
    }

    if (opts.hook) {
      await handleHook();
      return;
    }

    const config = loadConfig();

    // Apply CLI overrides
    if (opts.noDesktop) config.channels.desktop.enabled = false;
    if (opts.noSound) config.channels.sound.enabled = false;

    const title = typeof opts.title === "string" ? opts.title : undefined;
    const channel = typeof opts.channel === "string" ? opts.channel : undefined;

    if (opts.test) {
      console.log("[notify-me] Testing all enabled channels...");
      const env = detectEnvironment();
      await dispatch(`Test notification from notify-me (${env})`, config, env, { title, channel });
      return;
    }

    const env = detectEnvironment();
    await dispatch(message, config, env, { title, channel });
  });

async function handleHook(): Promise<void> {
  const input = await readStdin();
  if (!input) return;

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(input);
  } catch {
    return;
  }

  const event = data.hook_event_name as string | undefined;
  const config = loadConfig();
  const env = detectEnvironment();

  switch (event) {
    case "Stop": {
      const lastMsg = truncate(String(data.last_assistant_message ?? "Task completed"), 200);
      await dispatch(lastMsg, config, env, { title: "Claude Code" });
      break;
    }
    case "Notification": {
      const notifType = data.notification_type ?? data.message ?? "";
      if (String(notifType).includes("idle_prompt") || String(data.message).includes("idle")) {
        await dispatch("Claude is waiting for your input", config, env, { title: "Needs Attention" });
      }
      break;
    }
    case "PreToolUse": {
      const toolName = String(data.tool_name ?? "");
      if (toolName === "AskUserQuestion") {
        const questions = extractQuestions(data.tool_input);
        await dispatch(questions, config, env, { title: "Question" });
      }
      break;
    }
  }
}

function extractQuestions(toolInput: unknown): string {
  if (!toolInput || typeof toolInput !== "object") return "Claude has a question";
  const input = toolInput as Record<string, unknown>;
  const questions = input.questions;
  if (!Array.isArray(questions) || questions.length === 0) return "Claude has a question";
  const texts = questions
    .map((q: Record<string, unknown>) => String(q.question ?? ""))
    .filter(Boolean);
  return texts.length > 0 ? truncate(texts.join("; "), 200) : "Claude has a question";
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let data = "";
    process.stdin.setEncoding("utf-8");
    process.stdin.on("data", (chunk) => { data += chunk; });
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(""));
    // Timeout in case stdin hangs
    setTimeout(() => { resolve(data); }, 3000);
  });
}

function initConfig(): void {
  const dest = resolve(process.env.HOME || "~", ".notify-me.yaml");
  if (existsSync(dest)) {
    console.log(`Config already exists at ${dest}`);
    return;
  }

  const possiblePaths = [
    resolve(import.meta.dirname ?? ".", "..", "default-config.yaml"),
    resolve(import.meta.dirname ?? ".", "default-config.yaml"),
  ];

  let content = "";
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      content = readFileSync(p, "utf-8");
      break;
    }
  }

  if (!content) {
    content = `channels:
  desktop:
    enabled: true
  sound:
    enabled: true
    file: null
  ntfy:
    enabled: false
    url: ""
  telegram:
    enabled: false
    bot_token: ""
    chat_id: ""
  bark:
    enabled: false
    url: ""
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
`;
  }

  writeFileSync(dest, content, "utf-8");
  console.log(`Config created at ${dest}`);
}

program.parse();
