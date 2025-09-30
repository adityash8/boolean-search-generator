import { NextRequest } from "next/server";

export const runtime = "edge";

export async function POST(req: NextRequest) {
  try {
    const { role, skills, exclude, location, platform } = await req.json();

    const sysPrompt = SYSTEM_PROMPT;
    const userPrompt = buildUserPrompt({ role, skills, exclude, location, platform });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing ANTHROPIC_API_KEY" }), { status: 500 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 800,
        system: sysPrompt,
        messages: [
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: txt }), { status: 500 });
    }

    const data = await res.json();
    // Expect a single JSON code block in the response
    const content = (data?.content?.[0]?.text ?? "").trim();

    // try to parse; if plain text boolean, wrap
    let out = { boolean: "", explanation: "", promptVersion: "" };
    try {
      // Try to extract JSON from code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      out = JSON.parse(jsonStr);
    } catch {
      // If parsing fails, treat as plain text
      out.boolean = content;
      out.explanation = "Generated boolean string.";
      out.promptVersion = "v1";
    }

    return new Response(JSON.stringify(out), { status: 200, headers: { "content-type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Unknown error" }), { status: 500 });
  }
}

const SYSTEM_PROMPT = `
You are "Juicebox Boolean Builder Pro", an expert technical sourcer.
Return clean JSON only, no extra prose.

Rules:
- Build precise Boolean search strings tailored to the selected platform.
- Prefer recall without sacrificing precision; avoid over-nesting.
- Use OR for synonyms/aliases, AND for must-haves, NOT for exclusions.
- Location handling:
  - If provided, include common variants (e.g., "NYC" OR "New York").
- Platform syntax:
  - LinkedIn (site:linkedin.com/in OR /pub, title: if useful, company if inferred).
  - GitHub (site:github.com, in:bio OR in:readme, language: where relevant).
  - Google X-Ray (site filters and operators appropriate to people pages).
  - Generic: plain Boolean for internal ATS/CRM fields.
- Avoid quotes unless needed; group OR blocks in parentheses.
- Expand common role synonyms (e.g., "Software Engineer" ~ (developer OR "software engineer" OR "SWE")).
- Exclude junior/intern if hinted by seniority.
- Always produce a short, clear explanation of each main clause.

Output JSON schema:
{
  "boolean": "STRING",
  "explanation": "WHY each block exists (1-5 bullets)",
  "promptVersion": "peoplegpt-v1"
}
`.trim();

function buildUserPrompt({
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
  platform: string;
}) {
  return `
Build a Boolean string and short explanation.

Inputs:
- Role: ${role}
- Required skills (comma-separated): ${skills || "(none)"}
- Exclude terms: ${exclude || "(none)"}
- Location: ${location || "(none)"}
- Platform: ${platform}

Return the JSON object only.`;
}