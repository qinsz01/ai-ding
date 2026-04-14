#!/usr/bin/env node

// src/cli.ts
import { Command } from "commander";
import { resolve as resolve2 } from "path";
import { writeFileSync, existsSync as existsSync3, readFileSync as readFileSync2 } from "fs";

// src/config.ts
import { readFileSync, existsSync } from "fs";
import yaml from "js-yaml";
import { resolve } from "path";
var DEFAULT_CONFIG = {
  channels: {
    desktop: { enabled: true },
    sound: { enabled: true, file: null },
    ntfy: { enabled: false, url: "" },
    telegram: { enabled: false, bot_token: "", chat_id: "" },
    bark: { enabled: false, url: "", device_key: "" },
    serverchan: { enabled: false, sendkey: "" },
    slack: { enabled: false, webhook_url: "" },
    email: {
      enabled: false,
      smtp_host: "",
      smtp_port: 587,
      from: "",
      to: "",
      user: "",
      password: ""
    }
  },
  remote: { fallback_order: ["sound", "ntfy"] },
  defaults: { message: "Task completed", title: "ai-ding" }
};
function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key]) && target[key] && typeof target[key] === "object" && !Array.isArray(target[key])) {
      result[key] = deepMerge(
        target[key],
        source[key]
      );
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
var ENV_VAR_MAP = {
  AI_DING_TELEGRAM_BOT_TOKEN: "channels.telegram.bot_token",
  AI_DING_TELEGRAM_CHAT_ID: "channels.telegram.chat_id",
  AI_DING_BARK_URL: "channels.bark.url",
  AI_DING_BARK_DEVICE_KEY: "channels.bark.device_key",
  AI_DING_SERVERCHAN_SENDKEY: "channels.serverchan.sendkey",
  AI_DING_SLACK_WEBHOOK_URL: "channels.slack.webhook_url",
  AI_DING_NTFY_URL: "channels.ntfy.url",
  AI_DING_EMAIL_SMTP_HOST: "channels.email.smtp_host",
  AI_DING_EMAIL_SMTP_PORT: "channels.email.smtp_port",
  AI_DING_EMAIL_FROM: "channels.email.from",
  AI_DING_EMAIL_TO: "channels.email.to",
  AI_DING_EMAIL_USER: "channels.email.user",
  AI_DING_EMAIL_PASSWORD: "channels.email.password"
};
function setNestedValue(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}
function loadConfig(configPath) {
  let merged = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  const paths = configPath ? [configPath] : [
    resolve(process.env.HOME || "~", ".ai-ding.yaml"),
    resolve(".ai-ding.yaml")
  ];
  for (const p of paths) {
    if (existsSync(p)) {
      const raw = readFileSync(p, "utf-8");
      const parsed = yaml.load(raw);
      if (parsed) {
        merged = deepMerge(merged, parsed);
      }
      break;
    }
  }
  for (const [envVar, path] of Object.entries(ENV_VAR_MAP)) {
    const value = process.env[envVar];
    if (value) {
      setNestedValue(merged, path, value);
    }
  }
  return merged;
}

// src/env.ts
function detectEnvironment() {
  if (process.env.CI) return "ci";
  if (process.env.SSH_CONNECTION || process.env.SSH_TTY) return "ssh";
  if (process.env.DISPLAY || process.env.TERM_PROGRAM) return "local";
  return "local";
}

// src/notifiers/desktop.ts
import { execFile } from "child_process";
import { promisify } from "util";
var execFileAsync = promisify(execFile);
var DesktopNotifier = class {
  name = "desktop";
  execFileAsync;
  constructor(execFileFn) {
    this.execFileAsync = execFileFn ?? execFileAsync;
  }
  async send(message, options) {
    const title = options?.title ?? "ai-ding";
    try {
      if (process.platform === "darwin") {
        await this.execFileAsync("osascript", [
          "-e",
          `display notification "${escapeAppleScript(message)}" with title "${escapeAppleScript(title)}"`
        ]);
      } else {
        const urgency = options?.urgency ?? "normal";
        await this.execFileAsync("notify-send", [`-u`, urgency, title, message]);
      }
      return { channel: this.name, success: true, message: "desktop notification sent" };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
};
function escapeAppleScript(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// src/notifiers/sound.ts
import { execFile as execFile2 } from "child_process";
import { promisify as promisify2 } from "util";
import { existsSync as existsSync2 } from "fs";
import { basename } from "path";
var execFileAsync2 = promisify2(execFile2);
var DEFAULT_SOUND_FILES = [
  "/usr/share/sounds/freedesktop/stereo/complete.oga",
  "/usr/share/sounds/freedesktop/stereo/bell.oga",
  "/usr/share/sounds/freedesktop/stereo/message.oga"
];
var SoundNotifier = class {
  name = "sound";
  customFile;
  _execFileAsync;
  constructor(customFile, execFn) {
    this.customFile = customFile ?? null;
    this._execFileAsync = execFn ?? ((file, args, opts) => execFileAsync2(file, args, opts));
  }
  async send(_message, _options) {
    process.stdout.write("\x07");
    const audioResult = await this.playSound();
    if (audioResult) {
      return { channel: this.name, success: true, message: `terminal bell + audio (${audioResult})` };
    }
    return { channel: this.name, success: true, message: "terminal bell" };
  }
  async playSound() {
    const candidates = this.customFile ? [this.customFile] : DEFAULT_SOUND_FILES;
    const soundFile = candidates.find((f) => existsSync2(f));
    if (!soundFile) return null;
    try {
      if (soundFile.endsWith(".oga")) {
        await this._execFileAsync("paplay", [soundFile], { timeout: 3e3 });
      } else {
        await this._execFileAsync("aplay", [soundFile], { timeout: 3e3 });
      }
      return basename(soundFile);
    } catch {
      return null;
    }
  }
};

// src/notifiers/ntfy.ts
var NtfyNotifier = class {
  name = "ntfy";
  url;
  constructor(url) {
    this.url = url;
  }
  async send(message, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: {
          Title: options?.title ?? "ai-ding",
          Priority: options?.urgency === "critical" ? "urgent" : "default"
        },
        body: message,
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to ${this.url}` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/notifiers/telegram.ts
var TelegramNotifier = class {
  name = "telegram";
  botToken;
  chatId;
  constructor(botToken, chatId) {
    this.botToken = botToken;
    this.chatId = chatId;
  }
  async send(message, options) {
    const title = options?.title ?? "ai-ding";
    const text = `*${title}*
${message}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: this.chatId,
            text,
            parse_mode: "Markdown"
          }),
          signal: controller.signal
        }
      );
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to chat ${this.chatId.slice(0, 4)}...` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/notifiers/bark.ts
var BarkNotifier = class {
  name = "bark";
  serverUrl;
  deviceKey;
  constructor(serverUrl, deviceKey) {
    this.serverUrl = serverUrl.replace(/\/$/, "");
    this.deviceKey = deviceKey;
  }
  async send(message, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(`${this.serverUrl}/${this.deviceKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: options?.title ?? "ai-ding",
          body: message,
          sound: options?.sound ? "alarm" : void 0
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to device ${this.deviceKey.slice(0, 8)}...` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/notifiers/serverchan.ts
var ServerChanNotifier = class {
  name = "serverchan";
  sendkey;
  constructor(sendkey) {
    this.sendkey = sendkey;
  }
  async send(message, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(`https://sctapi.ftqq.com/${this.sendkey}.send`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          title: options?.title ?? "ai-ding",
          desp: message
        }).toString(),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent via ServerChan` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/notifiers/slack.ts
var SlackNotifier = class {
  name = "slack";
  webhookUrl;
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
  }
  async send(message, options) {
    const title = options?.title ?? "ai-ding";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5e3);
    try {
      const res = await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `*${title}*
${message}` }),
        signal: controller.signal
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        return { channel: this.name, success: false, message: `HTTP ${res.status}: ${body}` };
      }
      return { channel: this.name, success: true, message: `sent to Slack webhook` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    } finally {
      clearTimeout(timeout);
    }
  }
};

// src/notifiers/email.ts
import nodemailer from "nodemailer";
var EmailNotifier = class {
  name = "email";
  config;
  constructor(config) {
    this.config = config;
  }
  async send(message, options) {
    const transporter = nodemailer.createTransport({
      host: this.config.smtp_host,
      port: this.config.smtp_port,
      auth: {
        user: this.config.user,
        pass: this.config.password
      }
    });
    try {
      const info = await transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject: options?.title ?? "ai-ding",
        text: message
      });
      return { channel: this.name, success: true, message: `sent to ${this.config.to} (${info.messageId})` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
};

// src/core.ts
function buildNotifiers(config, env, channel) {
  const notifiers = [];
  const ch = config.channels;
  if (ch.ntfy.enabled && ch.ntfy.url) {
    notifiers.push(new NtfyNotifier(ch.ntfy.url));
  }
  if (ch.telegram.enabled && ch.telegram.bot_token && ch.telegram.chat_id) {
    notifiers.push(new TelegramNotifier(ch.telegram.bot_token, ch.telegram.chat_id));
  }
  if (ch.bark.enabled && ch.bark.url && ch.bark.device_key) {
    notifiers.push(new BarkNotifier(ch.bark.url, ch.bark.device_key));
  }
  if (ch.serverchan.enabled && ch.serverchan.sendkey) {
    notifiers.push(new ServerChanNotifier(ch.serverchan.sendkey));
  }
  if (ch.slack.enabled && ch.slack.webhook_url) {
    notifiers.push(new SlackNotifier(ch.slack.webhook_url));
  }
  if (ch.email.enabled && ch.email.smtp_host && ch.email.to) {
    notifiers.push(new EmailNotifier(ch.email));
  }
  if (env === "local") {
    if (ch.desktop.enabled) notifiers.push(new DesktopNotifier());
    if (ch.sound.enabled) notifiers.push(new SoundNotifier(ch.sound.file));
  } else {
    for (const name of config.remote.fallback_order) {
      if (name === "sound" && ch.sound.enabled) notifiers.push(new SoundNotifier(ch.sound.file));
    }
  }
  if (channel) {
    return notifiers.filter((n) => n.name === channel);
  }
  return notifiers;
}
async function dispatch(message, config, env, options) {
  const notifiers = buildNotifiers(config, env, options?.channel);
  const title = options?.title ?? config.defaults.title;
  if (notifiers.length === 0) {
    if (options?.channel) {
      console.log(`[ai-ding] Channel '${options.channel}' is not enabled or configured.`);
    } else {
      console.log("[ai-ding] No channels enabled or configured.");
    }
    return [];
  }
  const settled = await Promise.allSettled(
    notifiers.map((n) => n.send(message, { title }))
  );
  const results = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    return { channel: notifiers[i].name, success: false, message: s.reason?.message ?? String(s.reason) };
  });
  for (const r of results) {
    const icon = r.success ? "\u2713" : "\u2717";
    console.log(`[ai-ding] ${icon} ${r.channel}: ${r.message}`);
  }
  const ok = results.filter((r) => r.success).length;
  const fail = results.filter((r) => !r.success).length;
  console.log(`[ai-ding] Done: ${ok} sent${fail > 0 ? `, ${fail} failed` : ""}.`);
  return results;
}

// src/hook.ts
function truncate(s, max) {
  if (s.length <= max) return s;
  return s.slice(0, max - 3) + "...";
}
function extractQuestions(toolInput) {
  if (!toolInput || typeof toolInput !== "object") return "Claude has a question";
  const input = toolInput;
  const questions = input.questions;
  if (!Array.isArray(questions) || questions.length === 0) return "Claude has a question";
  const texts = questions.map((q) => String(q.question ?? "")).filter(Boolean);
  return texts.length > 0 ? truncate(texts.join("; "), 200) : "Claude has a question";
}
async function handleHook(input) {
  if (!input) return;
  let data;
  try {
    data = JSON.parse(input);
  } catch {
    console.warn("[ai-ding] --hook: failed to parse stdin JSON");
    return;
  }
  if (data.agent_id) return;
  const event = data.hook_event_name;
  const config = loadConfig();
  const env = detectEnvironment();
  switch (event) {
    case "Stop": {
      const raw = data.last_assistant_message;
      const lastMsg = truncate(typeof raw === "string" && raw ? raw : "Task completed", 200);
      await dispatch(lastMsg, config, env, { title: "Claude Code" });
      break;
    }
    case "StopFailure": {
      const error = String(data.error ?? "unknown error");
      const details = data.error_details ? `: ${data.error_details}` : "";
      await dispatch(truncate(`API Error: ${error}${details}`, 200), config, env, { title: "Claude Code Error" });
      break;
    }
    case "Notification": {
      const msg = String(data.message ?? "");
      const notifType = String(data.notification_type ?? "");
      if (notifType === "idle_prompt" || notifType === "permission_prompt" || msg.includes("idle") || msg.includes("permission")) {
        await dispatch("Claude is waiting for your input", config, env, { title: "Needs Attention" });
      } else {
        await dispatch(truncate(msg || notifType || "Unknown notification", 200), config, env, { title: "Claude Code" });
      }
      break;
    }
    case "PreToolUse": {
      const toolName = String(data.tool_name ?? "");
      if (toolName === "AskUserQuestion") {
        const questions = extractQuestions(data.tool_input);
        await dispatch(questions, config, env, { title: "Question" });
      } else if (toolName === "ExitPlanMode") {
        await dispatch("Plan ready for your approval", config, env, { title: "Plan Review" });
      }
      break;
    }
    case "PermissionRequest": {
      const toolName = String(data.tool_name ?? "");
      await dispatch(`Permission needed: ${toolName || "tool"}`, config, env, { title: "Needs Attention" });
      break;
    }
  }
}

// src/cli.ts
var program = new Command();
program.name("ai-ding").description("Cross-platform notifications for AI coding assistants").version("1.0.0").argument("[message]", "notification message", "Task completed").option("-t, --title <title>", "notification title").option("-c, --channel <channel>", "send to specific channel only").option("--no-desktop", "disable desktop notification").option("--no-sound", "disable sound notification").option("--init", "create default config file").option("--test", "test all enabled notification channels").option("--hook", "read hook event from stdin and send contextual notification").action(async (message, opts) => {
  if (opts.init) {
    initConfig();
    return;
  }
  if (opts.hook) {
    const input = await readStdin();
    await handleHook(input);
    return;
  }
  const config = loadConfig();
  if (opts.noDesktop) config.channels.desktop.enabled = false;
  if (opts.noSound) config.channels.sound.enabled = false;
  const title = typeof opts.title === "string" ? opts.title : void 0;
  const channel = typeof opts.channel === "string" ? opts.channel : void 0;
  if (opts.test) {
    console.log("[ai-ding] Testing all enabled channels...");
    const env2 = detectEnvironment();
    await dispatch(`Test notification from ai-ding (${env2})`, config, env2, { title, channel });
    return;
  }
  const env = detectEnvironment();
  await dispatch(message, config, env, { title, channel });
});
function readStdin() {
  return new Promise((resolve3) => {
    let data = "";
    let settled = false;
    process.stdin.setEncoding("utf-8");
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        process.stdin.destroy();
        resolve3(data);
      }
    }, 3e3);
    process.stdin.on("data", (chunk) => {
      data += chunk;
    });
    process.stdin.on("end", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve3(data);
      }
    });
    process.stdin.on("error", () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve3("");
      }
    });
  });
}
function initConfig() {
  const dest = resolve2(process.env.HOME || "~", ".ai-ding.yaml");
  if (existsSync3(dest)) {
    console.log(`Config already exists at ${dest}`);
    return;
  }
  const possiblePaths = [
    resolve2(import.meta.dirname ?? ".", "..", "default-config.yaml"),
    resolve2(import.meta.dirname ?? ".", "default-config.yaml")
  ];
  let content = "";
  for (const p of possiblePaths) {
    if (existsSync3(p)) {
      content = readFileSync2(p, "utf-8");
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
  title: "ai-ding"
`;
  }
  writeFileSync(dest, content, "utf-8");
  console.log(`Config created at ${dest}`);
}
program.parse();
