import nodemailer from 'nodemailer';

const hasSmtp = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: false,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
  : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!transporter) {
    // Dev mode — print to console instead of sending
    console.log('\n📧 EMAIL (dev mode — configure SMTP to send for real)');
    console.log(`   To:      ${to}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Body:    ${html.replace(/<[^>]+>/g, '').slice(0, 200)}...`);
    console.log('');
    return;
  }
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Busy Beds <noreply@busybeds.com>',
    to, subject, html,
  });
}

// ── Email Templates ────────────────────────────────────────────

function baseTemplate(content: string) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #F2F4F7; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; }
  .header { background: linear-gradient(135deg,#1A3C5E,#0E7C7B); padding: 32px 32px 24px; color: #fff; }
  .header h1 { margin: 0; font-size: 22px; }
  .header p { margin: 4px 0 0; opacity: .75; font-size: 13px; }
  .body { padding: 32px; color: #1D2939; line-height: 1.6; }
  .btn { display: inline-block; background: #0E7C7B; color: #fff !important; padding: 12px 28px;
         border-radius: 10px; text-decoration: none; font-weight: bold; margin: 16px 0; }
  .box { background: #F2F4F7; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
  .code { font-family: monospace; font-size: 18px; font-weight: bold; color: #1A3C5E; letter-spacing: 2px; }
  .footer { padding: 20px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; text-align: center; }
</style></head>
<body><div class="wrap">
  <div class="header">
    <h1>🏨 Busy Beds</h1>
    <p>Hotel discounts, verified by QR</p>
  </div>
  <div class="body">${content}</div>
  <div class="footer">© ${new Date().getFullYear()} Busy Beds · You received this because you have an account with us.</div>
</div></body></html>`;
}

export function emailWelcome(name: string) {
  return baseTemplate(`
    <h2>Welcome, ${name}! 🎉</h2>
    <p>Your Busy Beds account is ready. Subscribe to a plan and start generating hotel discount coupons in seconds.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscribe" class="btn">Choose a Plan →</a>
    <p style="color:#888;font-size:13px">Each coupon is unique to you, verified by hotel staff on-site. No booking needed.</p>
  `);
}

export function emailCouponGenerated(name: string, hotelName: string, discount: number, code: string, expiresAt: Date, qrDataUrl?: string) {
  return baseTemplate(`
    <h2>Your coupon is ready! 🎫</h2>
    <p>Hi ${name}, here's your discount coupon for <strong>${hotelName}</strong>.</p>
    <div class="box" style="text-align:center">
      <div style="font-size:13px;color:#666;margin-bottom:4px">Coupon Code</div>
      <div class="code">${code}</div>
      <div style="margin-top:10px;font-size:22px;font-weight:bold;color:#0E7C7B">${discount}% OFF</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Valid until ${expiresAt.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" style="width:160px;height:160px;margin:16px auto 4px;display:block;border-radius:8px;" />
      <div style="font-size:11px;color:#aaa;margin-top:2px">Scan at hotel reception</div>` : ''}
    </div>
    <p>Show this code or QR code at the hotel reception. Staff will scan it and apply your discount instantly.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/coupons" class="btn">View My Coupons →</a>
  `);
}

export function emailSubscriptionConfirmed(name: string, planName: string, expiresAt: Date) {
  return baseTemplate(`
    <h2>Subscription activated! 💳</h2>
    <p>Hi ${name}, your <strong>${planName}</strong> plan is now active.</p>
    <div class="box">
      <div style="font-size:13px;color:#666">Active until</div>
      <div style="font-size:18px;font-weight:bold;color:#1A3C5E;margin-top:4px">
        ${expiresAt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
      </div>
    </div>
    <p>Browse hotels and start generating your discount coupons now.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="btn">Browse Hotels →</a>
  `);
}

export function emailKycApproved(name: string, hotelName: string) {
  return baseTemplate(`
    <h2>KYC Approved! ✅</h2>
    <p>Hi ${name}, great news — your application for <strong>${hotelName}</strong> has been approved.</p>
    <p>You now have full access to your hotel dashboard. Set up your hotel page, add photos, configure your discount offer, and assign managers.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" class="btn">Go to Hotel Portal →</a>
  `);
}

export function emailKycRejected(name: string, hotelName: string, reason?: string) {
  return baseTemplate(`
    <h2>KYC Application Update</h2>
    <p>Hi ${name}, unfortunately your application for <strong>${hotelName}</strong> was not approved at this time.</p>
    ${reason ? `<div class="box"><strong>Reason:</strong> ${reason}</div>` : ''}
    <p>If you have questions or would like to resubmit with updated documents, please contact our support team.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/apply" class="btn">Resubmit Application →</a>
  `);
}

export function emailHotelSuggestionReceived(hotelName: string) {
  return baseTemplate(`
    <h2>Thank you for your suggestion!</h2>
    <p>We've received your suggestion to add <strong>${hotelName}</strong> to Busy Beds.</p>
    <p>Our team will review it and add it to the platform if it meets our criteria. We'll let you know once it's live.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="btn">Browse Existing Hotels →</a>
  `);
}

export function emailVerifyEmail(name: string, verifyUrl: string) {
  return baseTemplate(`
    <h2>Verify your email address 📧</h2>
    <p>Hi ${name}, thanks for joining Busy Beds! Please verify your email address to get started.</p>
    <a href="${verifyUrl}" class="btn">Verify Email →</a>
    <p style="margin-top:16px;font-size:12px;color:#888">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
  `);
}

export function emailPasswordReset(name: string, resetUrl: string) {
  return baseTemplate(`
    <h2>Reset your password 🔑</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <a href="${resetUrl}" class="btn">Reset Password →</a>
    <p style="margin-top:16px;font-size:12px;color:#888">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
  `);
}

export function emailRenewalReminder(name: string, planName: string, expiresAt: Date, renewUrl: string) {
  const daysLeft = Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  return baseTemplate(`
    <h2>Your subscription expires soon! ⏰</h2>
    <p>Hi ${name}, your <strong>${planName}</strong> plan expires on <strong>${expiresAt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</strong> — just ${daysLeft} day${daysLeft !== 1 ? 's' : ''} away.</p>
    <p>Renew now to keep enjoying your hotel discounts without interruption.</p>
    <a href="${renewUrl}" class="btn">Renew Now →</a>
    <div class="box" style="margin-top: 20px;">
      <strong>What you'll lose if you don't renew:</strong>
      <ul style="margin: 8px 0 0 16px; padding: 0;">
        <li>Access to all hotel discount coupons</li>
        <li>Ability to generate new coupons</li>
        <li>Pending coupon redemptions may expire</li>
      </ul>
    </div>
  `);
}

export function emailCouponExpiringSoon(name: string, hotelName: string, code: string, discountPercent: number, expiresAt: Date, shareUrl: string) {
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return baseTemplate(`
    <h2>⏰ Your coupon expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}!</h2>
    <p>Hi ${name}, your <strong>${discountPercent}% discount coupon</strong> for <strong>${hotelName}</strong> is expiring soon.</p>
    <div class="box" style="text-align:center">
      <div style="font-size:13px;color:#666">Coupon Code</div>
      <div class="code" style="font-size:22px;margin:8px 0">${code}</div>
      <div style="font-size:13px;color:#E8395A;font-weight:bold">Expires: ${expiresAt.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</div>
    </div>
    <p>Don't let it go to waste! Visit the hotel and show this coupon to the front desk.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/coupons" class="btn">View My Coupons →</a>
    <p style="font-size:13px;color:#888;margin-top:16px">Want to share this deal? <a href="${shareUrl}" style="color:#0E7C7B">Share your coupon link →</a></p>
  `);
}

export function emailNewReviewReceived(ownerName: string, hotelName: string, guestName: string, rating: number, title: string) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  return baseTemplate(`
    <h2>New review for ${hotelName}! ⭐</h2>
    <p>Hi ${ownerName}, <strong>${guestName}</strong> just left a review for your hotel.</p>
    <div class="box">
      <div style="font-size:22px;color:#F59E0B;margin-bottom:6px">${stars}</div>
      <div style="font-weight:bold;font-size:16px;color:#1A3C5E">"${title}"</div>
    </div>
    <p>Log in to your portal to view the full review and respond.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal/manage" class="btn">View & Respond →</a>
  `);
}

export function emailFlashSaleAlert(name: string, hotelName: string, discount: number, endsAt: Date, hotelSlug: string) {
  const hoursLeft = Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60));
  return baseTemplate(`
    <h2>🔥 Flash Sale: ${discount}% OFF at ${hotelName}!</h2>
    <p>Hi ${name}, there's a limited-time flash sale you don't want to miss.</p>
    <div class="box" style="background:linear-gradient(135deg,#E8395A,#C0263D);color:white;border-radius:12px;text-align:center;padding:24px">
      <div style="font-size:48px;font-weight:900;line-height:1">${discount}%</div>
      <div style="font-size:16px;font-weight:bold;margin-top:4px">OFF your stay</div>
      <div style="font-size:13px;opacity:0.85;margin-top:8px">⏰ Only ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''} left!</div>
    </div>
    <p>This is a limited-time offer. Generate your coupon before it ends!</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/hotels/${hotelSlug}" class="btn">Get My Discount Now →</a>
  `);
}

export function emailCouponShareReceived(recipientName: string, senderName: string, hotelName: string, discount: number, shareUrl: string, expiresAt: Date) {
  return baseTemplate(`
    <h2>🎁 ${senderName} shared a hotel deal with you!</h2>
    <p>Hi ${recipientName}, you've received an exclusive hotel discount from <strong>${senderName}</strong>.</p>
    <div class="box" style="text-align:center">
      <div style="font-size:13px;color:#666;margin-bottom:4px">${hotelName}</div>
      <div style="font-size:42px;font-weight:900;color:#0E7C7B;line-height:1">${discount}%</div>
      <div style="font-size:14px;color:#666;margin-top:4px">Discount on your stay</div>
      <div style="font-size:12px;color:#E8395A;margin-top:8px">Valid until ${expiresAt.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
    </div>
    <a href="${shareUrl}" class="btn">View My Exclusive Deal →</a>
    <p style="font-size:12px;color:#888;margin-top:16px">Don't have a BusyBeds account yet? <a href="${process.env.NEXT_PUBLIC_APP_URL}/register" style="color:#0E7C7B">Join free →</a></p>
  `);
}

export function emailGiftCoupon(
  recipientName: string,
  senderName: string,
  hotelName: string,
  discount: number,
  code: string,
  expiresAt: Date,
  qrDataUrl?: string,
) {
  return baseTemplate(`
    <h2>🎁 ${senderName} gifted you a hotel coupon!</h2>
    <p>Hi ${recipientName}, <strong>${senderName}</strong> sent you an exclusive discount coupon for <strong>${hotelName}</strong>.</p>
    <div class="box" style="text-align:center">
      <div style="font-size:13px;color:#666;margin-bottom:4px">Coupon Code</div>
      <div class="code">${code}</div>
      <div style="margin-top:10px;font-size:22px;font-weight:bold;color:#7C3AED">${discount}% OFF</div>
      <div style="font-size:12px;color:#888;margin-top:4px">Valid until ${expiresAt.toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})}</div>
      ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code" style="width:160px;height:160px;margin:16px auto 4px;display:block;border-radius:8px;" />
      <div style="font-size:11px;color:#aaa;margin-top:2px">Scan at hotel reception</div>` : ''}
    </div>
    <p>Simply show this code or QR at check-in and the discount will be applied instantly. No booking needed.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/register" class="btn">Join BusyBeds Free →</a>
    <p style="font-size:12px;color:#888;margin-top:16px">Already have an account? <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" style="color:#0E7C7B">Log in to manage your coupons →</a></p>
  `);
}

export function emailWeeklyDigest(
  name: string,
  newHotels: Array<{ name: string; city: string; country: string; discount: number; slug: string }>,
  topDeals: Array<{ name: string; city: string; discount: number; slug: string }>,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://busybeds.com';
  const hotelRows = newHotels.slice(0, 5).map(h =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong><a href="${appUrl}/hotels/${h.slug}" style="color:#1A3C5E;text-decoration:none">${h.name}</a></strong><br/><span style="font-size:12px;color:#888">${h.city}, ${h.country}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#0E7C7B">${h.discount}% OFF</td></tr>`
  ).join('');
  const dealRows = topDeals.slice(0, 5).map(h =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee"><strong><a href="${appUrl}/hotels/${h.slug}" style="color:#1A3C5E;text-decoration:none">${h.name}</a></strong><br/><span style="font-size:12px;color:#888">${h.city}</span></td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;color:#E8395A">${h.discount}% OFF</td></tr>`
  ).join('');

  return baseTemplate(`
    <h2>🏨 Your Weekly Hotel Deals Digest</h2>
    <p>Hi ${name}, here's what's new on BusyBeds this week.</p>
    ${newHotels.length > 0 ? `
    <div class="box">
      <strong style="font-size:14px">🆕 New Hotels Added</strong>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">${hotelRows}</table>
    </div>` : ''}
    ${topDeals.length > 0 ? `
    <div class="box" style="margin-top:16px">
      <strong style="font-size:14px">🔥 Top Deals This Week</strong>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">${dealRows}</table>
    </div>` : ''}
    <a href="${appUrl}" class="btn" style="margin-top:24px">Browse All Hotels →</a>
    <p style="font-size:12px;color:#888;margin-top:16px">You're receiving this because you have an active BusyBeds subscription.</p>
  `);
}

