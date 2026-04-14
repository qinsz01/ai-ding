import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("loadConfig", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `ai-ding-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns default config when no config file exists", () => {
    const config = loadConfig(join(tmpDir, "nonexistent.yaml"));
    expect(config.channels.desktop.enabled).toBe(true);
    expect(config.channels.telegram.enabled).toBe(false);
    expect(config.defaults.title).toBe("ai-ding");
  });

  it("merges YAML config with defaults", () => {
    const configPath = join(tmpDir, "config.yaml");
    writeFileSync(
      configPath,
      `
channels:
  telegram:
    enabled: true
    bot_token: "123:ABC"
    chat_id: "456"
defaults:
  title: "my-project"
`
    );
    const config = loadConfig(configPath);
    expect(config.channels.telegram.enabled).toBe(true);
    expect(config.channels.telegram.bot_token).toBe("123:ABC");
    expect(config.channels.desktop.enabled).toBe(true); // still default
    expect(config.defaults.title).toBe("my-project");
  });

  it("reads config from env vars", () => {
    process.env.AI_DING_TELEGRAM_BOT_TOKEN = "env:token";
    process.env.AI_DING_TELEGRAM_CHAT_ID = "env:chat";
    const config = loadConfig(join(tmpDir, "nonexistent.yaml"));
    expect(config.channels.telegram.bot_token).toBe("env:token");
    expect(config.channels.telegram.chat_id).toBe("env:chat");
    delete process.env.AI_DING_TELEGRAM_BOT_TOKEN;
    delete process.env.AI_DING_TELEGRAM_CHAT_ID;
  });

  it("env vars override YAML values", () => {
    const configPath = join(tmpDir, "config.yaml");
    writeFileSync(
      configPath,
      `channels:\n  telegram:\n    bot_token: "from-yaml"\n`
    );
    process.env.AI_DING_TELEGRAM_BOT_TOKEN = "from-env";
    const config = loadConfig(configPath);
    expect(config.channels.telegram.bot_token).toBe("from-env");
    delete process.env.AI_DING_TELEGRAM_BOT_TOKEN;
  });
});
