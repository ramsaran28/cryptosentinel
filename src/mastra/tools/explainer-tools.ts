import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getFearGreedTool = createTool({
  id: "get-fear-greed",
  description: "Fetches the current Fear & Greed index score from alternative.me",
  inputSchema: z.object({}),
  outputSchema: z.object({
    value: z.string(),
    classification: z.string(),
  }),
  execute: async () => {
    const res = await fetch("https://api.alternative.me/fng/");
    const data = await res.json();
    return {
      value: data.data[0].value,
      classification: data.data[0].value_classification,
    };
  },
});