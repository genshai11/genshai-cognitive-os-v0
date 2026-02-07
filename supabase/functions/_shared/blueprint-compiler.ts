/**
 * Cognitive Blueprint Compiler
 *
 * Converts a structured cognitive_blueprint JSON into a system prompt
 * that makes the LLM THINK like the advisor, not just TALK about them.
 */

export interface CognitiveBlueprint {
  worldview: {
    core_axioms: string[];
    ontology: string;
    epistemology: string;
  };
  diagnostic_pattern: {
    perceptual_filters: string[];
    signature_questions: string[];
    red_flags: string[];
  };
  reasoning_chain: {
    method: string;
    steps: string[];
    heuristics: string[];
  };
  emotional_stance: {
    archetype: string;
    relationship_to_user: string;
    tone_markers: string[];
  };
  anti_patterns: string[];
  language_dna: {
    metaphor_domains: string[];
    signature_phrases: string[];
    vocabulary_level: string;
    sentence_rhythm: string;
  };
}

export function compileCognitiveBlueprint(
  blueprint: CognitiveBlueprint,
  advisorName?: string,
  advisorType?: "persona" | "framework" | "book"
): string {
  const sections: string[] = [];

  // Section 1: Identity & Worldview
  if (blueprint.worldview) {
    const w = blueprint.worldview;
    if (advisorName) {
      sections.push(`## WHO YOU ARE\nYou are ${advisorName}. ${w.ontology}`);
    } else {
      sections.push(`## YOUR WORLDVIEW\n${w.ontology}`);
    }

    if (w.epistemology) {
      sections.push(`How you find truth: ${w.epistemology}`);
    }

    if (w.core_axioms?.length) {
      sections.push(
        `## YOUR CORE BELIEFS\n${w.core_axioms.map((a, i) => `${i + 1}. ${a}`).join("\n")}`
      );
    }
  }

  // Section 2: How You Think (The Brain)
  if (blueprint.diagnostic_pattern || blueprint.reasoning_chain) {
    const parts: string[] = ["## HOW YOU THINK"];
    parts.push("When someone brings you a problem, this is your natural thinking process:\n");

    if (blueprint.diagnostic_pattern?.perceptual_filters?.length) {
      parts.push(
        `**FIRST — What you notice:**\n${blueprint.diagnostic_pattern.perceptual_filters.map((f) => `- ${f}`).join("\n")}`
      );
    }

    if (blueprint.diagnostic_pattern?.signature_questions?.length) {
      parts.push(
        `\n**THEN — Questions you instinctively ask:**\n${blueprint.diagnostic_pattern.signature_questions.map((q) => `- "${q}"`).join("\n")}`
      );
    }

    if (blueprint.reasoning_chain) {
      const r = blueprint.reasoning_chain;
      if (r.method) {
        parts.push(`\n**YOUR REASONING METHOD: ${r.method}**`);
      }
      if (r.steps?.length) {
        parts.push(
          r.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")
        );
      }
      if (r.heuristics?.length) {
        parts.push(
          `\n**Rules of thumb you live by:**\n${r.heuristics.map((h) => `- ${h}`).join("\n")}`
        );
      }
    }

    sections.push(parts.join("\n"));
  }

  // Section 3: How You Communicate
  if (blueprint.emotional_stance || blueprint.language_dna) {
    const parts: string[] = ["## HOW YOU COMMUNICATE"];

    if (blueprint.emotional_stance) {
      const e = blueprint.emotional_stance;
      if (e.archetype) {
        const archetypeLabels: Record<string, string> = {
          tough_love: "Direct and unflinching — you push people because you care",
          warm_wisdom: "Gentle and nurturing — you create safety before challenging",
          provocative_challenge: "You provoke and unsettle — comfort is the enemy of growth",
          calm_analysis: "Measured and steady — you bring clarity through calm reasoning",
          energetic_motivation: "High energy and inspiring — you ignite action and momentum",
        };
        parts.push(`Emotional stance: ${archetypeLabels[e.archetype] || e.archetype}`);
      }
      if (e.relationship_to_user) {
        parts.push(`Your relationship to the person you're speaking with: ${e.relationship_to_user}`);
      }
      if (e.tone_markers?.length) {
        parts.push(`Your tone: ${e.tone_markers.join(", ")}`);
      }
    }

    if (blueprint.language_dna) {
      const l = blueprint.language_dna;
      if (l.metaphor_domains?.length) {
        parts.push(`You naturally draw metaphors from: ${l.metaphor_domains.join(", ")}`);
      }
      if (l.signature_phrases?.length) {
        parts.push(
          `Phrases that capture how you think:\n${l.signature_phrases.map((p) => `- "${p}"`).join("\n")}`
        );
      }
      if (l.vocabulary_level) {
        const vocabLabels: Record<string, string> = {
          simple: "Use simple, everyday language. No jargon.",
          accessible: "Keep language clear and accessible. Explain any technical terms.",
          technical: "Use precise, technical language when it adds clarity.",
          academic: "Use sophisticated, academic vocabulary naturally.",
        };
        parts.push(vocabLabels[l.vocabulary_level] || "");
      }
      if (l.sentence_rhythm) {
        const rhythmLabels: Record<string, string> = {
          short_punchy: "Keep sentences short and punchy. Hit hard. Move on.",
          flowing_narrative: "Let your sentences flow naturally, building ideas across longer passages.",
          questioning: "Weave questions throughout your responses. Let the user discover answers.",
          structured: "Organize your thoughts with clear structure — numbered steps, clear sections.",
        };
        parts.push(rhythmLabels[l.sentence_rhythm] || "");
      }
    }

    sections.push(parts.join("\n"));
  }

  // Section 4: Boundaries
  if (blueprint.anti_patterns?.length) {
    sections.push(
      `## WHAT YOU NEVER DO\n${blueprint.anti_patterns.map((a) => `- ${a}`).join("\n")}`
    );
  }

  if (blueprint.diagnostic_pattern?.red_flags?.length) {
    sections.push(
      `## RED FLAGS YOU WATCH FOR\n${blueprint.diagnostic_pattern.red_flags.map((r) => `- ${r}`).join("\n")}`
    );
  }

  // Section 5: Core Directive
  const typeLabel =
    advisorType === "book" ? "this book's philosophy" :
    advisorType === "framework" ? "this framework" :
    "your philosophy";

  sections.push(
    `## CRITICAL INSTRUCTION
You don't describe ${typeLabel} — you THINK through it.
When the user presents a problem, naturally apply your perceptual filters, ask your diagnostic questions when needed, and reason through your method.
Never say "As a [philosophy], I would..." or "According to [framework]..." — just think and respond that way naturally.
Speak in first person. Be the advisor, don't play one.`
  );

  return sections.join("\n\n");
}

/**
 * Returns a compiled system prompt from blueprint if available,
 * otherwise falls back to the raw system_prompt string.
 */
export function getSystemPrompt(
  systemPrompt: string,
  cognitiveBlueprint: CognitiveBlueprint | null | undefined,
  advisorName?: string,
  advisorType?: "persona" | "framework" | "book"
): string {
  if (cognitiveBlueprint && typeof cognitiveBlueprint === "object" && cognitiveBlueprint.worldview) {
    return compileCognitiveBlueprint(cognitiveBlueprint, advisorName, advisorType);
  }
  return systemPrompt;
}
