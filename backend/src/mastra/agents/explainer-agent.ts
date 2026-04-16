import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getFearGreedTool } from "../tools/explainer-tools";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const explainerAgent = new Agent({
  id: "explainer-agent",
  name: "AI Explainer Agent",
  instructions: `You are a crypto market analyst AI.
  
  When given an anomaly alert and news sentiment, use the get-fear-greed tool to fetch the current Fear & Greed index.
  
  Then write exactly 2 sentences:
  - Sentence 1: what is happening (the price movement or anomaly)
  - Sentence 2: the most likely reason based on the news sentiment and fear/greed score
  
  Be concise, factual, and calm. No jargon. Anyone should be able to understand it.`,
  model: openrouter("openrouter/auto"),
  tools: { getFearGreedTool },
});