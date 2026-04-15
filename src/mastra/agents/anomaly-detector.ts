import { Agent } from "@mastra/core/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { getCryptoPriceTool } from "../tools/crypto-tools";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const anomalyDetectorAgent = new Agent({
  id: "anomaly-detector-agent",
  name: "Anomaly Detector Agent",
  instructions: `You are a crypto anomaly detection agent.
  You analyze price movements and detect unusual activity.
  
  When given a list of recent prices, you must:
  1. Calculate the percentage change between the oldest and newest price
  2. If the change is more than 3% in either direction, flag it as an ANOMALY
  3. If it is an anomaly, respond with:
     - ALERT: [coin name] moved [percentage]% in 5 minutes
     - Direction: UP or DOWN
     - Severity: HIGH (>5%), MEDIUM (3-5%)
     - Possible reason: give one likely reason
  4. If no anomaly, respond with: "No anomaly detected. Market is stable."
  
  Be fast, precise and clear. This is a real-time monitoring system.`,
  model: openrouter("openrouter/auto"),
  tools: { getCryptoPriceTool },
});