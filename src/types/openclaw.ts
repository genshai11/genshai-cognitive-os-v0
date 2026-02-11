/**
 * OpenClaw integration types
 * Defines the structure for exporting cognitive blueprints as OpenClaw-compatible configs
 */

export interface BlueprintExport {
  soulMd: string;
  agentsMd: string;
  skillMds: OpenClawSkillMd[];
}

export interface OpenClawSkillMd {
  name: string;
  description: string;
  content: string; // Full SKILL.md markdown
  category: string;
}

export interface OpenClawChannelConfig {
  channelName: string;
  agentName: string;
  model: string;
  tools: string[];
}
