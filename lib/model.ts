// Token Radar — model radar-2.
//
// One snapshot of the protocol universe in, one ranked board out.
//
// The board ranks every protocol the snapshot records as pre-token that can
// plausibly issue a token of its own: the watchlist (the floor, never a
// ceiling) plus every other rankable pre-token protocol below the floor, the
// early rows this radar exists to find. A protocol is pre-token when its
// record carries no token at all (no market cap, no CoinGecko id, no symbol).
// Wrapped, staked and bridged products of a token that already trades, the
// centralised exchanges, and versioned pools of another protocol are never
// ranked: their token already exists somewhere else, so ranking them would
// answer the wrong question. They are counted and named in the dashboard
// instead, so a reader can see exactly what was left out and why.
//
// Implied value follows only from the snapshot's own figures — never from a
// hand-kept list of names, so the same function scores a protocol the
// snapshot has never seen before:
//
//   base        = tvl_usd x CATEGORY_MULTIPLE[category]
//   growth      = clamp(change_7d, -60, 150) per cent
//   growthMult  = 1 + (growth / 100) x 0.5, floored at 0.70
//   maturity    = age curve: 0.55 at day 0, rising to 1.00 at 3 years, then
//                 easing back to 0.85 by year 10 — a protocol that has run
//                 for years with no token has built the value a launch
//                 would price, while one that has run a decade without
//                 ever launching is a weaker launch candidate
//   chainMult   = 1 + 0.02 x min(chains - 1, 8), at most 1.16 — reach
//                 across chains is reach across user bases
//   implied     = max(1, round(base x growthMult x maturity x chainMult))
//
// CATEGORY_MULTIPLE is a stated table, not a per-name tweak: exchanges of
// value (DEXs, lending, derivatives) price dearer per dollar locked than
// wrappers of yield, and real-world-asset protocols dearer still in the
// other direction — the table is in the dashboard's model panel, and the
// dashboard's sandbox recomputes every row live when a reader changes a
// constant, so the model is inspectable, not asserted.

/** The snapshot's protocol entry: exactly the ten fields the sealed input carries. */
export interface SnapshotProtocol {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
}

/** The whole snapshot document. */
export interface Snapshot {
  as_of: string;
  source: string;
  floor_usd: number;
  protocols: SnapshotProtocol[];
  watchlist: string[];
}

/** The model's constants, as the dashboard states them and the sandbox may change them. */
export interface ModelConstants {
  default_multiple: number;
  growth_weight: number;
  growth_floor: number;
  growth_cap: number;
  growth_mult_floor: number;
  maturity_floor: number;
  maturity_peak_days: number;
  maturity_tail: number;
  maturity_tail_days: number;
  chain_step: number;
  chain_max_extra: number;
  unknown_age_days: number;
  category_multiples: Record<string, number>;
}

export const MODEL: ModelConstants = {
  default_multiple: 0.25,
  growth_weight: 0.5,
  growth_floor: -60,
  growth_cap: 150,
  growth_mult_floor: 0.7,
  maturity_floor: 0.55,
  maturity_peak_days: 1095,
  maturity_tail: 0.85,
  maturity_tail_days: 3650,
  chain_step: 0.02,
  chain_max_extra: 8,
  unknown_age_days: 365,
  category_multiples: {
    Dexs: 0.35,
    Lending: 0.32,
    Derivatives: 0.3,
    'Perpetuals': 0.3,
    CDP: 0.3,
    'CDP Manager': 0.3,
    Restaking: 0.3,
    'Yield Aggregator': 0.28,
    Yield: 0.28,
    'Leveraged Farming': 0.28,
    'Liquidity Manager': 0.28,
    Farm: 0.26,
    'Onchain Capital Allocator': 0.26,
    'Risk Curators': 0.26,
    'Collateral Markets': 0.26,
    'Uncollateralized Lending': 0.26,
    'Interest Rate Derivatives': 0.26,
    RWA: 0.22,
    'Basis Trading': 0.24,
    'Prediction Market': 0.3,
    'Options Vault': 0.26,
    'Decentralized BTC': 0.24,
    'Anchor BTC': 0.22,
    'Dual-Token Stablecoin': 0.22,
    'Stablecoin Wrapper': 0.2,
    'OTC Marketplace': 0.24,
    Payments: 0.28,
    Privacy: 0.28,
    Insurance: 0.24,
    Indexes: 0.24,
    'Governance Incentives': 0.22,
    'Crypto Card Issuer': 0.24,
    'Staking Pool': 0.24,
    Chain: 0.2,
    CeDeFi: 0.22,
  },
};

