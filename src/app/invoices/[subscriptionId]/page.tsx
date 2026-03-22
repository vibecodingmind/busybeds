import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

interface Props { params: { subscriptionId: string } }

export default async function InvoicePage({ params }: Props) {
  const session = await getSession();
  if (!session) redirect('/login');

  const sub = await prisma.subscription.findUnique({
    where: { id: params.subscriptionId },
    include: { package: true, user: { select: { fullName: true, email: true } } },
  });

  if (!sub || (sub.userId !== session.userId && session.role !== 'admin')) notFound();

  const amount = sub.billingCycle === 'annual'
    ? (sub.package.priceAnnual ?? sub.package.priceMonthly * 12)
    : sub.package.priceMonthly;

  const invoiceNumber = `INV-${sub.id.slice(-8).toUpperCase()}`;

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{invoiceNumber} — BusyBeds</title>
        <style>{`
          @media print { .no-print { display: none !important; } }
          body { font-family: Arial, sans-serif; background: #F2F4F7; margin: 0; padding: 40px 20px; color: #1D2939; }
          .invoice { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
          .header { background: linear-gradient(135deg,#1A3C5E,#0E7C7B); padding: 32px 40px; color: #fff; }
          .header h1 { margin: 0 0 4px; font-size: 24px; }
          .header p { margin: 0; opacity: .75; font-size: 13px; }
          .body { padding: 32px 40px; }
          .row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
          .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin: 24px 0; }
          th { background: #F2F4F7; text-align: left; padding: 10px 14px; font-size: 12px; text-transform: uppercase; color: #666; }
          td { padding: 12px 14px; border-bottom: 1px solid #F2F4F7; font-size: 14px; }
          .total-row td { font-weight: bold; font-size: 16px; border-bottom: none; color: #1A3C5E; }
          .badge { display: inline-block; background: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 99px; font-size: 12px; font-weight: bold; }
          .footer { padding: 20px 40px; background: #F9FAFB; border-top: 1px solid #eee; font-size: 12px; color: #888; text-align: center; }
          .print-btn { display: block; width: fit-content; margin: 24px auto 0; background: #0E7C7B; color: #fff; border: none; padding: 12px 32px; border-radius: 10px; font-size: 14px; font-weight: bold; cursor: pointer; }
        `}</style>
      </head>
      <body>
        <div className="invoice">
          <div className="header">
            <h1>🏨 BusyBeds</h1>
            <p>Hotel Discount Platform</p>
          </div>
          <div className="body">
            <div className="row">
              <div>
                <div className="section-title">Invoice</div>
                <div style={{ fontSize: 22, fontWeight: 'bold' }}>{invoiceNumber}</div>
                <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                  Issued: {new Date(sub.startsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge">PAID</span>
              </div>
            </div>

            <div className="row">
              <div>
                <div className="section-title">Billed To</div>
                <div style={{ fontWeight: 600 }}>{sub.user.fullName}</div>
                <div style={{ fontSize: 13, color: '#888' }}>{sub.user.email}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="section-title">Subscription Period</div>
                <div style={{ fontSize: 13 }}>
                  {new Date(sub.startsAt).toLocaleDateString()} →<br />
                  {new Date(sub.expiresAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Billing Cycle</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div style={{ fontWeight: 600 }}>{sub.package.name} Plan</div>
                    <div style={{ fontSize: 12, color: '#888' }}>Up to {sub.package.couponLimitPerPeriod} discount coupons per period</div>
                  </td>
                  <td style={{ textTransform: 'capitalize' }}>{sub.billingCycle}</td>
                  <td style={{ textAlign: 'right' }}>${amount.toFixed(2)} USD</td>
                </tr>
                <tr className="total-row">
                  <td colSpan={2}>Total</td>
                  <td style={{ textAlign: 'right' }}>${amount.toFixed(2)} USD</td>
                </tr>
              </tbody>
            </table>

            {sub.stripeSubId && (
              <p style={{ fontSize: 12, color: '#888' }}>
                Payment reference: <code>{sub.stripeSubId}</code>
              </p>
            )}
            {sub.compedBy && (
              <p style={{ fontSize: 12, color: '#888' }}>
                Complimentary subscription — {sub.compedReason || 'granted by admin'}
              </p>
            )}
          </div>
          <div className="footer">
            BusyBeds — {process.env.NEXT_PUBLIC_APP_URL} · Questions? Contact support@busybeds.com
          </div>
        </div>

        <button className="print-btn no-print" onClick={() => window.print()}>
          🖨️ Print / Save as PDF
        </button>
      </body>
    </html>
  );
}
