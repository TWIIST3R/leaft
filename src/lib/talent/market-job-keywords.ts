/**
 * Variantes d’intitulés pour élargir la recherche d’offres (Indeed / Glassdoor).
 * OpenAI si OPENAI_API_KEY est défini, sinon heuristiques FR.
 */

const MAX_KEYWORDS = 6;

function uniqueKeywords(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const k = raw.trim().replace(/\s+/g, " ").slice(0, 80);
    if (!k || k.length < 2) continue;
    const key = k.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= MAX_KEYWORDS) break;
  }
  return out;
}

/** Retire suffixes trop spécifiques (SEA, PPC, H/F, etc.) pour élargir la recherche. */
function heuristicVariants(jobTitle: string): string[] {
  const base = jobTitle.trim();
  if (!base) return ["emploi"];

  const stripped = base
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/\s*[-–/]\s*(SEA|PPC|SEO|SEM|B2B|B2C|SaaS|IT|RH|H\/F|F\/H|CDI|CDD)\s*$/i, "")
    .replace(/\b(SEA|PPC|SEO|SEM)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const variants = [base];
  if (stripped && stripped !== base) variants.push(stripped);

  const lower = stripped.toLowerCase();
  if (/account\s*manager|charg[eé]\s*de\s*compte/i.test(lower)) {
    variants.push("Account Manager", "Chargé de compte", "Business Developer");
  } else if (/commercial|vente|sales/i.test(lower)) {
    variants.push("Commercial", "Business Developer", "Account Executive");
  } else if (/d[eé]veloppeur|developer|ing[eé]nieur/i.test(lower)) {
    variants.push("Développeur", "Ingénieur logiciel");
  } else if (/marketing|growth/i.test(lower)) {
    variants.push("Chef de projet marketing", "Responsable marketing");
  } else if (/rh|ressources humaines|talent/i.test(lower)) {
    variants.push("Responsable RH", "Chargé de recrutement");
  }

  const words = stripped.split(/\s+/).filter(Boolean);
  if (words.length > 3) {
    variants.push(words.slice(0, 3).join(" "));
  }

  return uniqueKeywords(variants);
}

async function aiVariants(jobTitle: string, apiKey: string): Promise<string[] | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "Tu es expert RH en France. Réponds UNIQUEMENT avec un tableau JSON de 4 à 6 chaînes : intitulés de poste français proches ou équivalents pour chercher des offres d'emploi (Indeed/Glassdoor). Pas de markdown, pas d'explication.",
        },
        {
          role: "user",
          content: `Intitulé du collaborateur : « ${jobTitle.slice(0, 120)} »`,
        },
      ],
    }),
  });

  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content?.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text) as unknown;
    if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
      return uniqueKeywords([jobTitle, ...parsed]);
    }
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          return uniqueKeywords([jobTitle, ...parsed]);
        }
      } catch {
        /* ignore */
      }
    }
  }
  return null;
}

export async function expandJobSearchKeywords(jobTitle: string): Promise<string[]> {
  const base = (jobTitle || "emploi").trim().slice(0, 120) || "emploi";
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (apiKey) {
    try {
      const fromAi = await aiVariants(base, apiKey);
      if (fromAi && fromAi.length > 0) return fromAi;
    } catch (e) {
      console.warn("[market-job-keywords] OpenAI", e);
    }
  }

  return heuristicVariants(base);
}
