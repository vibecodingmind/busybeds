import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface HotelData {
  id: string;
  name: string;
  city: string;
  country: string;
  category: string;
  starRating: number;
  discountPercent: number;
  avgRating: number | null;
  reviewCount: number;
  amenities: string;
  vibeTags: string;
  descriptionShort: string;
  pricePerNight: number | null;
}

// Simulated hotel database for recommendations
const HOTEL_DATABASE: HotelData[] = [
  {
    id: '1',
    name: 'Grand Riviera Beach Resort',
    city: 'Mombasa',
    country: 'Kenya',
    category: 'Resort',
    starRating: 5,
    discountPercent: 25,
    avgRating: 4.8,
    reviewCount: 342,
    amenities: 'WiFi,Pool,Spa,Restaurant,Beach Access,Gym,Bar',
    vibeTags: 'romantic,luxury,beachfront',
    descriptionShort: 'Luxury beachfront resort with stunning ocean views',
    pricePerNight: 280
  },
  {
    id: '2',
    name: 'Safari Plains Lodge',
    city: 'Maasai Mara',
    country: 'Kenya',
    category: 'Lodge',
    starRating: 4,
    discountPercent: 20,
    avgRating: 4.9,
    reviewCount: 218,
    amenities: 'WiFi,Restaurant,Safari Tours,Bonfire,Spa',
    vibeTags: 'adventure,wildlife,nature',
    descriptionShort: 'Authentic safari experience in the heart of Maasai Mara',
    pricePerNight: 350
  },
  {
    id: '3',
    name: 'Nairobi City Heights',
    city: 'Nairobi',
    country: 'Kenya',
    category: 'Hotel',
    starRating: 4,
    discountPercent: 30,
    avgRating: 4.5,
    reviewCount: 189,
    amenities: 'WiFi,Restaurant,Gym,Business Center,Parking',
    vibeTags: 'business,urban,modern',
    descriptionShort: 'Modern hotel in Nairobi city center',
    pricePerNight: 120
  },
  {
    id: '4',
    name: 'Zanzibar Paradise Villas',
    city: 'Zanzibar',
    country: 'Tanzania',
    category: 'Villa',
    starRating: 5,
    discountPercent: 35,
    avgRating: 4.7,
    reviewCount: 156,
    amenities: 'WiFi,Pool,Kitchen,Beach Access,Private Garden',
    vibeTags: 'romantic,private,beachfront',
    descriptionShort: 'Private villas on pristine Zanzibar beaches',
    pricePerNight: 420
  },
  {
    id: '5',
    name: 'Cape Town Boutique Hotel',
    city: 'Cape Town',
    country: 'South Africa',
    category: 'Boutique',
    starRating: 4,
    discountPercent: 15,
    avgRating: 4.6,
    reviewCount: 267,
    amenities: 'WiFi,Restaurant,Wine Bar,Rooftop Terrace,Spa',
    vibeTags: 'boutique,trendy,cultural',
    descriptionShort: 'Stylish boutique hotel with Table Mountain views',
    pricePerNight: 180
  },
  {
    id: '6',
    name: 'Serengeti Migration Camp',
    city: 'Serengeti',
    country: 'Tanzania',
    category: 'Camping',
    starRating: 4,
    discountPercent: 18,
    avgRating: 4.8,
    reviewCount: 134,
    amenities: 'Restaurant,Safari Tours,Campfire,Guided Walks',
    vibeTags: 'adventure,wildlife,nature',
    descriptionShort: 'Glamping experience with Great Migration views',
    pricePerNight: 290
  },
  {
    id: '7',
    name: 'Victoria Falls View Hotel',
    city: 'Livingstone',
    country: 'Zambia',
    category: 'Hotel',
    starRating: 4,
    discountPercent: 22,
    avgRating: 4.5,
    reviewCount: 198,
    amenities: 'WiFi,Pool,Restaurant,Spa,Adventure Tours',
    vibeTags: 'adventure,nature,scenic',
    descriptionShort: 'Hotel with stunning Victoria Falls views',
    pricePerNight: 165
  },
  {
    id: '8',
    name: 'Kigali City Inn',
    city: 'Kigali',
    country: 'Rwanda',
    category: 'Hotel',
    starRating: 3,
    discountPercent: 40,
    avgRating: 4.3,
    reviewCount: 89,
    amenities: 'WiFi,Restaurant,Parking,Airport Shuttle',
    vibeTags: 'budget,urban,convenient',
    descriptionShort: 'Affordable comfort in Kigali city center',
    pricePerNight: 65
  },
  {
    id: '9',
    name: 'Diani Beach Apartments',
    city: 'Diani',
    country: 'Kenya',
    category: 'Apartment',
    starRating: 4,
    discountPercent: 28,
    avgRating: 4.6,
    reviewCount: 112,
    amenities: 'WiFi,Kitchen,Pool,Beach Access,Parking',
    vibeTags: 'family,beachfront,relaxed',
    descriptionShort: 'Spacious apartments steps from Diani Beach',
    pricePerNight: 95
  },
  {
    id: '10',
    name: 'Lalibela Eco Lodge',
    city: 'Lalibela',
    country: 'Ethiopia',
    category: 'Lodge',
    starRating: 4,
    discountPercent: 25,
    avgRating: 4.7,
    reviewCount: 76,
    amenities: 'Restaurant,Guided Tours,Cultural Experiences,Eco Tours',
    vibeTags: 'cultural,historic,nature',
    descriptionShort: 'Eco-lodge near ancient rock-hewn churches',
    pricePerNight: 145
  }
];

