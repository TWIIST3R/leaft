/** Aggregate salary figures from HasData Indeed / Glassdoor listing payloads (shape varies). */

const INDEED_URL = "https://api.hasdata.com/scrape/indeed/listing";
const GLASSDOOR_URL = "https://api.hasdata.com/scrape/glassdoor/listing";

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function collectArrays(obj: unknown, depth = 0): unknown[][] {
  if (depth > 12) return [];
  if (Array.isArray(obj)) return [obj];
  const rec = asRecord(obj);
  if (!rec) return [];
  const out: unknown[][] = [];
  for (const v of Object.values(rec)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") out.push(v);
    else out.push(...collectArrays(v, depth + 1));
  }
  return out;
}

function pickBestJobArray(root: unknown): unknown[] {
  const arrs = collectArrays(root);
  let best: unknown[] = [];
  let bestScore = -1;
  for (const a of arrs) {
    const score = a.filter((j) => extractAnnualFromJob(j) != null).length;
    if (score > bestScore || (score === bestScore && a.length > best.length)) {
      bestScore = score;
      best = a;
    }
  }
  return best;
}

function parseMoneyString(raw: string): { min: number | null; max: number | null; annualized: number | null } {
  const s = raw.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  const lower = s.toLowerCase();
  let mult = 1;
  if (/\bpar\s*heure|\/\s*h\b|\bheure\b|\bh\b|\bper\s*hour\b/i.test(lower)) mult = 1820;
  else if (/\bpar\s*mois|\/\s*mois|\bmonth\b|\bmois\b/i.test(lower)) mult = 12;

  const nums = [...s.matchAll(/(\d[\d\s]*)/g)]
    .map((m) => Number(m[1].replace(/\s/g, "")))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (nums.length === 0) return { min: null, max: null, annualized: null };
  const scaled = nums.map((n) => (n < 1000 && mult > 1 ? n * mult : n));
  const min = Math.min(...scaled);
  const max = Math.max(...scaled);
  const annualized = max >= min ? (min + max) / 2 : min;
  return { min, max, annualized };
}

function annualizePair(min: number, max: number): number {
  return (Math.min(min, max) + Math.max(min, max)) / 2;
}

function extractAnnualFromJob(job: unknown): number | null {
  const o = asRecord(job);
  if (!o) return null;

  const candidates: unknown[] = [
    o.estimatedSalary,
    o.salary,
    o.compensation,
    o.pay,
    o.salaryText,
    o.salary_text,
    o.salaryDescription,
  ];

  const nums: number[] = [];

  const pushNum = (v: unknown) => {
    if (typeof v === "number" && Number.isFinite(v) && v >= 8_000 && v <= 2_000_000) nums.push(v);
  };

  for (const key of ["salaryMin", "salary_max", "salaryMax", "minSalary", "maxSalary", "salaryFrom", "salaryTo"]) {
    pushNum(o[key]);
  }

  if (typeof o.salaryMin === "number" && typeof o.salaryMax === "number") {
    return annualizePair(o.salaryMin, o.salaryMax);
  }

  const nested = asRecord(o.salary);
  if (nested) {
    pushNum(nested.min);
    pushNum(nested.max);
    if (typeof nested.min === "number" && typeof nested.max === "number") {
      return annualizePair(nested.min, nested.max);
    }
  }

  for (const c of candidates) {
    if (typeof c === "string" && c.length > 2) {
      const { annualized } = parseMoneyString(c);
      if (annualized != null && annualized >= 8_000 && annualized <= 2_000_000) return annualized;
    }
    pushNum(c);
  }

  if (nums.length >= 2) return annualizePair(nums[0], nums[1]);
  if (nums.length === 1) return nums[0];

  return null;
}

export function extractAnnualSalariesFromPayload(payload: unknown): number[] {
  const jobs = pickBestJobArray(payload);
  const values: number[] = [];
  for (const j of jobs) {
    const a = extractAnnualFromJob(j);
    if (a != null) values.push(a);
  }
  return values;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo]! * (hi - idx) + sorted[hi]! * (idx - lo);
}

export function computePercentiles(values: number[]): { p25: number | null; p50: number | null; p75: number | null } {
  const sorted = [...values].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (sorted.length === 0) return { p25: null, p50: null, p75: null };
  return {
    p25: percentile(sorted, 0.25),
    p50: percentile(sorted, 0.5),
    p75: percentile(sorted, 0.75),
  };
}

export async function fetchIndeedListing(params: {
  apiKey: string;
  keyword: string;
  location: string;
}): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const url = new URL(INDEED_URL);
  url.searchParams.set("keyword", params.keyword);
  url.searchParams.set("location", params.location);
  url.searchParams.set("sort", "date");
  url.searchParams.set("domain", "fr.indeed.com");

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
    },
  });
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, payload };
}

export async function fetchGlassdoorListing(params: {
  apiKey: string;
  keyword: string;
  location: string;
}): Promise<{ ok: boolean; status: number; payload: unknown }> {
  const url = new URL(GLASSDOOR_URL);
  url.searchParams.set("keyword", params.keyword);
  url.searchParams.set("location", params.location);
  url.searchParams.set("sort", "recent");
  url.searchParams.set("domain", "www.glassdoor.fr");

  const res = await fetch(url.toString(), {
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
    },
  });
  const text = await res.text();
  let payload: unknown = null;
  try {
    payload = JSON.parse(text) as unknown;
  } catch {
    payload = { raw: text.slice(0, 500) };
  }
  return { ok: res.ok, status: res.status, payload };
}

export function mergeMarketStats(
  indeedVals: number[],
  glassdoorVals: number[],
): { p25: number | null; p50: number | null; p75: number | null; n: number } {
  const all = [...indeedVals, ...glassdoorVals];
  const { p25, p50, p75 } = computePercentiles(all);
  return { p25, p50, p75, n: all.length };
}
