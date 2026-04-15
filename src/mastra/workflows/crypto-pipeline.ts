import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import { priceMonitorAgent } from "../agents/price-monitor";
import { anomalyDetectorAgent } from "../agents/anomaly-detector";
import { sentimentAgent } from "../agents/sentiment-agent";
import { explainerAgent } from "../agents/explainer-agent";

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
  outputSchema: z.object({ anomalyReport: z.string(), coin: z.string(), priceReport: z.string() }),
  execute: async ({ inputData }) => {
    const result = await anomalyDetectorAgent.generate(
      `Analyze this price data for ${inputData.coin} and detect anomalies:\n${inputData.priceReport}`
    );
    return { anomalyReport: result.text, coin: inputData.coin, priceReport: inputData.priceReport };
  },
});

const sentimentStep = createStep({
  id: "analyze-sentiment",
  inputSchema: z.object({ anomalyReport: z.string(), coin: z.string(), priceReport: z.string() }),
  outputSchema: z.object({ sentimentReport: z.string(), anomalyReport: z.string(), coin: z.string() }),
  execute: async ({ inputData }) => {
    const result = await sentimentAgent.generate(
      `Fetch the latest crypto news for ${inputData.coin} using your tool and classify each headline as BULLISH, BEARISH, or NEUTRAL. Then give an overall market sentiment. Do not ask questions, just run the analysis now.`
    );
    return { sentimentReport: result.text, anomalyReport: inputData.anomalyReport, coin: inputData.coin };
  },
});

const explainStep = createStep({
  id: "explain-alert",
  inputSchema: z.object({ sentimentReport: z.string(), anomalyReport: z.string(), coin: z.string() }),
  outputSchema: z.object({ explanation: z.string() }),
  execute: async ({ inputData }) => {
    const result = await explainerAgent.generate(
      `Here is the anomaly report for ${inputData.coin}: ${inputData.anomalyReport}
      Here is the news sentiment: ${inputData.sentimentReport}
      Use the get-fear-greed tool to fetch the current Fear & Greed index.
      Then write your 2-sentence plain English explanation.`
    );
    return { explanation: result.text };
  },
});

export const cryptoPipeline = createWorkflow({
  id: "crypto-pipeline",
  inputSchema: z.object({ coin: z.string() }),
  outputSchema: z.object({ explanation: z.string() }),
})
  .then(monitorStep)
  .then(detectStep)
  .then(sentimentStep)
  .then(explainStep)
  .commit();