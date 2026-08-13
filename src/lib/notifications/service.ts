import type { NotificationChannel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type NotificationEvent =
  | "USER_REGISTERED"
  | "MEMBERSHIP_ACTIVATED"
  | "BOOKING_REQUESTED"
  | "AVAILABILITY_CONFIRMED"
  | "DEPOSIT_CONFIRMED"
  | "COUPON_REDEEMED"
  | "DEPOSIT_EXPIRING";

export interface NotificationMessage {
  to: string;
  subject?: string;
  body: string;
  html?: string;
}

export interface NotificationChannelProvider {
  channel: NotificationChannel;
  send(message: NotificationMessage): Promise<{ ok: boolean; error?: string }>;
}

class ConsoleEmailProvider implements NotificationChannelProvider {
  channel: NotificationChannel = "EMAIL";

  async send(message: NotificationMessage) {
    console.log(`[EMAIL] to=${message.to} subject=${message.subject}`, message.body);
    return { ok: true };
  }
}

class ResendEmailProvider implements NotificationChannelProvider {
  channel: NotificationChannel = "EMAIL";

  async send(message: NotificationMessage) {
    if (!process.env.RESEND_API_KEY) {
      return new ConsoleEmailProvider().send(message);
    }
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = process.env.EMAIL_FROM ?? "BusyBeds <onboarding@busybeds.com>";
    await resend.emails.send({
      from,
      to: message.to,
      subject: message.subject ?? "BusyBeds",
      html: message.html ?? message.body,
    });
    return { ok: true };
  }
}

const providers: NotificationChannelProvider[] = [
  process.env.RESEND_API_KEY
    ? new ResendEmailProvider()
    : new ConsoleEmailProvider(),
];

export async function dispatchNotification(
  event: NotificationEvent,
  userId: string,
  email: string,
  data: Record<string, string>,
) {
  const templates: Record<NotificationEvent, { subject: string; body: string }> = {
    USER_REGISTERED: {
      subject: "Welcome to BusyBeds",
      body: `Welcome! Your account is ready.`,
    },
    MEMBERSHIP_ACTIVATED: {
      subject: "Membership activated",
      body: `Your BusyBeds membership is now active. Plan: ${data.plan ?? ""}`,
    },
    BOOKING_REQUESTED: {
      subject: "Stay request submitted",
      body: `Your request for ${data.hotel ?? "hotel"} is pending availability confirmation.`,
    },
    AVAILABILITY_CONFIRMED: {
      subject: "Availability confirmed — pay deposit within 3 hours",
      body: `Code: ${data.code ?? ""}. Deposit: ${data.deposit ?? ""}. Pay hotel directly within 3 hours.`,
    },
    DEPOSIT_CONFIRMED: {
      subject: "Deposit confirmed",
      body: `Your deposit for ${data.hotel ?? ""} is confirmed. Present your QR at check-in.`,
    },
    COUPON_REDEEMED: {
      subject: "Stay redeemed",
      body: `Your stay at ${data.hotel ?? ""} has been marked complete.`,
    },
    DEPOSIT_EXPIRING: {
      subject: "Deposit deadline approaching",
      body: `Pay your deposit within 1 hour to secure ${data.hotel ?? ""}.`,
    },
  };

  const template = templates[event];
  const provider = providers[0];

  const result = await provider.send({
    to: email,
    subject: template.subject,
    body: template.body,
  });

  await prisma.notificationLog.create({
    data: {
      userId,
      channel: provider.channel,
      event,
      status: result.ok ? "sent" : "failed",
      payload: data,
    },
  });
}
