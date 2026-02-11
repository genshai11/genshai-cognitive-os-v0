/**
 * Blueprint-to-OpenClaw Compiler
 *
 * Converts GENSHAI cognitive blueprints into OpenClaw-compatible
 * SOUL.md, AGENTS.md, and SKILL.md files.
 */

import type { BlueprintExport, OpenClawSkillMd } from "@/types/openclaw";
import type { SkillDefinition } from "@/types/skills";

// Re-define CognitiveBlueprint client-side (matches blueprint-compiler.ts on server)
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

/**
 * Generate SOUL.md — the advisor's identity and values
 */
export function compileSoulMd(blueprint: CognitiveBlueprint, advisorName: string): string {
  const lines: string[] = [];

  lines.push(`# ${advisorName}'s Soul`);
  lines.push('');

  // Core Axioms
  if (blueprint.worldview?.core_axioms?.length) {
    lines.push('## Core Axioms');
    lines.push('');
    for (const axiom of blueprint.worldview.core_axioms) {
      lines.push(`- ${axiom}`);
    }
    lines.push('');
  }

  // Worldview
  if (blueprint.worldview?.ontology || blueprint.worldview?.epistemology) {
    lines.push('## Worldview');
    lines.push('');
    if (blueprint.worldview.ontology) {
      lines.push(`**How I see reality:** ${blueprint.worldview.ontology}`);
      lines.push('');
    }
    if (blueprint.worldview.epistemology) {
      lines.push(`**How I discover truth:** ${blueprint.worldview.epistemology}`);
      lines.push('');
    }
  }

  // How I Relate
  if (blueprint.emotional_stance) {
    lines.push('## How I Relate');
    lines.push('');
    if (blueprint.emotional_stance.archetype) {
      lines.push(`**Archetype:** ${blueprint.emotional_stance.archetype}`);
    }
    if (blueprint.emotional_stance.relationship_to_user) {
      lines.push(`**My role:** ${blueprint.emotional_stance.relationship_to_user}`);
    }
    if (blueprint.emotional_stance.tone_markers?.length) {
      lines.push(`**Tone:** ${blueprint.emotional_stance.tone_markers.join(', ')}`);
    }
    lines.push('');
  }

  // What I Never Do
  if (blueprint.anti_patterns?.length) {
    lines.push('## What I Never Do');
    lines.push('');
    for (const anti of blueprint.anti_patterns) {
      lines.push(`- ${anti}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate AGENTS.md — how the advisor thinks and communicates
 */
export function compileAgentsMd(
  blueprint: CognitiveBlueprint,
  advisorName: string,
  advisorType: string
): string {
  const lines: string[] = [];

  lines.push(`# ${advisorName}`);
  lines.push('');
  lines.push(`> ${advisorType} advisor — powered by GENSHAI cognitive blueprint`);
  lines.push('');

  // How I Think
  if (blueprint.reasoning_chain) {
    lines.push('## How I Think');
    lines.push('');
    if (blueprint.reasoning_chain.method) {
      lines.push(`**Method:** ${blueprint.reasoning_chain.method}`);
      lines.push('');
    }
    if (blueprint.reasoning_chain.steps?.length) {
      lines.push('**Steps:**');
      for (let i = 0; i < blueprint.reasoning_chain.steps.length; i++) {
        lines.push(`${i + 1}. ${blueprint.reasoning_chain.steps[i]}`);
      }
      lines.push('');
    }
    if (blueprint.reasoning_chain.heuristics?.length) {
      lines.push('**Rules of thumb:**');
      for (const h of blueprint.reasoning_chain.heuristics) {
        lines.push(`- ${h}`);
      }
      lines.push('');
    }
  }

  // What I Notice First
  if (blueprint.diagnostic_pattern) {
    lines.push('## What I Notice First');
    lines.push('');
    if (blueprint.diagnostic_pattern.perceptual_filters?.length) {
      for (const f of blueprint.diagnostic_pattern.perceptual_filters) {
        lines.push(`- ${f}`);
      }
      lines.push('');
    }
    if (blueprint.diagnostic_pattern.red_flags?.length) {
      lines.push('**Warning signs I watch for:**');
      for (const r of blueprint.diagnostic_pattern.red_flags) {
        lines.push(`- ${r}`);
      }
      lines.push('');
    }
  }

  // My Diagnostic Questions
  if (blueprint.diagnostic_pattern?.signature_questions?.length) {
    lines.push('## My Diagnostic Questions');
    lines.push('');
    for (const q of blueprint.diagnostic_pattern.signature_questions) {
      lines.push(`- "${q}"`);
    }
    lines.push('');
  }

  // Communication Style
  if (blueprint.language_dna) {
    lines.push('## Communication Style');
    lines.push('');
    if (blueprint.language_dna.vocabulary_level) {
      lines.push(`**Vocabulary:** ${blueprint.language_dna.vocabulary_level}`);
    }
    if (blueprint.language_dna.sentence_rhythm) {
      lines.push(`**Rhythm:** ${blueprint.language_dna.sentence_rhythm}`);
    }
    if (blueprint.language_dna.metaphor_domains?.length) {
      lines.push(`**Metaphors drawn from:** ${blueprint.language_dna.metaphor_domains.join(', ')}`);
    }
    if (blueprint.language_dna.signature_phrases?.length) {
      lines.push('');
      lines.push('**Signature phrases:**');
      for (const p of blueprint.language_dna.signature_phrases) {
        lines.push(`- "${p}"`);
      }
    }
    lines.push('');
  }

  // Instructions for OpenClaw
  lines.push('## Instructions');
  lines.push('');
  lines.push(`You are ${advisorName}. Think FROM your perspective, not about it.`);
  lines.push('Follow the cognitive blueprint above. Never break character.');
  lines.push('When you have access to tools, use them proactively to help the user.');
  lines.push('');

  return lines.join('\n');
}

/**
 * Wrap an existing GENSHAI skill into OpenClaw SKILL.md format
 */
export function compileSkillMd(skill: SkillDefinition): OpenClawSkillMd {
  const lines: string[] = [];

  lines.push('---');
  lines.push(`name: ${skill.skillId}`);
  lines.push(`description: ${skill.description}`);
  lines.push('---');
  lines.push('');
  lines.push(`# ${skill.skillName}`);
  lines.push('');
  lines.push(skill.description);
  lines.push('');

  if (skill.useCases?.length) {
    lines.push('## Use Cases');
    lines.push('');
    for (const uc of skill.useCases) {
      lines.push(`- ${uc}`);
    }
    lines.push('');
  }

  // Input schema
  if (skill.inputSchema) {
    lines.push('## Input');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(skill.inputSchema, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Output schema
  if (skill.outputSchema) {
    lines.push('## Output');
    lines.push('');
    lines.push('```json');
    lines.push(JSON.stringify(skill.outputSchema, null, 2));
    lines.push('```');
    lines.push('');
  }

  // Code
  if (skill.code) {
    lines.push('## Implementation');
    lines.push('');
    lines.push(`\`\`\`${skill.language || 'javascript'}`);
    lines.push(skill.code);
    lines.push('```');
    lines.push('');
  }

  // Examples
  if (skill.examples?.length) {
    lines.push('## Examples');
    lines.push('');
    for (const ex of skill.examples) {
      lines.push(`### Example`);
      if (ex.input) {
        lines.push('**Input:**');
        lines.push('```json');
        lines.push(JSON.stringify(ex.input, null, 2));
        lines.push('```');
      }
      if (ex.output) {
        lines.push('**Expected Output:**');
        lines.push('```json');
        lines.push(JSON.stringify(ex.output, null, 2));
        lines.push('```');
      }
      lines.push('');
    }
  }

  return {
    name: skill.skillId,
    description: skill.description,
    content: lines.join('\n'),
    category: skill.category,
  };
}

/**
 * Main orchestrator: export a full advisor as OpenClaw-compatible files
 */
export function exportAdvisorAsOpenClaw(
  advisor: { name?: string; title?: string; cognitive_blueprint?: CognitiveBlueprint },
  advisorType: string,
  skills: SkillDefinition[] = []
): BlueprintExport {
  const name = advisor.name || advisor.title || 'Advisor';
  const blueprint = advisor.cognitive_blueprint;

  if (!blueprint) {
    return {
      soulMd: `# ${name}\n\nNo cognitive blueprint available. Generate one first.\n`,
      agentsMd: `# ${name}\n\nNo cognitive blueprint available.\n`,
      skillMds: [],
    };
  }

  const soulMd = compileSoulMd(blueprint, name);
  const agentsMd = compileAgentsMd(blueprint, name, advisorType);
  const skillMds = skills.map((s) => compileSkillMd(s));

  return { soulMd, agentsMd, skillMds };
}
