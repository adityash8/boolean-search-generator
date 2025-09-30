"use client";

import { useMemo, useState } from "react";
import { Copy, Link as LinkIcon, Sparkles, Play, ChevronDown, Zap } from "lucide-react";
import { buildBoolean } from "@/lib/boolean";

type Platform = "LinkedIn" | "GitHub" | "Google X-Ray" | "Generic";

export default function Page() {
  const [role, setRole] = useState("");
  const [skills, setSkills] = useState("");
  const [exclude, setExclude] = useState("");
  const [location, setLocation] = useState("");
  const [platform, setPlatform] = useState<Platform>("LinkedIn");
  const [loading, setLoading] = useState(false);
  const [booleanStr, setBooleanStr] = useState("");
  const [explanation, setExplanation] = useState("");
  const [showExplain, setShowExplain] = useState(false);
  const [aiBoost, setAiBoost] = useState(false);

  const disabled = useMemo(() => loading || !role.trim(), [loading, role]);

  async function onGenerate() {
    setLoading(true);
    setShowExplain(false);
    setBooleanStr("");
    setExplanation("");

    try {
      if (aiBoost) {
        // Use Claude API for enhanced generation
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, skills, exclude, location, platform }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setBooleanStr(data.boolean ?? "");
        setExplanation(data.explanation ?? "");
      } else {
        // Use local generation (instant, no API cost)
        const result = buildBoolean({ role, skills, exclude, location, platform });
        setBooleanStr(result.boolean);
        setExplanation(result.explanation);
      }
    } catch (e: any) {
      setBooleanStr("");
      setExplanation("");
      alert(`Error: ${e.message ?? e}`);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  const peopleGptPrompt = useMemo(() => {
    // Build a helpful PeopleGPT prompt from inputs
    const sk = skills ? `Must-have skills: ${skills}.` : "";
    const ex = exclude ? `Exclude: ${exclude}.` : "";
    const loc = location ? `Location: ${location}.` : "";
    return `Source top ${role} candidates. ${sk} ${ex} ${loc} Return 25 high-signal profiles with emails if available.`;
  }, [role, skills, exclude, location]);

  const peopleGptLink = useMemo(() => {
    const encoded = encodeURIComponent(peopleGptPrompt);
    // adjust this to your real deep link
    return `https://app.juicebox.ai/peoplegpt?prompt=${encoded}`;
  }, [peopleGptPrompt]);

  return (
    <main className="min-h-screen">
      {/* Header */}
      <section className="border-b border-jbGray/60">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <div className="inline-flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-jbGreen inline-block" />
            <span className="uppercase tracking-widest text-xs text-neutral-500">Juicebox Labs</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">
            Boolean Builder <span className="underline decoration-jbBlue decoration-4 underline-offset-4">Pro</span>
          </h1>
          <p className="mt-2 text-neutral-600">
            From Boolean to AI sourcing — instantly. Minimal inputs, platform-aware output, one-click into PeopleGPT.
          </p>
        </div>
      </section>

      {/* Form */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Role / Title" placeholder="e.g., Software Engineer" value={role} onChange={setRole} />
            <Field label="Location (optional)" placeholder="e.g., New York OR NYC" value={location} onChange={setLocation} />
            <Field label="Required Skills (comma-sep)" placeholder="e.g., TypeScript, React, GraphQL" value={skills} onChange={setSkills} />
            <Field label="Exclude Terms (optional)" placeholder="e.g., intern, junior, bootcamp" value={exclude} onChange={setExclude} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <PlatformTab current={platform} setCurrent={setPlatform} label="LinkedIn" />
            <PlatformTab current={platform} setCurrent={setPlatform} label="GitHub" />
            <PlatformTab current={platform} setCurrent={setPlatform} label="Google X-Ray" />
            <PlatformTab current={platform} setCurrent={setPlatform} label="Generic" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onGenerate}
                disabled={disabled}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-900 text-white px-4 py-2 shadow-soft hover:opacity-95 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4 text-jbGreen" />
                {loading ? "Generating…" : "Generate Boolean"}
              </button>
              <a
                href={peopleGptLink}
                target="_blank"
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 shadow-soft hover:bg-neutral-50"
              >
                <Play className="h-4 w-4 text-jbBlue" />
                Open in PeopleGPT
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <Zap className={`h-4 w-4 ${aiBoost ? "text-jbBlue" : "text-neutral-400"}`} />
              <span className="text-sm text-neutral-600">AI Boost</span>
              <button
                onClick={() => setAiBoost(!aiBoost)}
                className={`relative inline-flex h-6 w-11 rounded-full transition ${
                  aiBoost ? "bg-jbBlue" : "bg-neutral-200"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    aiBoost ? "translate-x-6" : "translate-x-1"
                  } mt-1`}
                />
              </button>
            </div>
          </div>

          {/* Output */}
          {!!booleanStr && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Boolean String</h3>
                <button onClick={() => copy(booleanStr)} className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
                  <Copy className="h-4 w-4" /> Copy
                </button>
              </div>
              <pre className="codewrap">{booleanStr}</pre>

              <button
                onClick={() => setShowExplain((s) => !s)}
                className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
              >
                <ChevronDown className={`h-4 w-4 transition ${showExplain ? "rotate-180" : ""}`} />
                {showExplain ? "Hide explanation" : "Explain this Boolean"}
              </button>

              {showExplain && (
                <div className="rounded-xl border border-neutral-200 p-4 text-sm">
                  <div className="prose prose-sm max-w-none">
                    {explanation || "No explanation provided."}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer link */}
          <div className="pt-8 border-t border-neutral-200 flex items-center gap-2 text-sm text-neutral-500">
            <LinkIcon className="h-4 w-4" />
            Try: LinkedIn → GitHub → Google X-Ray tabs to auto-adjust syntax.
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm text-neutral-600">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-jbBlue"
      />
    </label>
  );
}

function PlatformTab({
  current,
  setCurrent,
  label,
}: {
  current: Platform;
  setCurrent: (p: Platform) => void;
  label: Platform;
}) {
  const active = current === label;
  return (
    <button
      onClick={() => setCurrent(label)}
      className={`rounded-full px-3 py-1.5 text-sm border ${
        active
          ? "border-neutral-900 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white hover:bg-neutral-50"
      }`}
    >
      {label}
    </button>
  );
}