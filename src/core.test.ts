import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { dispatch } from "./core.js";
import type { Config } from "./notifiers/types.js";

// Mock DesktopNotifier so it never calls real exec
vi.mock("./notifiers/desktop.js", () => ({
  DesktopNotifier: vi.fn().mockImplementation(() => ({
    name: "desktop",
    send: vi.fn().mockResolvedValue({ channel: "desktop", success: true, message: "desktop notification sent" }),
  })),
}));

const baseConfig: Config = {
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
      password: "",
    },
  },
  remote: { fallback_order: ["sound", "ntfy"] },
  defaults: { message: "Task completed", title: "ai-ding" },
};

describe("dispatch", () => {
  let writeSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    writeSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("sends to desktop + sound in local env and returns results", async () => {
    const results = await dispatch("Hello", baseConfig, "local");

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(writeSpy).toHaveBeenCalledWith("\x07");
    expect(logSpy).toHaveBeenCalled();
  });

  it("skips desktop in ssh env and uses fallback", async () => {
    await dispatch("Hello", baseConfig, "ssh");
    expect(writeSpy).toHaveBeenCalledWith("\x07");
  });

  it("sends to telegram when enabled", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const config: Config = {
      ...baseConfig,
      channels: {
        ...baseConfig.channels,
        telegram: { enabled: true, bot_token: "tok", chat_id: "123" },
      },
    };

    const results = await dispatch("Test", config, "local");
    expect(fetchSpy).toHaveBeenCalled();

    const tgResult = results.find((r) => r.channel === "telegram");
    expect(tgResult).toBeDefined();
    expect(tgResult!.success).toBe(true);

    fetchSpy.mockRestore();
  });

  it("continues if one notifier fails and reports failure", async () => {
    const config: Config = {
      ...baseConfig,
      channels: {
        ...baseConfig.channels,
        desktop: { enabled: false },
      },
    };

    const results = await dispatch("Test", config, "local");
    expect(results).toBeDefined();
    expect(writeSpy).toHaveBeenCalledWith("\x07");
    const soundResult = results.find((r) => r.channel === "sound");
    expect(soundResult).toBeDefined();
  });

  it("returns empty results when no channels enabled", async () => {
    const config: Config = {
      ...baseConfig,
      channels: {
        ...baseConfig.channels,
        desktop: { enabled: false },
        sound: { enabled: false, file: null },
      },
    };

    const results = await dispatch("Test", config, "local");
    expect(results).toEqual([]);
  });

  it("filters to specific channel when --channel is set", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const config: Config = {
      ...baseConfig,
      channels: {
        ...baseConfig.channels,
        telegram: { enabled: true, bot_token: "tok", chat_id: "123" },
      },
    };

    const results = await dispatch("Test", config, "local", { channel: "telegram" });
    expect(results).toHaveLength(1);
    expect(results[0].channel).toBe("telegram");

    fetchSpy.mockRestore();
  });

  it("overrides title when --title is set", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    );

    const config: Config = {
      ...baseConfig,
      channels: {
        ...baseConfig.channels,
        telegram: { enabled: true, bot_token: "tok", chat_id: "123" },
      },
    };

    await dispatch("Test", config, "local", { title: "Custom Title" });
    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string);
    expect(body.text).toContain("Custom Title");

    fetchSpy.mockRestore();
  });
});
