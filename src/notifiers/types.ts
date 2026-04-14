export interface NotifyOptions {
  title?: string;
  sound?: boolean;
  urgency?: "low" | "normal" | "critical";
}

export interface Notifier {
  name: string;
  send(message: string, options?: NotifyOptions): Promise<void>;
}

export interface DesktopConfig {
  enabled: boolean;
}

export interface SoundConfig {
  enabled: boolean;
  file: string | null;
}

export interface NtfyConfig {
  enabled: boolean;
  url: string;
}

export interface TelegramConfig {
  enabled: boolean;
  bot_token: string;
  chat_id: string;
}

export interface BarkConfig {
  enabled: boolean;
  url: string;
  device_key: string;
}

export interface ServerChanConfig {
  enabled: boolean;
  sendkey: string;
}

export interface SlackConfig {
  enabled: boolean;
  webhook_url: string;
}

export interface EmailConfig {
  enabled: boolean;
  smtp_host: string;
  smtp_port: number;
  from: string;
  to: string;
  user: string;
  password: string;
}

export interface RemoteConfig {
  fallback_order: string[];
}

export interface DefaultsConfig {
  message: string;
  title: string;
}

export interface Config {
  channels: {
    desktop: DesktopConfig;
    sound: SoundConfig;
    ntfy: NtfyConfig;
    telegram: TelegramConfig;
    bark: BarkConfig;
    serverchan: ServerChanConfig;
    slack: SlackConfig;
    email: EmailConfig;
  };
  remote: RemoteConfig;
  defaults: DefaultsConfig;
}

export type Environment = "local" | "ssh" | "ci";
