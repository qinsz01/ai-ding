import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NtfyNotifier } from "./ntfy.js";

describe("NtfyNotifier", () => {
  let notifier: NtfyNotifier;
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    notifier = new NtfyNotifier("https://ntfy.sh/test-topic");
    fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("ok", { status: 200 })
    );
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("has name 'ntfy'", () => {
    expect(notifier.name).toBe("ntfy");
  });

  it("POSTs message to ntfy URL and returns success", async () => {
    const result = await notifier.send("Build complete", { title: "CI" });

    expect(result.success).toBe(true);
    expect(result.channel).toBe("ntfy");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe("https://ntfy.sh/test-topic");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toHaveProperty("Title", "CI");
    expect(init?.body).toBe("Build complete");
  });

  it("uses default title if none provided", async () => {
    await notifier.send("Hello");
    const init = fetchSpy.mock.calls[0][1];
    expect(init?.headers).toHaveProperty("Title", "ai-ding");
  });

  it("returns failure on HTTP error", async () => {
    fetchSpy.mockResolvedValue(new Response("not found", { status: 404 }));

    const result = await notifier.send("test");
    expect(result.success).toBe(false);
    expect(result.message).toContain("HTTP 404");
  });
});
