import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getCryptoPriceTool = createTool({
  id: "get-crypto-price",
  description: "Fetches live price, 24h change, and real price history for a cryptocurrency from CoinGecko",
  inputSchema: z.object({
    coinId: z.string().describe("CoinGecko coin ID e.g. bitcoin, ethereum, solana"),
  }),
  outputSchema: z.object({
    coinId: z.string(),
    priceUsd: z.number(),
    change24h: z.number(),
    priceHistory: z.array(z.number()),
  }),
  execute: async ({ coinId }: { coinId: string }) => {
    const headers = {
      "x-cg-demo-api-key": process.env.COINGECKO_API_KEY || "",
    };

    const marketRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${coinId}&price_change_percentage=24h`,
      { headers }
    );
    const marketData = await marketRes.json();
    const coin = marketData[0];
    if (!coin) throw new Error(`Coin not found: ${coinId}`);

    const historyRes = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1&interval=hourly`,
      { headers }
    );
    const historyData = await historyRes.json();

    const priceHistory = historyData.prices.map(
      ([, price]: [number, number]) => parseFloat(price.toFixed(2))
    );

    return {
      coinId,
      priceUsd: coin.current_price,
      change24h: coin.price_change_percentage_24h,
      priceHistory,
    };
  },
});