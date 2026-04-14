import nodemailer from "nodemailer";
import type { Notifier, NotifyOptions, NotifyResult, EmailConfig } from "./types.js";

export class EmailNotifier implements Notifier {
  name = "email";
  private config: EmailConfig;

  constructor(config: EmailConfig) {
    this.config = config;
  }

  async send(message: string, options?: NotifyOptions): Promise<NotifyResult> {
    const transporter = nodemailer.createTransport({
      host: this.config.smtp_host,
      port: this.config.smtp_port,
      auth: {
        user: this.config.user,
        pass: this.config.password,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: this.config.from,
        to: this.config.to,
        subject: options?.title ?? "ai-ding",
        text: message,
      });
      return { channel: this.name, success: true, message: `sent to ${this.config.to} (${info.messageId})` };
    } catch (err) {
      return { channel: this.name, success: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
}
