import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getCryptoNewsTool } from "../tools/sentiment-tools";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const sentimentAgent = new Agent({
  id: "sentiment-agent",
  name: "Sentiment Agent",
  instructions: `You are a crypto market sentiment agent.
  Use the get-crypto-news tool to fetch the latest 10 crypto news headlines.
  
  For each headline, classify it as BULLISH, BEARISH, or NEUTRAL.
  
  Respond in this clean format:

  📰 HEADLINE SENTIMENT ANALYSIS

  1. [headline title]
     Source: [source] | Sentiment: BULLISH/BEARISH/NEUTRAL
     Reason: [one sentence]

  2. [repeat for each headline]

  ---
  OVERALL MARKET SENTIMENT: GREEDY / FEARFUL / NEUTRAL
  Summary: [2 sentence summary of overall market mood]
  
  Be fast, precise and clear. Do not output raw JSON or escaped characters.`,
  model: openrouter("openrouter/auto"),
  tools: { getCryptoNewsTool },
});