import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Privacy Policy — BusyBeds',
  description: 'BusyBeds Privacy Policy — how we collect, use, and protect your data.',
};

const LAST_UPDATED = 'March 28, 2026';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              BusyBeds (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p><strong>Account information:</strong> When you register, we collect your name, email address,
            phone number, and password (stored as a secure hash). If you sign in with Google, we receive
            your name and email from Google.</p>
            <p className="mt-3"><strong>Payment information:</strong> Payment processing is handled by Stripe,
            PayPal, or PesaPal. We do not store your card details. We receive confirmation of payment
            status and transaction IDs only.</p>
            <p className="mt-3"><strong>Usage data:</strong> We collect information about how you use BusyBeds,
            including hotels viewed, coupons generated, and pages visited. This helps us improve the platform.</p>
            <p className="mt-3"><strong>Location data:</strong> We may ask for your location to show nearby hotels.
            This is used only within the app and is not stored permanently.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li>To create and manage your account</li>
              <li>To process subscription payments and generate discount coupons</li>
              <li>To send you coupons, booking confirmations, and account notifications via email</li>
              <li>To facilitate Stay Requests between you and partner hotels</li>
              <li>To calculate and pay referral commissions</li>
              <li>To improve our platform through analytics</li>
              <li>To send marketing emails (only with your consent; you can unsubscribe at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Information Shared With Hotels</h2>
            <p>
              When you generate a coupon or submit a Stay Request for a specific hotel, we share your
              name and contact details with that hotel so they can verify your coupon and fulfil your request.
              Hotels are prohibited from using your data for any purpose other than your stay.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Third-Party Services</h2>
            <p>We use the following third-party services:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
              <li><strong>Stripe, PayPal, PesaPal</strong> — payment processing</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Google</strong> — OAuth sign-in and Maps/Places data</li>
              <li><strong>Cloudinary</strong> — image storage and delivery</li>
            </ul>
            <p className="mt-3">
              Each of these services has its own privacy policy. We only share the minimum data
              necessary for them to perform their function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. If you delete your account,
              we will delete your personal data within 30 days, except where we are required to retain it
              for legal or financial compliance (e.g. payment records, which are retained for 7 years).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2>
            <p>
              BusyBeds uses cookies to maintain your login session (httpOnly, secure, SameSite). We do not
              use advertising cookies or third-party tracking cookies. You can disable cookies in your browser,
              but this will prevent you from staying logged in.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data via your profile settings</li>
              <li>Request deletion of your account and associated data</li>
              <li>Opt out of marketing emails at any time</li>
              <li>Request a copy of your data in a portable format</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:privacy@busybeds.com" className="text-[#E8395A] hover:underline font-medium">
                privacy@busybeds.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Security</h2>
            <p>
              We protect your data using industry-standard security measures including encrypted connections
              (HTTPS/TLS), hashed passwords (bcrypt), and JWT authentication with httpOnly cookies.
              No system is 100% secure, and we encourage you to use a strong, unique password.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
            <p>
              BusyBeds is not intended for children under 18. We do not knowingly collect personal data
              from anyone under 18. If you believe a minor has registered, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes via email or a notice on the platform. Continued use of BusyBeds after changes
              constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
            <p>
              If you have any questions or concerns about this Privacy Policy, please contact us at:{' '}
              <a href="mailto:privacy@busybeds.com" className="text-[#E8395A] hover:underline font-medium">
                privacy@busybeds.com
              </a>
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-400">
          <Link href="/terms" className="hover:text-gray-700 transition-colors">Terms of Service</Link>
          <Link href="/" className="hover:text-gray-700 transition-colors">Back to Home</Link>
        </div>

      </div>
    </div>
  );
}