/** The model's version label: the dashboard names it and the rules quote it. */
export const MODEL_VERSION = 'radar-2';

/** How many live-token protocols the Live token view carries, by market cap. */
export const LIVE_ROWS = 24;

/** A farm step: the action, what it costs, and how long it takes. */
export interface FarmStep {
  text: string;
  cost: string;
  time: string;
}

/** One row of board.json: the ranked board's row. */
export interface BoardRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  gecko_id: string | null;
  symbol: string | null;
  token_status: 'pre-token';
  age_days: number | null;
  implied_value_usd: number;
  likelihood: 'High' | 'Medium' | 'Low';
  why: string;
  capital_usd: number;
  model: {
    category_multiple: number;
    growth_pct: number;
    growth_multiplier: number;
    maturity_multiplier: number;
    chain_multiplier: number;
    age_days: number | null;
  };
  farm_steps: string[];
}

/** The dashboard's compact view of one row, with farm plans generated in the page. */
export interface RadarRow {
  rank: number;
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  change_7d: number | null;
  mcap_usd: number | null;
  listed_at: string | null;
  age_days: number | null;
  implied_value_usd: number;
  likelihood: 'High' | 'Medium' | 'Low';
  why: string;
  capital_usd: number;
  watch: boolean;
  category_multiple: number;
  growth_multiplier: number;
  maturity_multiplier: number;
  chain_multiplier: number;
  farm_steps: string[];
}

/** A live-token protocol: it already trades, so the board shows the market's own value, not a model's. */
export interface LiveRow {
  slug: string;
  name: string;
  category: string | null;
  chains: string[];
  tvl_usd: number;
  mcap_usd: number | null;
  change_7d: number | null;
}

/** Why a protocol is not ranked, counted for the dashboard's transparency panel. */
export interface ExcludedCounts {
  live_token: number;
  cex: number;
  wrapped_staked_bridge: number;
  versioned: number;
}

/** Everything the dashboard needs: the board, the live set, and the model it runs. */
export interface RadarData {
  as_of: string;
  source: string;
  floor_usd: number;
  model: ModelConstants;
  model_version: string;
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
  excluded: ExcludedCounts;
  rows: RadarRow[];
  live: LiveRow[];
}

/** Why the snapshot is not one this model can score. */
export class SnapshotError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SnapshotError';
  }
}

const DAY_MS = 86_400_000;

