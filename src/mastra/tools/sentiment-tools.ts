import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getCryptoNewsTool = createTool({
  id: "get-crypto-news",
  description: "Fetches the latest 10 crypto news headlines from CryptoCompare",
  inputSchema: z.object({
    categories: z.string().optional().describe("e.g. BTC,ETH or leave empty for all crypto news"),
  }),
  outputSchema: z.object({
    headlines: z.array(z.object({
      title: z.string(),
      source: z.string(),
      url: z.string(),
      publishedAt: z.string(),
    })),
  }),
  execute: async ({ categories }: { categories?: string }) => {
    const url = categories
      ? `https://min-api.cryptocompare.com/data/v2/news/?categories=${categories}&lTs=0`
      : `https://min-api.cryptocompare.com/data/v2/news/?lTs=0`;

    const res = await fetch(url, {
      headers: {
        authorization: `Apikey ${process.env.CRYPTOCOMPARE_API_KEY}`,
      },
    });

    const data = await res.json();

    const headlines = data.Data.slice(0, 10).map((item: any) => ({
      title: item.title,
      source: item.source,
      url: item.url,
      publishedAt: new Date(item.published_on * 1000).toISOString(),
    }));

    return { headlines };
  },
});