import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectEnvironment } from "./env.js";


describe("detectEnvironment", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("detects SSH when SSH_CONNECTION is set", () => {
    delete process.env.DISPLAY;
    delete process.env.TERM_PROGRAM;
    delete process.env.CI;
    process.env.SSH_CONNECTION = "10.0.0.1 12345 10.0.0.2 22";
    expect(detectEnvironment()).toBe("ssh");
  });

  it("detects SSH when SSH_TTY is set", () => {
    delete process.env.DISPLAY;
    delete process.env.TERM_PROGRAM;
    delete process.env.CI;
    process.env.SSH_TTY = "/dev/pts/0";
    expect(detectEnvironment()).toBe("ssh");
  });

  it("detects CI when CI env var is set", () => {
    process.env.CI = "true";
    process.env.SSH_CONNECTION = "10.0.0.1 12345 10.0.0.2 22";
    expect(detectEnvironment()).toBe("ci");
  });

  it("detects local on Linux with DISPLAY", () => {
    delete process.env.SSH_CONNECTION;
    delete process.env.SSH_TTY;
    delete process.env.CI;
    delete process.env.TERM_PROGRAM;
    process.env.DISPLAY = ":0";
    expect(detectEnvironment()).toBe("local");
  });

  it("detects local on macOS with TERM_PROGRAM", () => {
    delete process.env.SSH_CONNECTION;
    delete process.env.SSH_TTY;
    delete process.env.CI;
    delete process.env.DISPLAY;
    process.env.TERM_PROGRAM = "iTerm.app";
    expect(detectEnvironment()).toBe("local");
  });

  it("defaults to local when no indicators are present", () => {
    delete process.env.SSH_CONNECTION;
    delete process.env.SSH_TTY;
    delete process.env.CI;
    delete process.env.DISPLAY;
    delete process.env.TERM_PROGRAM;
    expect(detectEnvironment()).toBe("local");
  });
});
