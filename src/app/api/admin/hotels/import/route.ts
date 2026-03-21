import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { getSessionFromRequest } from '@/lib/auth';

// Zod schema for validating each hotel row
const HotelRowSchema = z.object({
  name: z.string().min(1, 'Hotel name is required'),
  slug: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  country: z.string().min(1, 'Country is required'),
  descriptionShort: z.string().min(1, 'Short description is required'),
  descriptionLong: z.string().optional(),
  starRating: z.coerce.number().int().min(1).max(5).default(3),
  discountPercent: z.coerce.number().int().min(5).max(80).default(15),
  coverImage: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  isFeatured: z.coerce.boolean().default(false),
});

type HotelRow = z.infer<typeof HotelRowSchema>;

// Helper to auto-generate slug
function generateSlug(name: string, existing: Set<string>): string {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  let slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  
  // Ensure uniqueness
  let counter = 1;
  while (existing.has(slug)) {
    slug = `${baseSlug}-${cuid().slice(0, 6)}`;
    counter++;
  }
  
  return slug;
}

export async function POST(req: NextRequest) {
  try {
    // Check admin access
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { rows } = body;

    if (!Array.isArray(rows)) {
      return NextResponse.json(
        { error: 'Invalid request: rows must be an array' },
        { status: 400 }
      );
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No hotels to import' },
        { status: 400 }
      );
    }

    // Get existing slugs
    const existingSlugs = new Set(
      (await prisma.hotel.findMany({ select: { slug: true } })).map(h => h.slug)
    );

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];

        // Validate row
        const validatedRow = HotelRowSchema.parse(row);

        // Generate slug if not provided or already taken
        let slug = validatedRow.slug;
        if (!slug || existingSlugs.has(slug)) {
          slug = generateSlug(validatedRow.name, existingSlugs);
        }

        // Check if hotel already exists (by name + city + country)
        const existing = await prisma.hotel.findFirst({
          where: {
            name: validatedRow.name,
            city: validatedRow.city,
            country: validatedRow.country,
          },
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create hotel
        await prisma.hotel.create({
          data: {
            name: validatedRow.name,
            slug,
            city: validatedRow.city,
            country: validatedRow.country,
            descriptionShort: validatedRow.descriptionShort,
            descriptionLong: validatedRow.descriptionLong || validatedRow.descriptionShort,
            starRating: validatedRow.starRating,
            discountPercent: validatedRow.discountPercent,
            coverImage: validatedRow.coverImage,
            websiteUrl: validatedRow.websiteUrl,
            isFeatured: validatedRow.isFeatured,
            status: 'active',
          },
        });

        existingSlugs.add(slug);
        created++;
      } catch (error) {
        skipped++;
        if (error instanceof z.ZodError) {
          errors.push(`Row ${i + 1}: ${error.errors[0]?.message || 'Validation error'}`);
        } else if (error instanceof Error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        } else {
          errors.push(`Row ${i + 1}: Unknown error`);
        }
      }
    }

    return NextResponse.json({
      created,
      skipped,
      errors: errors.slice(0, 10), // Limit errors to 10
    });
  } catch (error) {
    console.error('[CSV Import Error]', error);
    return NextResponse.json(
      { error: 'Failed to process import' },
      { status: 500 }
    );
  }
}
