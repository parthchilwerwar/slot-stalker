// lib/scoring.ts — Alternative restaurant scoring algorithm

const CUISINE_FAMILIES: Record<string, string[]> = {
  Indian: ['North Indian', 'South Indian', 'Mughlai', 'Modern Indian', 'Punjabi', 'Rajasthani'],
  Asian: ['Chinese', 'Japanese', 'Thai', 'Korean', 'Pan-Asian', 'Burmese'],
  Western: ['Italian', 'Continental', 'American', 'Mediterranean', 'Mexican'],
  'Middle Eastern': ['Lebanese', 'Persian', 'Arabian'],
};

function getCuisineFamily(cuisine: string): string | null {
  for (const [family, members] of Object.entries(CUISINE_FAMILIES)) {
    if (members.includes(cuisine) || family === cuisine) return family;
  }
  return null;
}

const ADJACENT_FAMILIES: Record<string, string[]> = {
  Indian: ['Middle Eastern'],
  Asian: ['Indian'],
  Western: ['Middle Eastern'],
  'Middle Eastern': ['Indian', 'Western'],
};

function minutesSinceMidnight(timeStr: string): number {
  const cleaned = timeStr.trim().toUpperCase();
  if (!cleaned.includes('AM') && !cleaned.includes('PM') && cleaned.includes(':')) {
    const [h, m] = cleaned.split(':').map(Number);
    return h * 60 + m;
  }
  const isPM = cleaned.includes('PM');
  const timePart = cleaned.replace(/(AM|PM)/g, '').trim();
  const [hStr, mStr] = timePart.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr || '0', 10);
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h * 60 + m;
}

interface ScoringCandidate {
  cuisine: string;
  priceRange: number;
  rating: number;
  bestAvailableSlot: string | null;
}

interface ScoringTarget {
  cuisine: string;
  priceRange: number;
  rating: number;
}

export function scoreAlternate(
  candidate: ScoringCandidate,
  target: ScoringTarget,
  preferredFrom: string
): number {
  let cuisineScore: number;
  if (candidate.cuisine === target.cuisine) {
    cuisineScore = 100;
  } else {
    const cf = getCuisineFamily(candidate.cuisine);
    const tf = getCuisineFamily(target.cuisine);
    if (cf && tf && cf === tf) cuisineScore = 70;
    else if (cf && tf && ADJACENT_FAMILIES[tf]?.includes(cf)) cuisineScore = 40;
    else cuisineScore = 10;
  }

  const priceDelta = Math.abs(candidate.priceRange - target.priceRange);
  const priceScore = priceDelta === 0 ? 100 : priceDelta === 1 ? 60 : 20;

  let slotScore: number;
  if (!candidate.bestAvailableSlot) {
    slotScore = 0;
  } else {
    const diff = Math.abs(
      minutesSinceMidnight(candidate.bestAvailableSlot) - minutesSinceMidnight(preferredFrom)
    );
    slotScore = diff <= 30 ? 100 : diff <= 60 ? 70 : diff <= 120 ? 40 : 10;
  }

  const ratingDelta = target.rating - candidate.rating;
  const ratingScore = ratingDelta <= 0 ? 100 : ratingDelta <= 0.3 ? 70 : 30;

  return Math.round(cuisineScore * 0.35 + priceScore * 0.25 + slotScore * 0.25 + ratingScore * 0.15);
}
