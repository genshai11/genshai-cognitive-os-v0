import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CognitiveBlueprint {
  worldview: { core_axioms: string[]; ontology: string; epistemology: string };
  diagnostic_pattern: { perceptual_filters: string[]; signature_questions: string[]; red_flags: string[] };
  reasoning_chain: { method: string; steps: string[]; heuristics: string[] };
  emotional_stance: { archetype: string; relationship_to_user: string; tone_markers: string[] };
  anti_patterns: string[];
  language_dna: { metaphor_domains: string[]; signature_phrases: string[]; vocabulary_level: string; sentence_rhythm: string };
}

function compileSoulMd(bp: CognitiveBlueprint, name: string): string {
  const l: string[] = [`# ${name}'s Soul\n`];
  if (bp.worldview?.core_axioms?.length) {
    l.push('## Core Axioms\n');
    bp.worldview.core_axioms.forEach(a => l.push(`- ${a}`));
    l.push('');
  }
  if (bp.worldview?.ontology) l.push(`## Worldview\n\n**How I see reality:** ${bp.worldview.ontology}\n`);
  if (bp.worldview?.epistemology) l.push(`**How I discover truth:** ${bp.worldview.epistemology}\n`);
  if (bp.emotional_stance) {
    l.push('## How I Relate\n');
    if (bp.emotional_stance.archetype) l.push(`**Archetype:** ${bp.emotional_stance.archetype}`);
    if (bp.emotional_stance.relationship_to_user) l.push(`**My role:** ${bp.emotional_stance.relationship_to_user}`);
    if (bp.emotional_stance.tone_markers?.length) l.push(`**Tone:** ${bp.emotional_stance.tone_markers.join(', ')}`);
    l.push('');
  }
  if (bp.anti_patterns?.length) {
    l.push('## What I Never Do\n');
    bp.anti_patterns.forEach(a => l.push(`- ${a}`));
    l.push('');
  }
  return l.join('\n');
}

function compileAgentsMd(bp: CognitiveBlueprint, name: string, type: string): string {
  const l: string[] = [`# ${name}\n\n> ${type} advisor — powered by GENSHAI cognitive blueprint\n`];
  if (bp.reasoning_chain) {
    l.push('## How I Think\n');
    if (bp.reasoning_chain.method) l.push(`**Method:** ${bp.reasoning_chain.method}\n`);
    if (bp.reasoning_chain.steps?.length) {
      l.push('**Steps:**');
      bp.reasoning_chain.steps.forEach((s, i) => l.push(`${i + 1}. ${s}`));
      l.push('');
    }
    if (bp.reasoning_chain.heuristics?.length) {
      l.push('**Rules of thumb:**');
      bp.reasoning_chain.heuristics.forEach(h => l.push(`- ${h}`));
      l.push('');
    }
  }
  if (bp.diagnostic_pattern) {
    l.push('## What I Notice First\n');
    bp.diagnostic_pattern.perceptual_filters?.forEach(f => l.push(`- ${f}`));
    l.push('');
    if (bp.diagnostic_pattern.red_flags?.length) {
      l.push('**Warning signs:**');
      bp.diagnostic_pattern.red_flags.forEach(r => l.push(`- ${r}`));
      l.push('');
    }
    if (bp.diagnostic_pattern.signature_questions?.length) {
      l.push('## My Diagnostic Questions\n');
      bp.diagnostic_pattern.signature_questions.forEach(q => l.push(`- "${q}"`));
      l.push('');
    }
  }
  if (bp.language_dna) {
    l.push('## Communication Style\n');
    if (bp.language_dna.vocabulary_level) l.push(`**Vocabulary:** ${bp.language_dna.vocabulary_level}`);
    if (bp.language_dna.sentence_rhythm) l.push(`**Rhythm:** ${bp.language_dna.sentence_rhythm}`);
    if (bp.language_dna.metaphor_domains?.length) l.push(`**Metaphors:** ${bp.language_dna.metaphor_domains.join(', ')}`);
    if (bp.language_dna.signature_phrases?.length) {
      l.push('\n**Signature phrases:**');
      bp.language_dna.signature_phrases.forEach(p => l.push(`- "${p}"`));
    }
    l.push('');
  }
  l.push(`## Instructions\n\nYou are ${name}. Think FROM your perspective, not about it.\nFollow the cognitive blueprint above. Never break character.\n`);
  return l.join('\n');
}

function compileSkillMd(skill: any): any {
  const l: string[] = [];
  l.push(`---\nname: ${skill.skill_id}\ndescription: ${skill.description}\n---\n`);
  l.push(`# ${skill.skill_name}\n\n${skill.description}\n`);
  if (skill.use_cases?.length) {
    l.push('## Use Cases\n');
    skill.use_cases.forEach((u: string) => l.push(`- ${u}`));
    l.push('');
  }
  if (skill.input_schema) l.push(`## Input\n\n\`\`\`json\n${JSON.stringify(skill.input_schema, null, 2)}\n\`\`\`\n`);
  if (skill.output_schema) l.push(`## Output\n\n\`\`\`json\n${JSON.stringify(skill.output_schema, null, 2)}\n\`\`\`\n`);
  if (skill.code) l.push(`## Implementation\n\n\`\`\`${skill.language || 'javascript'}\n${skill.code}\n\`\`\`\n`);
  return { name: skill.skill_id, description: skill.description, content: l.join('\n'), category: skill.category };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { advisorId, advisorType } = await req.json();

    if (!advisorId || !advisorType) {
      return new Response(
        JSON.stringify({ error: "Missing advisorId or advisorType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch advisor
    const tableMap: Record<string, string> = {
      persona: "custom_personas",
      framework: "custom_frameworks",
      book: "custom_books",
    };
    const table = tableMap[advisorType];
    if (!table) {
      return new Response(
        JSON.stringify({ error: `Unknown advisor type: ${advisorType}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: advisor, error: advisorError } = await supabase
      .from(table)
      .select("*")
      .eq("id", advisorId)
      .single();

    if (advisorError || !advisor) {
      return new Response(
        JSON.stringify({ error: `Advisor not found: ${advisorId}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const name = advisor.name || advisor.title || "Advisor";
    const blueprint = advisor.cognitive_blueprint as CognitiveBlueprint | null;

    if (!blueprint) {
      return new Response(
        JSON.stringify({
          soulMd: `# ${name}\n\nNo cognitive blueprint available.\n`,
          agentsMd: `# ${name}\n\nNo cognitive blueprint available.\n`,
          skillMds: [],
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch approved skills for this advisor
    const { data: skills } = await supabase
      .from("advisor_skills")
      .select("*")
      .eq("advisor_id", advisorId)
      .eq("status", "approved");

    const soulMd = compileSoulMd(blueprint, name);
    const agentsMd = compileAgentsMd(blueprint, name, advisorType);
    const skillMds = (skills || []).map(compileSkillMd);

    console.log(`export-openclaw | ${advisorType}=${advisorId} name=${name} skills=${skillMds.length}`);

    return new Response(
      JSON.stringify({ soulMd, agentsMd, skillMds }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("export-openclaw error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
