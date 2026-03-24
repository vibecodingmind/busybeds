#!/usr/bin/env ts-node
/**
 * Stripe Setup Script for Hotel Subscriptions
 * 
 * This script creates the products and prices in Stripe for the hotel subscription tiers.
 * 
 * Prerequisites:
 * 1. Set STRIPE_SECRET_KEY in your .env file
 * 2. Run this script: npx ts-node scripts/setup-stripe-products.ts
 * 
 * After running, update the tier records with the returned Stripe Price IDs:
 * - stripePriceIdMonthly
 * - stripePriceIdAnnual
 */

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const TIERS = [
  {
    name: 'starter',
    displayName: 'Starter',
    priceMonthly: 19,
    priceAnnual: 190,
    description: 'Basic visibility for small hotels - Featured on homepage, verified badge, 1 flash deal/month',
  },
  {
    name: 'growth',
    displayName: 'Growth',
    priceMonthly: 49,
    priceAnnual: 490,
    description: 'Enhanced visibility for growing hotels - Priority featured, 3 flash deals, promo emails, custom booking link',
  },
  {
    name: 'premium',
    displayName: 'Premium',
    priceMonthly: 99,
    priceAnnual: 990,
    description: 'Maximum exposure for established hotels - Top placement, unlimited deals, API access, priority support',
  },
];

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ Error: STRIPE_SECRET_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🚀 Setting up Stripe products for Hotel Subscriptions...\n');

  const results: { tier: string; productId: string; monthlyPriceId: string; annualPriceId: string }[] = [];

  for (const tier of TIERS) {
    console.log(`📦 Creating product: ${tier.displayName}`);
    
    // Create product
    const product = await stripe.products.create({
      name: `BusyBeds ${tier.displayName} Plan`,
      description: tier.description,
      metadata: {
        tier: tier.name,
        type: 'hotel_subscription',
      },
    });

    console.log(`   ✓ Product created: ${product.id}`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.priceMonthly * 100, // Stripe uses cents
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        tier: tier.name,
        billing: 'monthly',
      },
    });

    console.log(`   ✓ Monthly price created: ${monthlyPrice.id}`);

    // Create annual price
    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.priceAnnual * 100, // Stripe uses cents
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        tier: tier.name,
        billing: 'annual',
      },
    });

    console.log(`   ✓ Annual price created: ${annualPrice.id}`);

    results.push({
      tier: tier.name,
      productId: product.id,
      monthlyPriceId: monthlyPrice.id,
      annualPriceId: annualPrice.id,
    });

    console.log('');
  }

  console.log('✅ Stripe setup complete!\n');
  console.log('═'.repeat(60));
  console.log('UPDATE YOUR DATABASE WITH THESE STRIPE PRICE IDs:');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    console.log(`\nUPDATE "HotelSubscriptionTier" SET`);
    console.log(`  "stripePriceIdMonthly" = '${r.monthlyPriceId}',`);
    console.log(`  "stripePriceIdAnnual" = '${r.annualPriceId}'`);
    console.log(`WHERE name = '${r.tier}';`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('NEXT STEPS:');
  console.log('═'.repeat(60));
  console.log('1. Run the SQL above in your database');
  console.log('2. Set up a webhook endpoint in Stripe Dashboard pointing to:');
  console.log('   https://your-domain.com/api/webhooks/stripe-hotel');
  console.log('3. Add STRIPE_HOTEL_WEBHOOK_SECRET to your environment variables');
}

main()
  .catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
