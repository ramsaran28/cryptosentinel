import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { priceMonitorAgent } from "../agents/price-monitor";
import { anomalyDetectorAgent } from "../agents/anomaly-detector";
import { sentimentAgent } from "../agents/sentiment-agent";

const monitorStep = createStep({
  id: "monitor-price",
  inputSchema: z.object({ coin: z.string() }),
  outputSchema: z.object({ priceReport: z.string(), coin: z.string() }),
  execute: async ({ inputData }) => {
    const result = await priceMonitorAgent.generate(
      `Get the current price and 24h change for ${inputData.coin}`
    );
    return { priceReport: result.text, coin: inputData.coin };
  },
});

const detectStep = createStep({
  id: "detect-anomaly",
  inputSchema: z.object({ priceReport: z.string(), coin: z.string() }),
  outputSchema: z.object({ anomalyReport: z.string(), coin: z.string() }),
  execute: async ({ inputData }) => {
    const result = await anomalyDetectorAgent.generate(
      `Analyze this price data for ${inputData.coin} and detect anomalies:\n${inputData.priceReport}`
    );
    return { anomalyReport: result.text, coin: inputData.coin };
  },
});

const sentimentStep = createStep({
  id: "analyze-sentiment",
  inputSchema: z.object({ anomalyReport: z.string(), coin: z.string() }),
  outputSchema: z.object({ sentimentReport: z.string() }),
  execute: async ({ inputData }) => {
    const result = await sentimentAgent.generate(
      `analyze current crypto news sentiment for ${inputData.coin}. Also consider this anomaly context:\n${inputData.anomalyReport}`
    );
    return { sentimentReport: result.text };
  },
});

export const cryptoPipeline = createWorkflow({
  id: "crypto-pipeline",
  inputSchema: z.object({ coin: z.string() }),
  outputSchema: z.object({ sentimentReport: z.string() }),
})
  .then(monitorStep)
  .then(detectStep)
  .then(sentimentStep)
  .commit();