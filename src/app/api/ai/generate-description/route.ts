import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export const maxDuration = 60;

interface DescriptionRequest {
  hotelName: string;
  city: string;
  country: string;
  category: string;
  starRating: number;
  amenities: string[];
  highlights: string[];
  targetAudience: string;
  tone: 'professional' | 'casual' | 'luxury' | 'adventure';
  language?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DescriptionRequest;
    
    const {
      hotelName,
      city,
      country,
      category,
      starRating,
      amenities,
      highlights,
      targetAudience,
      tone = 'professional',
      language = 'English'
    } = body;

    if (!hotelName || !city || !country) {
      return NextResponse.json(
        { error: 'Hotel name, city, and country are required' },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const toneGuidelines = {
      professional: 'Use formal, polished language. Focus on quality and service excellence.',
      casual: 'Use friendly, relaxed language. Make it feel welcoming and approachable.',
      luxury: 'Use sophisticated, elegant language. Emphasize exclusivity and premium experiences.',
      adventure: 'Use exciting, energetic language. Highlight experiences and unique activities.'
    };

    const systemPrompt = `You are an expert hotel copywriter specializing in creating compelling hotel descriptions for travel platforms. Write descriptions that inspire travelers to book.

## Guidelines
- Write in ${language}
- Use ${tone} tone: ${toneGuidelines[tone]}
- Be specific and authentic - avoid generic phrases
- Highlight unique selling points
- Create an emotional connection with readers
- Include sensory details when possible
- Keep it SEO-friendly with natural keyword placement

## Target Audience
${targetAudience || 'General travelers'}

## Output Format
Generate TWO versions:
1. **Short Description** (1-2 sentences, ~25 words) - Perfect for listing cards
2. **Long Description** (3-4 paragraphs, ~200 words) - Full hotel page description

Format your response exactly like this:
SHORT: [short description here]

LONG: [long description here]`;

    const userPrompt = `Create a compelling hotel description for:

**Hotel Name:** ${hotelName}
**Location:** ${city}, ${country}
**Category:** ${category}
**Star Rating:** ${starRating} stars
**Amenities:** ${amenities.join(', ')}
**Special Highlights:** ${highlights.join(', ')}
**Target Audience:** ${targetAudience || 'General travelers'}

Write descriptions that will make travelers want to book immediately!`;

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const content = completion.choices[0]?.message?.content || '';

    // Parse the response
    let shortDescription = '';
    let longDescription = '';

    const shortMatch = content.match(/SHORT:\s*([\s\S]*?)(?=LONG:|$)/i);
    const longMatch = content.match(/LONG:\s*([\s\S]*?)$/i);

    if (shortMatch) {
      shortDescription = shortMatch[1].trim();
    }
    if (longMatch) {
      longDescription = longMatch[1].trim();
    }

    // Fallback if parsing fails
    if (!shortDescription && !longDescription) {
      const paragraphs = content.split('\n\n').filter(p => p.trim());
      shortDescription = paragraphs[0] || '';
      longDescription = paragraphs.slice(1).join('\n\n') || content;
    }

    return NextResponse.json({
      success: true,
      shortDescription,
      longDescription,
      rawContent: content
    });

  } catch (error) {
    console.error('AI Description Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description', success: false },
      { status: 500 }
    );
  }
}
