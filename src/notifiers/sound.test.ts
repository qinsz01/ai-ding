import { describe, it, expect, vi, beforeEach } from "vitest";
import { SoundNotifier } from "./sound.js";

describe("SoundNotifier", () => {
  let notifier: SoundNotifier;
  let writeSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    notifier = new SoundNotifier();
    writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
  });

  it("has name 'sound'", () => {
    expect(notifier.name).toBe("sound");
  });

  it("writes bell character to stdout", async () => {
    await notifier.send("test message");
    expect(writeSpy).toHaveBeenCalledWith("\x07");
  });

  it("writes bell character regardless of message content", async () => {
    await notifier.send("any message at all");
    expect(writeSpy).toHaveBeenCalledWith("\x07");
  });

  it("attempts to play audio file", async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: "", stderr: "" });
    const notifierWithMock = new SoundNotifier(mockExec);
    await notifierWithMock.send("test");
    // Should attempt paplay for .oga files
    expect(mockExec).toHaveBeenCalled();
    const cmd = mockExec.mock.calls[0][0];
    expect(cmd).toContain("paplay");
  });
});