/** A finite number, else `fallback`. */
function finite(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** A whole day count from `from` to `to`, clamped at zero; null when either date is absent or bad. */
export function ageDays(asOf: string, listedAt: string | null): number | null {
  if (listedAt === null) return null;
  const a = Date.parse(`${asOf}T00:00:00Z`);
  const b = Date.parse(`${listedAt}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.floor((a - b) / DAY_MS));
}

/** The base multiple for a category: the table's value, or the default. */
export function categoryMultiple(category: string | null, model: ModelConstants): number {
  if (category !== null && Object.prototype.hasOwnProperty.call(model.category_multiples, category)) {
    return model.category_multiples[category]!;
  }
  return model.default_multiple;
}

/** The maturity multiplier for an age in days: 0.55 at birth, 1.00 at 3 years, easing to 0.85. */
export function maturityMultiplier(age: number | null, model: ModelConstants): number {
  const a = age ?? model.unknown_age_days;
  if (a <= 0) return model.maturity_floor;
  if (a <= model.maturity_peak_days) {
    return model.maturity_floor + (1 - model.maturity_floor) * (a / model.maturity_peak_days);
  }
  const tail = Math.min(1, (a - model.maturity_peak_days) / model.maturity_tail_days);
  return 1 - (1 - model.maturity_tail) * tail;
}

/** The four multipliers and the implied value one protocol gets under `model`. */
export function impliedValue(
  protocol: SnapshotProtocol,
  asOf: string,
  model: ModelConstants,
): { implied: number; catMult: number; growthPct: number; growthMult: number; maturityMult: number; chainMult: number; age: number | null } {
  const age = ageDays(asOf, protocol.listed_at);
  const rawGrowth = finite(protocol.change_7d, 0);
  const growthPct = Math.min(model.growth_cap, Math.max(model.growth_floor, rawGrowth));
  const growthMult = Math.max(model.growth_mult_floor, 1 + (growthPct / 100) * model.growth_weight);
  const maturityMult = maturityMultiplier(age, model);
  const chainMult = 1 + model.chain_step * Math.min(Math.max(protocol.chains.length - 1, 0), model.chain_max_extra);
  const catMult = categoryMultiple(protocol.category, model);
  const implied = Math.max(1, Math.round(protocol.tvl_usd * catMult * growthMult * maturityMult * chainMult));
  return { implied, catMult, growthPct, growthMult, maturityMult, chainMult, age };
}

/** A launch-likelihood band from the protocol's own figures, never its name. */
export function likelihood(
  tvl: number,
  age: number | null,
  growthPct: number,
  chains: number,
): 'High' | 'Medium' | 'Low' {
  let points = 0;
  if (tvl >= 500_000_000) points += 3;
  else if (tvl >= 100_000_000) points += 2;
  else if (tvl >= 25_000_000) points += 1;
  if (age !== null && age >= 730) points += 2;
  else if (age !== null && age >= 365) points += 1;
  if (growthPct >= 10) points += 1;
  else if (growthPct < -20) points -= 1;
  if (chains >= 3) points += 1;
  if (points >= 5) return 'High';
  if (points >= 3) return 'Medium';
  return 'Low';
}

/** One line saying why a row ranks where it does, from its own figures. */
export function whyLine(p: SnapshotProtocol, age: number | null, implied: number): string {
  const tvl = `$${Math.round(p.tvl_usd / 1_000_000)}M TVL`;
  const growth = p.change_7d === null ? '7d change unreported' : `${p.change_7d >= 0 ? '+' : ''}${p.change_7d}% in 7d`;
  const ageText = age === null ? 'age unreported' : age < 365 ? `${age}d old` : `${(age / 365).toFixed(1)}y old`;
  const chainText = p.chains.length === 1 ? `on ${p.chains[0]}` : `on ${p.chains.length} chains`;
  return `${tvl} · ${growth} · ${ageText} · ${chainText} · no token recorded, so a launch would price ${tvl} of locked value.`;
}

/** DefiLlama's version-marker rule: a name ending in a release is a pool of another protocol. */
const VERSIONED = /\s(V\d+(\.\d+)?|v\d+(\.\d+)?|\d+\.\d+)$/;

/** Categories whose products are another token's wrapped, staked or bridged form. */
const WRAPPED_CATEGORIES = new Set(['Bridge', 'Canonical Bridge', 'Liquid Staking', 'Liquid Restaking', 'Restaked BTC', 'Cross Chain Bridge']);

/** Whether a protocol records no token at all. */
export function isPreToken(p: SnapshotProtocol): boolean {
  return p.mcap_usd === null && p.gecko_id === null && p.symbol === null;
}

/** Whether a protocol's name marks it a wrapped, staked or bridged product. */
export function isWrappedProduct(p: SnapshotProtocol): boolean {
  return WRAPPED_CATEGORIES.has(p.category ?? '') || /\b(wrapped|staked|staking)\b/i.test(p.name);
}

/** Whether a protocol is one the board may rank: pre-token, not an exchange, not a versioned pool, not a wrapped product. */
export function isRankable(p: SnapshotProtocol): boolean {
  return isPreToken(p) && p.category !== 'CEX' && !VERSIONED.test(p.name) && !isWrappedProduct(p);
}

/** The snapshot's protocol by slug. */
function bySlug(protocols: SnapshotProtocol[]): Map<string, SnapshotProtocol> {
  return new Map(protocols.map((p) => [p.slug, p]));
}

/** The headline sentence's figures: how many watchlist slugs, how many rows, how many live protocols. */
export interface BoardSummary {
  watchlist_size: number;
  board_size: number;
  early_size: number;
  live_size: number;
}

/** The protocols the board ranks, strongest first, with ranks 1..n. */
export function buildBoard(snapshot: Snapshot, model: ModelConstants = MODEL): BoardRow[] {
  const index = bySlug(snapshot.protocols);
  const chosen = new Map<string, SnapshotProtocol>();
  // The watchlist is the floor: every slug, even one the snapshot no longer carries (it cannot, but the
  // board's coverage is the gate's row and is never gambled on a missing record).
  for (const slug of snapshot.watchlist) {
    const p = index.get(slug);
    if (p !== undefined) chosen.set(slug, p);
  }
  // The early radar: every other rankable pre-token protocol, at any TVL — the floor is never the
  // whole board, and a future launch is likeliest to come from below it.
  for (const p of snapshot.protocols) {
    if (!chosen.has(p.slug) && isRankable(p)) chosen.set(p.slug, p);
  }

  const scored = [...chosen.values()].map((p) => {
    const v = impliedValue(p, snapshot.as_of, model);
    return { p, ...v };
  });
  scored.sort((a, b) => b.implied - a.implied || (a.p.slug < b.p.slug ? -1 : a.p.slug > b.p.slug ? 1 : 0));
  return scored.map((s, i) => ({
    rank: i + 1,
    slug: s.p.slug,
    name: s.p.name,
    category: s.p.category,
    chains: s.p.chains,
    tvl_usd: s.p.tvl_usd,
    change_7d: s.p.change_7d,
    mcap_usd: s.p.mcap_usd,
    listed_at: s.p.listed_at,
    gecko_id: s.p.gecko_id,
    symbol: s.p.symbol,
    token_status: 'pre-token',
    age_days: s.age,
    implied_value_usd: s.implied,
    likelihood: likelihood(s.p.tvl_usd, s.age, s.growthPct, s.p.chains.length),
    why: whyLine(s.p, s.age, s.implied),
    capital_usd: capitalFor(s.p),
    model: {
      category_multiple: s.catMult,
      growth_pct: s.growthPct,
      growth_multiplier: round4(s.growthMult),
      maturity_multiplier: round4(s.maturityMult),
      chain_multiplier: round4(s.chainMult),
      age_days: s.age,
    },
    farm_steps: farmSteps(s.p, s.age).map(stepText),
  }));
}

const round4 = (n: number): number => Math.round(n * 1e4) / 1e4;

/** A step as one string: its action, then its cost and time, within the gate's 20..600 characters. */
export function stepText(step: FarmStep): string {
  let s = `${step.text} Cost: ${step.cost}. Time: ${step.time}.`;
  if (s.length > 600) s = `${s.slice(0, 596)}...`;
  if (s.length < 20) s = `${s} Hold the position and check the protocol's own page.`;
  return s;
}

/** The first chain a protocol names, or a neutral phrase. */
function chainOf(p: SnapshotProtocol): string {
  return p.chains.length > 0 ? p.chains[0]! : 'its main chain';
}

/** How much capital one farm position needs, from the protocol's own TVL. */
export function capitalFor(p: SnapshotProtocol): number {
  if (p.tvl_usd >= 5_000_000_000) return 250;
  if (p.tvl_usd >= 1_000_000_000) return 150;
  if (p.tvl_usd >= 100_000_000) return 100;
  return 50;
}

/** How long to hold, from the protocol's age: younger protocols get a longer qualifying window. */
function holdDaysFor(age: number | null): number {
  if (age === null) return 30;
  if (age < 180) return 60;
  if (age < 365) return 45;
  return 30;
}

/** The category's one action, in the words a farmer can follow. */
function actionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('lend') || c.includes('cdp') || c.includes('collateral')) return `Supply $${capital} of USDC to ${name} on ${chain} and keep the position open.`;
  if (c.includes('dex') || c.includes('yield') || c.includes('leveraged farm')) return `Provide $${capital} of liquidity to ${name}'s main pool on ${chain} and keep the position open.`;
  if (c.includes('bridge')) return `Bridge $${capital} of USDC to ${chain} through ${name} and use the bridged funds in its app.`;
  if (c.includes('staking') || c.includes('restak')) return `Stake $${capital} of the chain's staking asset through ${name} and keep the receipt.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Deposit $${capital} of USDC as margin on ${name} and open one small hedge.`;
  if (c.includes('prediction')) return `Fund $${capital} and place one market position on ${name}.`;
  if (c.includes('curator') || c.includes('allocator')) return `Deposit $${capital} into a ${name} vault on ${chain} and keep the shares.`;
  if (c.includes('stable')) return `Mint or deposit $${capital} of the stable asset through ${name} on ${chain}.`;
  if (c.includes('rwa')) return `Mint $${capital} of the protocol's yield asset on ${chain} and hold it.`;
  if (c.includes('insurance')) return `Buy $${capital} of cover from ${name} on ${chain} and keep the policy.`;
  if (c.includes('payment') || c.includes('card')) return `Spend $${capital} through ${name} on ${chain} and keep the receipts.`;
  if (c.includes('privacy')) return `Use $${capital} through ${name}'s private flow on ${chain} and keep the receipt.`;
  return `Deposit $${capital} of USDC into ${name} on ${chain} and keep the position open.`;
}

