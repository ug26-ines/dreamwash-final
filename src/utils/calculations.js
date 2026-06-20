import { RATES, ADDONS } from '../constants/pricing';

export const extractVAT = (total) => Math.round(total * 18 / 118);
export const netAmount  = (total) => total - extractVAT(total);

export function calculateOrder(weight, service, clientType, addons = [], memberKgRemaining = 0) {
  let base = 0;

  if (clientType === 'club' && memberKgRemaining > 0) {
    const freeKg = Math.min(weight, memberKgRemaining);
    const overKg = weight - freeKg;
    base = Math.round(RATES.club_over[service] * overKg);
  } else {
    const rate = RATES[clientType] || RATES.walkin;
    base = Math.round((rate[service] || 0) * weight);
  }

  const addonTotal = addons.reduce((sum, key) => {
    const addon = ADDONS.find(a => a.key === key);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const total = base + addonTotal;
  const vat   = extractVAT(total);
  const net   = total - vat;

  return { base, addonTotal, total, vat, net };
}
