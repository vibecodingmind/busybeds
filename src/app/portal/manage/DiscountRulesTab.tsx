'use client';
import { useState, useEffect } from 'react';
import type { DiscountRule } from '@/lib/discountRules';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const blank = (): DiscountRule => ({
  id: Math.random().toString(36).slice(2),
  name: '',
  type: 'period',
  discount: 20,
  startDate: '',
  endDate: '',
  days: [],
  isActive: true,
});

interface Props { hotelBaseDiscount: number; }

export default function DiscountRulesTab({ hotelBaseDiscount }: Props) {
  const [rules, setRules] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<DiscountRule>(blank());

  useEffect(() => {
    fetch('/api/portal/discount-rules')
      .then(r => r.json())
      .then(d => { setRules(d.rules || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const save = async (updated: DiscountRule[]) => {
    setSaving(true);
    try {
      const res = await fetch('/api/portal/discount-rules', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: updated }),
      });
      const data = await res.json();
      setRules(data.rules || updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Save failed'); }
    setSaving(false);
  };

  const toggleActive = (id: string) => {
    const updated = rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r);
    setRules(updated);
    save(updated);
  };

  const remove = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    save(updated);
  };

  const addRule = () => {
    if (!draft.name.trim()) return alert('Enter a rule name');
    if (draft.type === 'period' && (!draft.startDate || !draft.endDate)) return alert('Enter start and end date');
    if (draft.type === 'day_of_week' && (!draft.days || draft.days.length === 0)) return alert('Select at least one day');
    if (draft.discount < 1 || draft.discount > 80) return alert('Discount must be 1–80%');
    const updated = [...rules, { ...draft, id: Math.random().toString(36).slice(2) }];
    setRules(updated);
    save(updated);
    setAdding(false);
    setDraft(blank());
  };

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Loading rules…</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Dynamic Discount Rules</h3>
          <p className="text-sm text-gray-500 mt-0.5">Override the base {hotelBaseDiscount}% discount on specific dates, seasons, or days of the week.</p>
        </div>
        {saved && <span className="text-sm text-green-600 font-medium">✓ Saved</span>}
      </div>

      {/* Rules list */}
      {rules.length === 0 && !adding && (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="text-2xl mb-2">🏷️</p>
          <p className="text-gray-500 text-sm">No dynamic rules yet. Add rules to offer special discounts during events, seasons, or weekends.</p>
        </div>
      )}

      <div className="space-y-3">
        {rules.map(r => (
          <div key={r.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${r.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50 opacity-60'}`}>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{r.name}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold text-white" style={{ background: '#FF385C' }}>
                  {r.discount}% off
                </span>
                {!r.isActive && <span className="text-xs text-gray-400">(paused)</span>}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {r.type === 'period' && `${r.startDate} → ${r.endDate}`}
                {r.type === 'day_of_week' && `Every ${(r.days || []).map(d => DAY_NAMES[d]).join(', ')}`}
                {r.type === 'always' && 'Always active (permanent override)'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(r.id)}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${r.isActive ? 'border-gray-200 text-gray-500 hover:border-amber-400 hover:text-amber-600' : 'border-green-200 text-green-600 hover:bg-green-50'}`}>
                {r.isActive ? 'Pause' : 'Resume'}
              </button>
              <button onClick={() => remove(r.id)}
                className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-red-400 hover:border-red-300 hover:text-red-600 font-medium transition-colors">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add rule form */}
      {adding ? (
        <div className="p-4 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/30 space-y-4">
          <h4 className="font-medium text-gray-900 text-sm">New Rule</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-gray-500 block mb-1">Rule name</label>
              <input className="input text-sm" placeholder="e.g. Christmas Sale, Weekend Deal"
                value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Type</label>
              <select className="input text-sm" value={draft.type}
                onChange={e => setDraft({ ...draft, type: e.target.value as DiscountRule['type'], days: [], startDate: '', endDate: '' })}>
                <option value="period">Date range</option>
                <option value="day_of_week">Day of week</option>
                <option value="always">Always active</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Discount (%)</label>
              <input className="input text-sm" type="number" min={1} max={80}
                value={draft.discount} onChange={e => setDraft({ ...draft, discount: parseInt(e.target.value) || 0 })} />
            </div>
            {draft.type === 'period' && (
              <>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Start date</label>
                  <input className="input text-sm" type="date" value={draft.startDate}
                    onChange={e => setDraft({ ...draft, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">End date</label>
                  <input className="input text-sm" type="date" value={draft.endDate}
                    onChange={e => setDraft({ ...draft, endDate: e.target.value })} />
                </div>
              </>
            )}
            {draft.type === 'day_of_week' && (
              <div className="col-span-2">
                <label className="text-xs text-gray-500 block mb-2">Active on days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_NAMES.map((day, i) => {
                    const active = draft.days?.includes(i);
                    return (
                      <button key={i} type="button"
                        onClick={() => setDraft(prev => ({
                          ...prev,
                          days: active ? (prev.days || []).filter(d => d !== i) : [...(prev.days || []), i],
                        }))}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${active ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'}`}>
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setAdding(false); setDraft(blank()); }}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button onClick={addRule} disabled={saving}
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50">
              {saving ? 'Adding…' : 'Add Rule'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)}
          className="w-full py-3 rounded-xl border-2 border-dashed border-gray-200 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add discount rule
        </button>
      )}

      <p className="text-xs text-gray-400 mt-2">
        When multiple rules match the same day, the highest discount applies. The base discount ({hotelBaseDiscount}%) applies when no rules match.
      </p>
    </div>
  );
}
