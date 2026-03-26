import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

interface PricePredictionRequest {
  hotelId: string;
  hotelName: string;
  city: string;
  currentPrice: number;
  discountPercent: number;
  starRating: number;
  category: string;
  checkInDate?: string;
  lengthOfStay?: number;
}

interface PricePrediction {
  currentPrice: number;
  predictedBestPrice: number;
  predictedSavings: number;
  recommendation: 'book_now' | 'wait' | 'flexible';
  confidence: number;
  reasons: string[];
  priceHistory: { date: string; price: number; event?: string }[];
  upcomingEvents: { date: string; event: string; priceImpact: string }[];
  bestBookingWindow: string;
  aiInsight: string;
}

// Simulated price trends data
function generatePriceHistory(currentPrice: number, discountPercent: number): { date: string; price: number; event?: string }[] {
  const history = [];
  const basePrice = currentPrice / (1 - discountPercent / 100);
  const today = new Date();

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate price fluctuations
    const fluctuation = Math.sin(i / 7) * 0.1 + Math.random() * 0.05 - 0.025;
    const price = basePrice * (1 + fluctuation);
    
    const entry: { date: string; price: number; event?: string } = {
      date: date.toISOString().split('T')[0],
      price: Math.round(price)
    };

    // Add some events
    if (i === 14) entry.event = 'Holiday Weekend';
    if (i === 21) entry.event = 'Local Festival';
    
    history.push(entry);
  }

  return history;
}

// Generate upcoming events that might affect pricing
function generateUpcomingEvents(city: string): { date: string; event: string; priceImpact: string }[] {
  const events = [
    { event: 'Weekend Rush', priceImpact: 'High demand' },
    { event: 'Local Festival', priceImpact: 'Prices may surge 20-30%' },
    { event: 'Holiday Season', priceImpact: 'Peak pricing expected' },
    { event: 'Off-peak Period', priceImpact: 'Lower prices likely' }
  ];

  const today = new Date();
  return events.map((e, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + (i + 1) * 7);
    return {
      date: date.toISOString().split('T')[0],
      ...e
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as PricePredictionRequest;
    
    const {
      hotelId,
      hotelName,
      city,
      currentPrice,
      discountPercent,
      starRating,
      category,
      checkInDate,
      lengthOfStay = 1
    } = body;

    if (!hotelName || !currentPrice) {
      return NextResponse.json(
        { error: 'Hotel name and current price are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Generate simulated data
    const priceHistory = generatePriceHistory(currentPrice, discountPercent);
    const upcomingEvents = generateUpcomingEvents(city);

    // Calculate predictions based on patterns
    const basePrice = currentPrice / (1 - discountPercent / 100);
    const avgPrice = priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length;
    const minPrice = Math.min(...priceHistory.map(p => p.price));
    
    // AI-driven prediction logic
    const predictionPrompt = `You are a hotel pricing analyst AI. Analyze this hotel and predict the best booking strategy.

**Hotel:** ${hotelName}
**Location:** ${city}
**Category:** ${category} (${starRating} stars)
**Current Price:** $${currentPrice}/night
**Current Discount:** ${discountPercent}%
**Base Price:** $${Math.round(basePrice)}/night
**30-day Average:** $${Math.round(avgPrice)}/night
**30-day Lowest:** $${minPrice}/night
**Check-in Date:** ${checkInDate || 'Flexible'}
**Length of Stay:** ${lengthOfStay} night(s)

**Recent Price History (last 7 days):**
${priceHistory.slice(-7).map(h => `- ${h.date}: $${h.price}${h.event ? ` (${h.event})` : ''}`).join('\n')}

**Upcoming Events:**
${upcomingEvents.map(e => `- ${e.date}: ${e.event} - ${e.priceImpact}`).join('\n')}

Based on this data, provide:
1. A prediction of whether prices will go up or down in the next 2 weeks
2. The best booking recommendation (book_now/wait/flexible)
3. Confidence level (0-100%)
4. 3-4 specific reasons for your recommendation
5. A brief insight for the traveler (2-3 sentences)

Format your response EXACTLY like this:
RECOMMENDATION: [book_now/wait/flexible]
CONFIDENCE: [number]%
PREDICTED_BEST_PRICE: $[number]
REASONS:
- [reason 1]
- [reason 2]
- [reason 3]
INSIGHT: [your insight here]`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a precise hotel pricing analyst. Always respond in the exact format requested.' },
        { role: 'user', content: predictionPrompt }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content || '';

    // Parse the AI response
    let recommendation: 'book_now' | 'wait' | 'flexible' = 'flexible';
    let confidence = 70;
    let predictedBestPrice = currentPrice;
    let reasons: string[] = [];
    let insight = '';

    const recMatch = content.match(/RECOMMENDATION:\s*(\w+)/i);
    if (recMatch) {
      const rec = recMatch[1].toLowerCase();
      if (rec === 'book_now' || rec === 'wait' || rec === 'flexible') {
        recommendation = rec;
      }
    }

    const confMatch = content.match(/CONFIDENCE:\s*(\d+)/i);
    if (confMatch) {
      confidence = parseInt(confMatch[1]);
    }

    const priceMatch = content.match(/PREDICTED_BEST_PRICE:\s*\$(\d+)/i);
    if (priceMatch) {
      predictedBestPrice = parseInt(priceMatch[1]);
    }

    const reasonsMatch = content.match(/REASONS:\s*([\s\S]*?)(?=INSIGHT:|$)/i);
    if (reasonsMatch) {
      reasons = reasonsMatch[1]
        .split('\n')
        .map(r => r.replace(/^-\s*/, '').trim())
        .filter(r => r.length > 0);
    }

    const insightMatch = content.match(/INSIGHT:\s*([\s\S]*?)$/i);
    if (insightMatch) {
      insight = insightMatch[1].trim();
    }

    // Calculate savings
    const predictedSavings = basePrice - predictedBestPrice;

    // Determine best booking window
    let bestBookingWindow = 'Within the next 3-5 days';
    if (recommendation === 'wait') {
      bestBookingWindow = 'Wait 7-14 days for potential price drops';
    } else if (recommendation === 'flexible') {
      bestBookingWindow = 'Monitor prices and book when comfortable';
    }

    const prediction: PricePrediction = {
      currentPrice,
      predictedBestPrice,
      predictedSavings: Math.round(predictedSavings),
      recommendation,
      confidence,
      reasons: reasons.length > 0 ? reasons : [
        `Current ${discountPercent}% discount is competitive for ${city}`,
        `${category} hotels in this area have stable pricing`,
        'Historical patterns suggest moderate price fluctuation'
      ],
      priceHistory,
      upcomingEvents,
      bestBookingWindow,
      aiInsight: insight || `Based on current market conditions and historical pricing patterns for ${hotelName}, we recommend ${recommendation === 'book_now' ? 'booking soon' : recommendation === 'wait' ? 'waiting for potential price drops' : 'monitoring prices before booking'}.`
    };

    return NextResponse.json({
      success: true,
      prediction
    });

  } catch (error) {
    console.error('Price Prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate price prediction', success: false },
      { status: 500 }
    );
  }
}
