type Platform = "LinkedIn" | "GitHub" | "Google X-Ray" | "Generic";

const STOP_EXCLUSIONS = ["intern", "junior", "bootcamp", "entry", "trainee"];

const ROLE_SYNONYMS: Record<string, string[]> = {
  "software engineer": ["\"software engineer\"", "developer", "programmer", "SWE", "\"software developer\"", "engineer"],
  "data scientist": ["\"data scientist\"", "\"machine learning\"", "\"ml engineer\"", "\"ai scientist\"", "\"data analyst\""],
  "product manager": ["\"product manager\"", "PM", "\"product owner\"", "\"program manager\""],
  "designer": ["designer", "\"ux designer\"", "\"ui designer\"", "\"product designer\"", "\"visual designer\""],
  "marketing": ["marketing", "\"digital marketing\"", "\"growth marketing\"", "\"content marketing\""],
  "sales": ["sales", "\"account executive\"", "\"sales rep\"", "\"business development\"", "\"account manager\""],
  "engineer": ["engineer", "\"software engineer\"", "developer", "programmer", "SWE"],
  "developer": ["developer", "\"software developer\"", "\"web developer\"", "programmer", "engineer"],
  "analyst": ["analyst", "\"data analyst\"", "\"business analyst\"", "\"financial analyst\""],
};

const LOC_EQUIVS: Record<string, string[]> = {
  "nyc": ["NYC", "\"New York\"", "\"New York City\"", "Manhattan", "Brooklyn"],
  "new york": ["NYC", "\"New York\"", "\"New York City\"", "Manhattan"],
  "sf": ["SF", "\"San Francisco\"", "\"Bay Area\"", "\"Silicon Valley\""],
  "san francisco": ["SF", "\"San Francisco\"", "\"Bay Area\""],
  "la": ["LA", "\"Los Angeles\"", "\"Greater LA\""],
  "los angeles": ["LA", "\"Los Angeles\"", "\"Greater LA\""],
  "boston": ["Boston", "\"Greater Boston\"", "Cambridge", "Somerville"],
  "seattle": ["Seattle", "\"Greater Seattle\"", "Bellevue", "Redmond"],
  "chicago": ["Chicago", "\"Greater Chicago\"", "\"Chicagoland\""],
  "austin": ["Austin", "\"Greater Austin\"", "\"Austin TX\""],
  "denver": ["Denver", "\"Greater Denver\"", "Boulder"],
  "london": ["London", "\"Greater London\"", "UK"],
  "toronto": ["Toronto", "\"Greater Toronto\"", "Canada"],
  "remote": ["remote", "\"remote work\"", "\"work from home\"", "WFH"],
};

const SKILL_SYNONYMS: Record<string, string[]> = {
  "javascript": ["JavaScript", "JS", "Node.js", "NodeJS"],
  "typescript": ["TypeScript", "TS"],
  "python": ["Python", "py"],
  "react": ["React", "ReactJS", "React.js"],
  "node": ["Node.js", "NodeJS", "Node"],
  "aws": ["AWS", "\"Amazon Web Services\""],
  "kubernetes": ["Kubernetes", "k8s"],
  "docker": ["Docker", "containerization"],
  "sql": ["SQL", "PostgreSQL", "MySQL", "database"],
  "machine learning": ["\"machine learning\"", "ML", "\"artificial intelligence\"", "AI"],
};

function csvToTerms(s: string): string[] {
  return (s || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean)
    .slice(0, 20);
}

function norm(s: string) {
  return s.toLowerCase().trim();
}

function expandRole(role: string): string[] {
  const key = norm(role);
  const seeds = ROLE_SYNONYMS[key] || [];
  // Always include the raw role in quotes if not already covered
  const raw = role.includes("\"") ? role : `"${role}"`;
  return Array.from(new Set([raw, ...seeds]));
}

function expandSkills(skills: string[]): string[] {
  const expanded: string[] = [];
  for (const skill of skills) {
    const key = norm(skill);
    const synonyms = SKILL_SYNONYMS[key] || [];
    const raw = skill.includes("\"") ? skill : `"${skill}"`;
    expanded.push(...Array.from(new Set([raw, ...synonyms])));
  }
  return expanded;
}

function expandLocation(loc: string): string[] {
  if (!loc) return [];
  const key = norm(loc);
  // if user already provided an OR block, respect it
  if (loc.includes(" OR ") || loc.includes("|")) return [loc];
  const eq = LOC_EQUIVS[key] || [];
  return eq.length ? Array.from(new Set([loc, ...eq])) : [loc];
}

function orBlock(terms: string[]): string {
  if (terms.length === 0) return "";
  if (terms.length === 1) return terms[0];
  return "(" + terms.join(" OR ") + ")";
}

function notBlock(terms: string[]): string {
  if (!terms.length) return "";
  return terms.map(t => `NOT ${/[\s"]/.test(t) ? `"${t.replaceAll('"','\\"')}"` : t}`).join(" ");
}

export function buildBoolean({
  role,
  skills,
  exclude,
  location,
  platform,
}: {
  role: string;
  skills?: string;
  exclude?: string;
  location?: string;
  platform: Platform;
}) {
  // role expansion
  const roleTerms = expandRole(role);

  // skills expansion
  const skillInput = csvToTerms(skills || "");
  const skillTerms = expandSkills(skillInput);

  // exclude terms
  const exUser = csvToTerms(exclude || "");
  const ex = Array.from(new Set([...STOP_EXCLUSIONS, ...exUser]));

  // location expansion
  const locTerms = expandLocation(location || "");

  // core boolean parts
  const parts: string[] = [];
  if (roleTerms.length) parts.push(orBlock(roleTerms));
  if (skillTerms.length) parts.push(orBlock(skillTerms));
  if (locTerms.length) parts.push(orBlock(locTerms));
  if (ex.length) parts.push(notBlock(ex));

  let bool = parts.filter(Boolean).join(" AND ");

  // platform adapters
  if (platform === "LinkedIn") {
    const liSites = "(site:linkedin.com/in OR site:linkedin.com/pub)";
    bool = `${liSites} AND ${bool}`;
  } else if (platform === "GitHub") {
    const gh = "site:github.com (in:readme OR in:bio)";
    bool = `${gh}${bool ? " AND " + bool : ""}`;
  } else if (platform === "Google X-Ray") {
    // default to LI people pages as x-ray
    const xr = "(site:linkedin.com/in OR site:linkedin.com/pub)";
    bool = `${xr} AND ${bool}`;
  } // Generic = no prefix

  const explanation = [
    roleTerms.length && `Role synonyms: ${orBlock(roleTerms)}`,
    skillTerms.length && `Required skills: ${orBlock(skillTerms)}`,
    locTerms.length && `Location variants: ${orBlock(locTerms)}`,
    ex.length && `Exclusions: ${ex.join(", ")}`,
    `Platform mode: ${platform}`,
  ].filter(Boolean).join("\n• ");

  return { 
    boolean: bool, 
    explanation: `• ${explanation}`,
    promptVersion: "local-v1"
  };
}