/** A second, different qualifying action for the same protocol, so the weekly cadence is real. */
function secondActionFor(p: SnapshotProtocol, capital: number, chain: string): string {
  const c = (p.category ?? '').toLowerCase();
  const name = p.name;
  if (c.includes('dex') || c.includes('yield') || c.includes('farm')) return `Swap $${Math.max(10, Math.round(capital / 5))} through ${name} on ${chain} once a week.`;
  if (c.includes('lend') || c.includes('cdp')) return `Borrow $10 against the position on ${name} once, then repay it the same week.`;
  if (c.includes('perpetual') || c.includes('derivative')) return `Close and reopen a small position on ${name} once a week.`;
  if (c.includes('prediction')) return `Place one more small market position on ${name} each week.`;
  return `Use ${name} on ${chain} once a week — a swap, a deposit or a vote, whichever its app offers.`;
}

/**
 * A protocol's farm plan: seven steps, each an action with a cost and a time. The plan is derived from
 * the protocol's own record (category, chains, TVL, age), never from a hand-written list of names.
 */
export function farmSteps(p: SnapshotProtocol, age: number | null): FarmStep[] {
  const chain = chainOf(p);
  const capital = capitalFor(p);
  const hold = holdDaysFor(age);
  const gas = p.chains.includes('Ethereum') ? 'about $5–$15 of gas on Ethereum' : 'about $1–$3 of gas';
  return [
    {
      text: `Use a fresh wallet that holds only the funds you plan to farm, and keep its seed phrase offline.`,
      cost: 'nothing to set up',
      time: '5 minutes',
    },
    {
      text: actionFor(p, capital, chain),
      cost: `$${capital} of capital and ${gas} for the first transaction`,
      time: '15 minutes to set up',
    },
    {
      text: secondActionFor(p, capital, chain),
      cost: 'about $2 of gas a week',
      time: '10 minutes a week',
    },
    {
      text: `Hold the position for at least ${hold} days so the activity is counted in more than one snapshot.`,
      cost: `the $${capital} stays in the position`,
      time: `${hold} days`,
    },
    {
      text: `Check the protocol's own points or rewards page weekly and note any task it lists; only ever claim from the link the protocol itself publishes.`,
      cost: 'no fee to check, and never pay to claim',
      time: '10 minutes a week',
    },
    {
      text: `Before you withdraw, verify the contract address on the chain's explorer and revoke any approval you no longer need.`,
      cost: 'about $1 of gas to revoke',
      time: '10 minutes',
    },
    {
      text: `Write the wallet, the dates and every transaction in a farm log so you can repeat the position or unwind it.`,
      cost: 'nothing but the log',
      time: '5 minutes',
    },
  ];
}