export function emailReferralEarningAvailable(name: string, amount: number) {
  return baseTemplate(`
    <h2>💰 Your referral earning is ready!</h2>
    <p>Hi ${name}, your <strong>$${amount.toFixed(2)}</strong> referral commission has passed the 30-day hold period and is now available to withdraw.</p>
    <div class="box" style="text-align:center">
      <div style="font-size:13px;color:#666;margin-bottom:4px">Available Balance</div>
      <div style="font-size:36px;font-weight:900;color:#0E7C7B">$${amount.toFixed(2)}</div>
    </div>
    <p>Head to your referral dashboard to request a payout to your PayPal account (minimum $20).</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/referral#earnings" class="btn">Request Payout →</a>
    <p style="font-size:12px;color:#888;margin-top:16px">Keep sharing your referral link to earn more!</p>
  `);
}

export function emailPayoutProcessed(name: string, amount: number, status: 'paid' | 'rejected', adminNotes?: string) {
  const isPaid = status === 'paid';
  return baseTemplate(`
    <h2>${isPaid ? '✅ Payout Sent!' : '❌ Payout Update'}</h2>
    <p>Hi ${name}, ${isPaid
      ? `your payout of <strong>$${amount.toFixed(2)}</strong> has been processed and sent to your PayPal account.`
      : `your payout request of <strong>$${amount.toFixed(2)}</strong> could not be processed at this time.`
    }</p>
    ${adminNotes ? `<div class="box"><strong>Notes:</strong> ${adminNotes}</div>` : ''}
    ${isPaid
      ? `<p>Funds may take 1–3 business days to appear in your PayPal account.</p>`
      : `<p>Please check that your PayPal email is correct and try again, or contact support.</p>`
    }
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/referral#earnings" class="btn">View Earnings →</a>
  `);
}

export function emailWelcomeOwner(ownerName: string, hotelName: string) {
  return baseTemplate(`
    <h2>Welcome to BusyBeds, ${ownerName}! 🏨</h2>
    <p>Your hotel <strong>${hotelName}</strong> has been submitted and is under review. Our team will verify it within 1–2 business days.</p>
    <div class="box">
      <strong>While you wait, here's what to prepare:</strong>
      <ul style="margin:8px 0 0 16px;padding:0">
        <li>High-quality cover photo of your hotel</li>
        <li>Accurate room descriptions and pricing</li>
        <li>Business contact info and social links</li>
        <li>Decide on your discount percentage (we recommend 15–25%)</li>
      </ul>
    </div>
    <p>Once approved, you'll get full access to your hotel portal to manage coupons, view analytics, and run flash sales.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/portal" class="btn">Explore Your Portal →</a>
  `);
}
