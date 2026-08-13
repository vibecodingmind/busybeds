"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { generateVerificationToken } from "@/lib/coupons/qr";
import { dispatchNotification } from "@/lib/notifications/service";

export async function registerGuestAction(formData: FormData) {
  const email = String(formData.get("email")).toLowerCase().trim();
  const password = String(formData.get("password"));
  const firstName = String(formData.get("firstName") ?? "");
  const lastName = String(formData.get("lastName") ?? "");

  if (!email || password.length < 8) {
    return { error: "Invalid email or password (min 8 characters)" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      emailVerified: new Date(),
      platformRole: "MEMBER",
    },
  });

  await prisma.loyaltyAccount.create({ data: { userId: user.id } });

  await dispatchNotification("USER_REGISTERED", user.id, email, {});

  return { success: true };
}

export async function registerHotelOwnerAction(formData: FormData) {
  const email = String(formData.get("email")).toLowerCase().trim();
  const password = String(formData.get("password"));
  const hotelName = String(formData.get("hotelName"));
  const country = String(formData.get("country"));
  const city = String(formData.get("city"));

  if (!email || password.length < 8 || !hotelName) {
    return { error: "Please complete all required fields" };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "Email already registered" };
  }

  const slug = hotelName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: new Date(),
      platformRole: "MEMBER",
    },
  });

  const org = await prisma.organization.create({
    data: { type: "HOTEL", name: hotelName },
  });

  await prisma.hotel.create({
    data: {
      organizationId: org.id,
      name: hotelName,
      slug: `${slug}-${Date.now().toString(36)}`,
      country,
      city,
      status: "PENDING_APPROVAL",
    },
  });

  await prisma.userRoleAssignment.create({
    data: {
      userId: user.id,
      organizationId: org.id,
      hotelRole: "OWNER",
    },
  });

  return { success: true };
}

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    return { success: true };
  } catch {
    return { error: "Invalid email or password" };
  }
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get("email")).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  const token = generateVerificationToken();
  const expires = new Date(Date.now() + 3600000);
  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  return { success: true };
}