/** The live-token protocols, by market cap, for the dashboard's Live token view. */
export function liveRows(snapshot: Snapshot): LiveRow[] {
  return snapshot.protocols
    .filter((p) => !isPreToken(p) && p.category !== 'CEX')
    .sort((a, b) => (b.mcap_usd ?? 0) - (a.mcap_usd ?? 0) || b.tvl_usd - a.tvl_usd)
    .slice(0, LIVE_ROWS)
    .map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      chains: p.chains,
      tvl_usd: p.tvl_usd,
      mcap_usd: p.mcap_usd,
      change_7d: p.change_7d,
    }));
}

/** How many protocols each exclusion rule set aside, for the transparency panel. */
export function excludedCounts(snapshot: Snapshot): ExcludedCounts {
  let live = 0;
  let cex = 0;
  let wrapped = 0;
  let versioned = 0;
  for (const p of snapshot.protocols) {
    if (!isPreToken(p)) live++;
    else if (p.category === 'CEX') cex++;
    else if (isWrappedProduct(p)) wrapped++;
    else if (VERSIONED.test(p.name)) versioned++;
  }
  return { live_token: live, cex, wrapped_staked_bridge: wrapped, versioned };
}

/** A board row's compact form for data.js. */
export function radarRow(row: BoardRow, watch: boolean): RadarRow {
  return {
    rank: row.rank,
    slug: row.slug,
    name: row.name,
    category: row.category,
    chains: row.chains,
    tvl_usd: row.tvl_usd,
    change_7d: row.change_7d,
    mcap_usd: row.mcap_usd,
    listed_at: row.listed_at,
    age_days: row.age_days,
    implied_value_usd: row.implied_value_usd,
    likelihood: row.likelihood,
    why: row.why,
    capital_usd: row.capital_usd,
    watch,
    category_multiple: row.model.category_multiple,
    growth_multiplier: row.model.growth_multiplier,
    maturity_multiplier: row.model.maturity_multiplier,
    chain_multiplier: row.model.chain_multiplier,
    farm_steps: row.farm_steps,
  };
}

