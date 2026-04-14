import type { Config, Environment, Notifier, NotifyResult } from "./notifiers/types.js";
import { DesktopNotifier } from "./notifiers/desktop.js";
import { SoundNotifier } from "./notifiers/sound.js";
import { NtfyNotifier } from "./notifiers/ntfy.js";
import { TelegramNotifier } from "./notifiers/telegram.js";
import { BarkNotifier } from "./notifiers/bark.js";
import { ServerChanNotifier } from "./notifiers/serverchan.js";
import { SlackNotifier } from "./notifiers/slack.js";
import { EmailNotifier } from "./notifiers/email.js";

function buildNotifiers(config: Config, env: Environment, channel?: string): Notifier[] {
  const notifiers: Notifier[] = [];
  const ch = config.channels;

  // Network notifiers: always fire if enabled, regardless of env
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

  // Local-only notifiers
  if (env === "local") {
    if (ch.desktop.enabled) notifiers.push(new DesktopNotifier());
    if (ch.sound.enabled) notifiers.push(new SoundNotifier(ch.sound.file));
  } else {
    // SSH/CI fallback
    for (const name of config.remote.fallback_order) {
      if (name === "sound" && ch.sound.enabled) notifiers.push(new SoundNotifier(ch.sound.file));
    }
  }

  // Filter to specific channel if requested
  if (channel) {
    return notifiers.filter((n) => n.name === channel);
  }

  return notifiers;
}

export async function dispatch(
  message: string,
  config: Config,
  env: Environment,
  options?: { title?: string; channel?: string }
): Promise<NotifyResult[]> {
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

  const results: NotifyResult[] = settled.map((s, i) => {
    if (s.status === "fulfilled") return s.value;
    return { channel: notifiers[i].name, success: false, message: s.reason?.message ?? String(s.reason) };
  });

  // Print per-channel results
  for (const r of results) {
    const icon = r.success ? "✓" : "✗";
    console.log(`[ai-ding] ${icon} ${r.channel}: ${r.message}`);
  }

  const ok = results.filter((r) => r.success).length;
  const fail = results.filter((r) => !r.success).length;
  console.log(`[ai-ding] Done: ${ok} sent${fail > 0 ? `, ${fail} failed` : ""}.`);

  return results;
}
