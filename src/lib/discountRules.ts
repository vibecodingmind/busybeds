/**
 * Dynamic Discount Rules
 * Rules are stored as a JSON array on Hotel.discountRules
 *
 * Rule types:
 * - period:     active between startDate and endDate (YYYY-MM-DD)
 * - day_of_week: active on specific days (0=Sun, 1=Mon … 6=Sat)
 * - always:     permanent override (lower priority than period/day rules)
 */

export interface DiscountRule {
  id: string;
  name: string;
  type: 'period' | 'day_of_week' | 'always';
  discount: number;       // 1-80
  // period fields
  startDate?: string;     // "YYYY-MM-DD"
  endDate?: string;       // "YYYY-MM-DD"
  // day_of_week fields
  days?: number[];        // [0,6] = weekends
  isActive: boolean;
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/**
 * Given hotel's discountRules JSON and base discountPercent,
 * returns the effective discount percent for the current moment.
 * Returns the HIGHEST matching rule's discount, or base if none match.
 */
export function getEffectiveDiscount(
  discountRulesJson: string,
  baseDiscount: number,
  now: Date = new Date(),
): { discount: number; ruleName: string | null } {
  let rules: DiscountRule[] = [];
  try { rules = JSON.parse(discountRulesJson || '[]'); } catch { return { discount: baseDiscount, ruleName: null }; }

  const active = rules.filter(r => r.isActive);
  if (!active.length) return { discount: baseDiscount, ruleName: null };

  const today = toDateStr(now);
  const dow = now.getDay(); // 0=Sun

  const matching = active.filter(r => {
    if (r.type === 'period') {
      return r.startDate && r.endDate && today >= r.startDate && today <= r.endDate;
    }
    if (r.type === 'day_of_week') {
      return Array.isArray(r.days) && r.days.includes(dow);
    }
    if (r.type === 'always') return true;
    return false;
  });

  if (!matching.length) return { discount: baseDiscount, ruleName: null };

  // Pick the rule with the highest discount
  const best = matching.reduce((a, b) => (b.discount > a.discount ? b : a));
  return { discount: best.discount, ruleName: best.name };
}

export function parseRules(json: string): DiscountRule[] {
  try { return JSON.parse(json || '[]'); } catch { return []; }
}