/** Everything the dashboard renders, from the snapshot. */
export function buildRadar(snapshot: Snapshot, model: ModelConstants = MODEL): { board: BoardRow[]; radar: RadarData } {
  const board = buildBoard(snapshot, model);
  const live = liveRows(snapshot);
  const early = board.filter((r) => !snapshot.watchlist.includes(r.slug)).length;
  const radar: RadarData = {
    as_of: snapshot.as_of,
    source: snapshot.source,
    floor_usd: snapshot.floor_usd,
    model,
    model_version: MODEL_VERSION,
    watchlist_size: snapshot.watchlist.length,
    board_size: board.length,
    early_size: early,
    live_size: live.length,
    excluded: excludedCounts(snapshot),
    rows: board.map((r) => radarRow(r, snapshot.watchlist.includes(r.slug))),
    live,
  };
  return { board, radar };
}

/** The snapshot out of a file's text, refused unless it is the shape the model scores. */
export function parseSnapshot(text: string): Snapshot {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SnapshotError('snapshot.json is not JSON');
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) throw new SnapshotError('snapshot.json is not a JSON object');
  const o = raw as Record<string, unknown>;
  if (typeof o.as_of !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(o.as_of)) throw new SnapshotError('snapshot.json has no as_of date');
  if (typeof o.source !== 'string') throw new SnapshotError('snapshot.json has no source');
  if (typeof o.floor_usd !== 'number' || !Number.isSafeInteger(o.floor_usd) || o.floor_usd <= 0) throw new SnapshotError('snapshot.json has no floor_usd');
  if (!Array.isArray(o.protocols)) throw new SnapshotError('snapshot.json has no protocols array');
  if (!Array.isArray(o.watchlist) || o.watchlist.some((s) => typeof s !== 'string')) throw new SnapshotError('snapshot.json has no watchlist of slugs');
  const protocols = o.protocols.map((v, i) => {
    if (typeof v !== 'object' || v === null || Array.isArray(v)) throw new SnapshotError(`snapshot.json's protocol ${i} is not an object`);
    const p = v as Record<string, unknown>;
    if (typeof p.slug !== 'string' || typeof p.name !== 'string' || typeof p.tvl_usd !== 'number' || !Number.isFinite(p.tvl_usd)) {
      throw new SnapshotError(`snapshot.json's protocol ${i} lacks a slug, a name or a TVL`);
    }
    return {
      slug: p.slug,
      name: p.name,
      category: typeof p.category === 'string' ? p.category : null,
      chains: Array.isArray(p.chains) ? p.chains.filter((c): c is string => typeof c === 'string') : [],
      tvl_usd: p.tvl_usd,
      change_7d: typeof p.change_7d === 'number' && Number.isFinite(p.change_7d) ? p.change_7d : null,
      mcap_usd: typeof p.mcap_usd === 'number' ? p.mcap_usd : null,
      listed_at: typeof p.listed_at === 'string' ? p.listed_at : null,
      gecko_id: typeof p.gecko_id === 'string' ? p.gecko_id : null,
      symbol: typeof p.symbol === 'string' ? p.symbol : null,
    };
  });
  return {
    as_of: o.as_of,
    source: o.source,
    floor_usd: o.floor_usd,
    protocols,
    watchlist: o.watchlist as string[],
  };
}

