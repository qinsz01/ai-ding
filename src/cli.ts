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
  .action(async (message: string, opts: Record<string, unknown>) => {
    if (opts.init) {
      initConfig();
      return;
    }

    const config = loadConfig();

    // Apply CLI overrides
    if (opts.noDesktop) config.channels.desktop.enabled = false;
    if (opts.noSound) config.channels.sound.enabled = false;

    if (opts.test) {
      console.log("[notify-me] Testing all enabled channels...");
      const env = detectEnvironment();
      await dispatch(`Test notification from notify-me (${env})`, config, env);
      console.log("[notify-me] Done.");
      return;
    }

    const env = detectEnvironment();
    await dispatch(message, config, env);
  });

function initConfig(): void {
  const dest = resolve(process.env.HOME || "~", ".notify-me.yaml");
  if (existsSync(dest)) {
    console.log(`Config already exists at ${dest}`);
    return;
  }

  // Try to read the default config from the installed package location
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
    // Fallback inline config
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
