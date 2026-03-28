import Link from 'next/link';
import Navbar from '@/components/Navbar';

export const metadata = {
  title: 'Terms of Service — BusyBeds',
  description: 'BusyBeds Terms of Service and User Agreement.',
};

const LAST_UPDATED = 'March 28, 2026';

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-16">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-gray-400">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

          <section>
            <p>
              Welcome to BusyBeds. By accessing or using our platform, you agree to be bound by these
              Terms of Service. Please read them carefully before using BusyBeds.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. About BusyBeds</h2>
            <p>
              BusyBeds is a subscription-based hotel discount platform. Subscribers receive QR-coded
              discount coupons that can be redeemed at partner hotels. BusyBeds acts as an intermediary
              between travelers and hotels — we do not own, manage, or operate any hotel properties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Eligibility</h2>
            <p>
              You must be at least 18 years old to create an account and use BusyBeds. By registering,
              you confirm that all information you provide is accurate and complete. You are responsible
              for maintaining the security of your account credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Subscriptions & Payments</h2>
            <p>
              BusyBeds offers subscription plans that grant access to hotel discount coupons. Subscriptions
              are billed in advance on a monthly or annual basis. All payments are non-refundable unless
              otherwise stated. We reserve the right to change pricing with 30 days&apos; notice.
            </p>
            <p className="mt-3">
              Payments are processed securely via Stripe, PayPal, or PesaPal. BusyBeds does not store
              your payment card details.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Discount Coupons</h2>
            <p>
              Coupons are personal, non-transferable, and valid only at the hotel for which they were
              generated, during the specified validity period. Each coupon may only be redeemed once.
              Discounts are applied at the hotel&apos;s discretion and are subject to room availability.
              BusyBeds does not guarantee specific room types or rates.
            </p>
            <p className="mt-3">
              Coupons may be gifted to friends or family. Gifted coupons are still subject to all
              restrictions above and may not be resold.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Stay Requests</h2>
            <p>
              Premium subscribers may submit Stay Requests to partner hotels. A 25% non-refundable
              deposit is collected by BusyBeds upon hotel approval. Cancellations made 3 or more days
              before check-in will receive a refund of the deposit minus a 5% platform fee.
              Cancellations within 3 days of check-in are non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Hotel Partners</h2>
            <p>
              Hotels listed on BusyBeds are independently owned and operated. BusyBeds makes no
              warranties regarding the quality, safety, or accuracy of hotel listings. Reviews and
              ratings are provided by users and may not reflect our views.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Referral Program</h2>
            <p>
              BusyBeds offers a referral program where you can earn commissions for referring new
              subscribers. Referral earnings are subject to a 30-day hold period. We reserve the right
              to modify or terminate the referral program at any time. Fraudulent referrals will result
              in account termination and forfeiture of earnings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-600">
              <li>Share, sell, or transfer your account or coupons to others for profit</li>
              <li>Attempt to abuse, reverse-engineer, or circumvent the coupon system</li>
              <li>Submit false hotel reviews or ratings</li>
              <li>Use automated tools to access or scrape BusyBeds</li>
              <li>Engage in fraudulent referrals or payment chargebacks without basis</li>
            </ul>
            <p className="mt-3">
              Violation of these rules may result in immediate account suspension and forfeiture of
              any subscription or referral balances.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Intellectual Property</h2>
            <p>
              All content on BusyBeds — including logos, designs, text, and code — is the property of
              BusyBeds or its licensors. You may not reproduce or distribute any content without
              prior written permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Limitation of Liability</h2>
            <p>
              BusyBeds is provided &quot;as is&quot; without warranties of any kind. We are not liable for any
              indirect, incidental, or consequential damages arising from your use of the platform,
              including disputes with hotels, coupon rejections, or payment failures.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Termination</h2>
            <p>
              We reserve the right to suspend or terminate accounts that violate these Terms. You may
              cancel your subscription at any time from your dashboard. Upon cancellation, your access
              continues until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of significant changes
              via email. Continued use of BusyBeds after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:support@busybeds.com" className="text-[#E8395A] hover:underline font-medium">
                support@busybeds.com
              </a>
            </p>
          </section>

        </div>

        {/* Footer links */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6 text-sm text-gray-400">
          <Link href="/privacy" className="hover:text-gray-700 transition-colors">Privacy Policy</Link>
          <Link href="/" className="hover:text-gray-700 transition-colors">Back to Home</Link>
        </div>

      </div>
    </div>
  );
}
