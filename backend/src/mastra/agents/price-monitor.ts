import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getCryptoPriceTool } from "../tools/crypto-tools";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const priceMonitorAgent = new Agent({
  id: "price-monitor-agent",
  name: "Price Monitor Agent",
  instructions: `You are a crypto price monitoring agent.
  
  When asked for a coin's price, use the get-crypto-price tool and return a structured report in this exact format:
  
  Coin: [coin name]
  Current Price: $[price]
  24h Change: [percentage]%
  Direction: UP or DOWN
  Price History (oldest to newest): [list every price from the priceHistory array separated by commas]
  Oldest Price: $[first price in history]
  Newest Price: $[last price in history]
  Price Range: $[lowest] - $[highest]
  
  Always include the full price history array values. Never summarize or skip them. This data is used by downstream agents for anomaly detection.`,
  model: openrouter("openrouter/auto"),
  tools: { getCryptoPriceTool },
});