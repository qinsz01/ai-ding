import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailNotifier } from "./email.js";
import nodemailer from "nodemailer";

describe("EmailNotifier", () => {
  let notifier: EmailNotifier;
  let sendMailSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sendMailSpy = vi.fn().mockResolvedValue({ messageId: "<test-123@example.com>" });
    vi.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: sendMailSpy,
    } as never);

    notifier = new EmailNotifier({
      enabled: true,
      smtp_host: "smtp.example.com",
      smtp_port: 587,
      from: "bot@example.com",
      to: "user@example.com",
      user: "bot@example.com",
      password: "secret",
    });
  });

  it("has name 'email'", () => {
    expect(notifier.name).toBe("email");
  });

  it("sends email and returns success result", async () => {
    const result = await notifier.send("Task done", { title: "Alert" });

    expect(result.success).toBe(true);
    expect(result.channel).toBe("email");
    expect(result.message).toContain("user@example.com");

    expect(sendMailSpy).toHaveBeenCalledTimes(1);
    const mail = sendMailSpy.mock.calls[0][0];
    expect(mail.from).toBe("bot@example.com");
    expect(mail.to).toBe("user@example.com");
    expect(mail.subject).toBe("Alert");
    expect(mail.text).toBe("Task done");
  });

  it("uses default title when none provided", async () => {
    await notifier.send("Hello");
    const mail = sendMailSpy.mock.calls[0][0];
    expect(mail.subject).toBe("ai-ding");
  });

  it("returns failure on send error", async () => {
    sendMailSpy.mockRejectedValue(new Error("connection refused"));

    const result = await notifier.send("test");
    expect(result.success).toBe(false);
    expect(result.message).toContain("connection refused");
  });
});
