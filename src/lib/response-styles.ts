export const RESPONSE_STYLES = {
  concise: {
    id: "concise",
    name: "Concise",
    icon: "⚡",
    description: "Short, direct responses that get straight to the point.",
    example: "Best for quick answers and actionable takeaways.",
    instruction: `RESPONSE STYLE INSTRUCTION: Be concise and direct. Keep responses under 3 sentences when possible. Use bullet points for lists. Avoid preamble, filler, or unnecessary elaboration. Get straight to the actionable insight.`,
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    icon: "⚖️",
    description: "Moderate detail with clear structure and practical advice.",
    example: "The default style — informative without being overwhelming.",
    instruction: `RESPONSE STYLE INSTRUCTION: Provide balanced, well-structured responses with moderate detail. Include context when helpful but stay focused. Use headers or bullet points for clarity. Aim for practical, actionable advice.`,
  },
  detailed: {
    id: "detailed",
    name: "Detailed",
    icon: "📖",
    description: "Comprehensive explanations with step-by-step breakdowns.",
    example: "Great for deep dives and thorough understanding.",
    instruction: `RESPONSE STYLE INSTRUCTION: Provide comprehensive, detailed responses. Include step-by-step explanations, examples, and nuances. Cover edge cases and provide thorough analysis. Use structured formatting with headers and numbered lists.`,
  },
  socratic: {
    id: "socratic",
    name: "Socratic",
    icon: "🤔",
    description: "Guide through questions rather than giving direct answers.",
    example: "Ideal for developing critical thinking skills.",
    instruction: `RESPONSE STYLE INSTRUCTION: Use the Socratic method. Instead of giving direct answers, ask thought-provoking questions that guide the user to discover insights themselves. Challenge assumptions gently. After asking questions, you may provide a brief insight, but lead with questions.`,
  },
  storytelling: {
    id: "storytelling",
    name: "Storytelling",
    icon: "📚",
    description: "Rich narratives with analogies, metaphors, and real examples.",
    example: "Perfect for memorable lessons and making concepts stick.",
    instruction: `RESPONSE STYLE INSTRUCTION: Use storytelling and narrative techniques. Explain concepts through analogies, metaphors, and real-world examples. Paint vivid scenarios. Make abstract ideas concrete through stories. Include case studies or hypothetical situations that illustrate the point.`,
  },
} as const;

export type ResponseStyleId = keyof typeof RESPONSE_STYLES;
export const STYLE_IDS = Object.keys(RESPONSE_STYLES) as ResponseStyleId[];

export function getStyleInstruction(styleId: string | null | undefined): string {
  const style = RESPONSE_STYLES[styleId as ResponseStyleId];
  return style?.instruction || RESPONSE_STYLES.balanced.instruction;
}