function buildSystemPrompt(): string {
  const hotelList = HOTEL_DATABASE.map(h => 
    `- **${h.name}** (${h.category}, ${h.starRating}★) in ${h.city}, ${h.country}: ${h.descriptionShort}. Price: $${h.pricePerNight}/night, ${h.discountPercent}% discount. Rating: ${h.avgRating}/5 (${h.reviewCount} reviews). Amenities: ${h.amenities}. Vibe: ${h.vibeTags}`
  ).join('\n');

  return `You are BusyBeds AI, a friendly and knowledgeable hotel recommendation assistant for BusyBeds - a hotel discount platform focused on Africa and beyond.

## Your Role
Help travelers find their perfect hotel by understanding their preferences and recommending from our partner hotels. You're conversational, helpful, and focused on finding the best matches.

## Available Hotels
${hotelList}

## Guidelines
1. **Be conversational**: Ask follow-up questions to understand preferences better
2. **Recommend wisely**: Only recommend hotels from the list above
3. **Highlight deals**: Mention discount percentages and value
4. **Be specific**: Include prices, ratings, and amenities when relevant
5. **Ask about**: Budget, location preference, travel purpose (business/leisure), amenities needed, group size
6. **Compare options**: When users ask, compare 2-3 hotels side by side
7. **Be honest**: If no perfect match, suggest the closest options and explain why

## Response Style
- Use emojis sparingly but effectively (🏨, 💰, ⭐, 🌍)
- Format hotel names in **bold**
- Use bullet points for comparisons
- Keep responses concise but informative
- End with a helpful question or suggestion

## Example Interaction
User: "I want a beach hotel in Kenya"
Assistant: "Great choice! Kenya has stunning coastline! 🏖️

Based on your preference for a beach hotel in Kenya, I found:

1. **Grand Riviera Beach Resort** (Mombasa) - 5⭐ luxury resort with 25% off. $280/night → $210. Perfect for romantic getaways with spa, pool, and private beach access.

2. **Diani Beach Apartments** (Diani) - 4⭐ family-friendly option with 28% off. $95/night → $68. Great for longer stays with kitchen access.

What's your budget range and who are you traveling with? This will help me narrow down the best option! 😊"`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages } = body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    // Build the system prompt with hotel data
    const systemPrompt = buildSystemPrompt();

    // Prepare messages for the AI
    const aiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))
    ];

    const completion = await zai.chat.completions.create({
      messages: aiMessages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 
      "I'm sorry, I couldn't process your request. Please try again!";

    return NextResponse.json({
      message: assistantMessage,
      success: true
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message', success: false },
      { status: 500 }
    );
  }
}
