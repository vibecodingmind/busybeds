'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  FileText, 
  Wand2,
  Loader2,
  Building2,
  MapPin,
  Star,
  Users,
  Palette
} from 'lucide-react';

interface DescriptionGeneratorProps {
  onDescriptionGenerated?: (shortDesc: string, longDesc: string) => void;
  hotelData?: {
    name?: string;
    city?: string;
    country?: string;
    category?: string;
    starRating?: number;
    amenities?: string[];
  };
}

const AMENITY_OPTIONS = [
  'WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Bar', 'Beach Access',
  'Parking', 'Room Service', 'Airport Shuttle', 'Conference Room',
  'Laundry', 'Kitchen', 'Air Conditioning', 'Pet Friendly', 'Garden',
  'Terrace', 'Ocean View', 'Mountain View', 'Fireplace'
];

const HIGHLIGHT_OPTIONS = [
  'Stunning Views', 'Award-Winning Restaurant', 'Infinity Pool',
  'Private Beach', 'Rooftop Bar', 'Historic Building', 'Eco-Friendly',
  'Family Friendly', 'Romantic Setting', 'Business Center',
  'Wellness Center', 'Adventure Activities', 'Cultural Experiences',
  'Local Cuisine', 'Nightlife Nearby'
];

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professional', description: 'Formal, polished language' },
  { value: 'casual', label: 'Casual', description: 'Friendly, relaxed language' },
  { value: 'luxury', label: 'Luxury', description: 'Sophisticated, elegant language' },
  { value: 'adventure', label: 'Adventure', description: 'Exciting, energetic language' }
];

const CATEGORY_OPTIONS = [
  'Hotel', 'Resort', 'Villa', 'Apartment', 'Lodge', 'Boutique',
  'Guesthouse', 'Hostel', 'Bed & Breakfast', 'Motel', 'Campsite'
];

export default function DescriptionGenerator({ 
  onDescriptionGenerated,
  hotelData 
}: DescriptionGeneratorProps) {
  const [hotelName, setHotelName] = useState(hotelData?.name || '');
  const [city, setCity] = useState(hotelData?.city || '');
  const [country, setCountry] = useState(hotelData?.country || '');
  const [category, setCategory] = useState(hotelData?.category || 'Hotel');
  const [starRating, setStarRating] = useState(hotelData?.starRating || 4);
  const [amenities, setAmenities] = useState<string[]>(hotelData?.amenities || []);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'luxury' | 'adventure'>('professional');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [shortDescription, setShortDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [copied, setCopied] = useState<'short' | 'long' | null>(null);

  const toggleAmenity = (amenity: string) => {
    setAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const toggleHighlight = (highlight: string) => {
    setHighlights(prev => 
      prev.includes(highlight) 
        ? prev.filter(h => h !== highlight)
        : [...prev, highlight]
    );
  };

  const generateDescription = async () => {
    if (!hotelName || !city || !country) {
      return;
    }

    setIsGenerating(true);
    setShortDescription('');
    setLongDescription('');

    try {
      const response = await fetch('/api/ai/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelName,
          city,
          country,
          category,
          starRating,
          amenities,
          highlights,
          targetAudience,
          tone
        })
      });

      const data = await response.json();

      if (data.success) {
        setShortDescription(data.shortDescription);
        setLongDescription(data.longDescription);
        
        if (onDescriptionGenerated) {
          onDescriptionGenerated(data.shortDescription, data.longDescription);
        }
      } else {
        throw new Error(data.error || 'Failed to generate description');
      }
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'short' | 'long') => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const isFormValid = hotelName && city && country;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Description Generator</CardTitle>
              <CardDescription>Create compelling hotel descriptions in seconds</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hotelName" className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Hotel Name *
              </Label>
              <Input
                id="hotelName"
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                placeholder="e.g., Grand Riviera Beach Resort"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                City *
              </Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Mombasa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                Country *
              </Label>
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g., Kenya"
              />
            </div>
          </div>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="w-4 h-4 text-gray-400" />
              Star Rating
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  onClick={() => setStarRating(rating)}
                  className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                    starRating === rating 
                      ? 'bg-yellow-100 border-2 border-yellow-400' 
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg font-bold">{rating}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map(amenity => (
                <Badge
                  key={amenity}
                  variant={amenities.includes(amenity) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    amenities.includes(amenity) 
                      ? 'bg-pink-500 hover:bg-pink-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </Badge>
              ))}
            </div>
          </div>

          {/* Highlights */}
          <div className="space-y-2">
            <Label>Special Highlights</Label>
            <div className="flex flex-wrap gap-2">
              {HIGHLIGHT_OPTIONS.map(highlight => (
                <Badge
                  key={highlight}
                  variant={highlights.includes(highlight) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    highlights.includes(highlight) 
                      ? 'bg-purple-500 hover:bg-purple-600' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => toggleHighlight(highlight)}
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>

          {/* Target Audience & Tone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="audience" className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                Target Audience
              </Label>
              <Input
                id="audience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., Couples, families, business travelers"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-400" />
                Writing Tone
              </Label>
              <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-xs text-gray-500 ml-2">{opt.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateDescription}
            disabled={!isFormValid || isGenerating}
            className="w-full h-12 text-base font-semibold"
            style={{ 
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
            }}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate AI Description
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Output Section */}
      {(shortDescription || longDescription || isGenerating) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-500" />
                Generated Descriptions
              </CardTitle>
              {shortDescription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateDescription}
                  disabled={isGenerating}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Regenerate
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="short">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="short">Short Description</TabsTrigger>
                <TabsTrigger value="long">Full Description</TabsTrigger>
              </TabsList>
              
              <TabsContent value="short" className="space-y-4">
                {isGenerating && !shortDescription ? (
                  <div className="h-24 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="p-4 bg-gray-50 rounded-lg min-h-24">
                      <p className="text-gray-800">{shortDescription}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(shortDescription, 'short')}
                    >
                      {copied === 'short' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">Perfect for listing cards and search results (1-2 sentences)</p>
              </TabsContent>
              
              <TabsContent value="long" className="space-y-4">
                {isGenerating && !longDescription ? (
                  <div className="h-48 bg-gray-50 rounded-lg animate-pulse flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="p-4 bg-gray-50 rounded-lg min-h-48">
                      <p className="text-gray-800 whitespace-pre-wrap">{longDescription}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(longDescription, 'long')}
                    >
                      {copied === 'long' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-gray-500">Full description for your hotel page (3-4 paragraphs)</p>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
