export const VIBE_TAGS = [
  { id: 'quiet',     label: 'Quiet',            emoji: '🤫' },
  { id: 'romantic',  label: 'Romantic',          emoji: '💕' },
  { id: 'business',  label: 'Business-Friendly', emoji: '💼' },
  { id: 'lively',    label: 'Lively',            emoji: '🎉' },
  { id: 'eco',       label: 'Eco-Friendly',      emoji: '🌿' },
  { id: 'beach',     label: 'Beach Vibes',       emoji: '🏖️' },
  { id: 'mountain',  label: 'Mountain Retreat',  emoji: '🏔️' },
  { id: 'family',    label: 'Family-Friendly',   emoji: '👨‍👩‍👧' },
  { id: 'pets',      label: 'Pet-Friendly',      emoji: '🐾' },
  { id: 'pool',      label: 'Pool Paradise',     emoji: '🏊' },
  { id: 'foodie',    label: 'Foodie Haven',      emoji: '🍽️' },
  { id: 'wellness',  label: 'Wellness & Spa',    emoji: '💆' },
  { id: 'city',      label: 'City Center',       emoji: '🌃' },
  { id: 'scenic',    label: 'Scenic Views',      emoji: '🌄' },
] as const;

export type VibeTagId = typeof VIBE_TAGS[number]['id'];

export function getVibeTag(id: string) {
  return VIBE_TAGS.find(v => v.id === id);
}