/** Why a board is not one the gate will take, or null: coverage, ranks, order, one shared implied value, and farm steps. */
export function boardIssue(board: BoardRow[], snapshot: Snapshot): string | null {
  const slugs = new Set(board.map((r) => r.slug));
  const missing = snapshot.watchlist.filter((s) => !slugs.has(s));
  if (missing.length > 0) return `the board misses ${missing.length} watchlist slug${missing.length === 1 ? '' : 's'}: ${missing.slice(0, 5).join(', ')}`;
  const ranks = board.map((r) => r.rank).sort((a, b) => a - b);
  for (let i = 0; i < ranks.length; i++) if (ranks[i] !== i + 1) return `rank ${i + 1} is ${ranks[i]}`;
  for (let i = 1; i < board.length; i++) if (board[i]!.implied_value_usd > board[i - 1]!.implied_value_usd) return `row ${i + 1} outranks row ${i} on implied value`;
  if (board.length >= 2 && board[0]!.implied_value_usd === board[board.length - 1]!.implied_value_usd) {
    return `all ${board.length} rows share the same implied value $${board[0]!.implied_value_usd}: a board that ranks nothing by value is not a ranking`;
  }
  for (const r of board) {
    const steps = r.farm_steps;
    if (steps.length < 3 || steps.length > 12) return `${r.slug} has ${steps.length} farm steps`;
    for (const s of steps) if (s.length < 20 || s.length > 600) return `${r.slug} has a farm step of ${s.length} characters`;
    if (!Number.isSafeInteger(r.implied_value_usd) || r.implied_value_usd <= 0) return `${r.slug} has implied value ${r.implied_value_usd}`;
  }
  return null;
}

/** A compact data.js: the dashboard's whole dataset as one script, no fetch and no network. */
export function dataScript(radar: RadarData): string {
  return `window.RADAR=${JSON.stringify(radar)};\n`;
}
