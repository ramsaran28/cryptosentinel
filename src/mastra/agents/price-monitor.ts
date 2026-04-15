import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const priceMonitorAgent = new Agent({
  id: "price-monitor-agent",
  name: "Price Monitor Agent",
  instructions: `You are a crypto price monitoring agent. 
  When asked for prices, fetch live cryptocurrency prices and return them clearly.
  Always include: coin name, current price in USD, and 24h percentage change.
  Be concise and precise. Format prices with 2 decimal places.`,
  model: openrouter("openrouter/auto"),
  tools: {},
});