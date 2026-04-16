import { useState, useEffect, useRef } from "react";

const COINS = [
  { id: "bitcoin", symbol: "BTC", wsSymbol: "btcusdt" },
  { id: "ethereum", symbol: "ETH", wsSymbol: "ethusdt" },
  { id: "solana", symbol: "SOL", wsSymbol: "solusdt" },
];

function CandleChart({ candles, currentPrice }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
    const VOLUME_H = 60;
    const CHART_H = H - VOLUME_H - 30;
    const PAD_LEFT = 10;
    const PAD_RIGHT = 60;

    ctx.clearRect(0, 0, W, H);

    const prices = candles.flatMap((c) => [c.high, c.low]);
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || 1;

    const volumes = candles.map((c) => c.volume);
    const maxVol = Math.max(...volumes) || 1;

    const candleW = Math.max(4, Math.floor((W - PAD_LEFT - PAD_RIGHT) / candles.length) - 2);
    const gap = Math.floor((W - PAD_LEFT - PAD_RIGHT) / candles.length);

    const toY = (p) => PAD_LEFT + CHART_H - ((p - minP) / range) * CHART_H;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = PAD_LEFT + (CHART_H / 4) * i;
      ctx.strokeStyle = "#1a1f2e";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();
      const price = maxP - (range / 4) * i;
      ctx.fillStyle = "#4a5568";
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(price.toFixed(0), W - PAD_RIGHT + 4, y + 4);
    }

    // Candles
    candles.forEach((c, i) => {
      const x = PAD_LEFT + i * gap + gap / 2;
      const bullish = c.close >= c.open;
      const color = bullish ? "#00d97e" : "#ff4d6d";

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH = Math.max(1, bodyBot - bodyTop);
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);

      // Volume
      const volH = (c.volume / maxVol) * VOLUME_H * 0.8;
      ctx.fillStyle = bullish ? "rgba(0,217,126,0.3)" : "rgba(255,77,109,0.3)";
      ctx.fillRect(x - candleW / 2, H - 20 - volH, candleW, volH);
    });

    // Current price line
    if (currentPrice) {
      const y = toY(currentPrice);
      ctx.strokeStyle = "#00d97e";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(PAD_LEFT, y);
      ctx.lineTo(W - PAD_RIGHT, y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#00d97e";
      ctx.fillRect(W - PAD_RIGHT + 2, y - 9, PAD_RIGHT - 4, 18);
      ctx.fillStyle = "#0a0a0f";
      ctx.font = "bold 10px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(currentPrice.toFixed(0), W - PAD_RIGHT + 28, y + 4);
    }
  }, [candles, currentPrice]);

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={360}
      style={{ width: "100%", height: "100%" }}
    />
  );
}

function FearGreedGauge({ value, label }) {
  const angle = ((value / 100) * 180) - 90;
  const color = value < 25 ? "#ff4d6d" : value < 50 ? "#ff9500" : value < 75 ? "#ffd60a" : "#00d97e";

  return (
    <div style={{ textAlign: "center" }}>
      <svg viewBox="0 0 120 70" width="140" height="80">
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#1a1f2e" strokeWidth="8" strokeLinecap="round" />
        <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157} 157`} />
        <line
          x1="60" y1="60"
          x2={60 + 35 * Math.cos(((angle) * Math.PI) / 180)}
          y2={60 + 35 * Math.sin(((angle) * Math.PI) / 180)}
          stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="3" fill="#e2e8f0" />
        <text x="60" y="72" textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">{value}</text>
      </svg>
      <div style={{ color, fontSize: 11, fontWeight: 700, letterSpacing: 1, marginTop: -4 }}>{label?.toUpperCase()}</div>
    </div>
  );
}

export default function CryptoDashboard() {
  const [activeCoin, setActiveCoin] = useState(COINS[0]);
  const [price, setPrice] = useState(null);
  const [change24h, setChange24h] = useState(null);
  const [candles, setCandles] = useState([]);
  const [fearGreed, setFearGreed] = useState({ value: 23, label: "Fear" });
  const [sentiment, setSentiment] = useState("NEUTRAL");
  const [anomaly, setAnomaly] = useState("No anomaly detected. Market is stable.");
  const [aiInsight, setAiInsight] = useState("Analyzing market conditions...");
  const [connected, setConnected] = useState(false);
  const [news, setNews] = useState([]);
  const wsRef = useRef(null);
  const candleRef = useRef({});

  useEffect(() => {
    fetch("https://api.alternative.me/fng/")
      .then((r) => r.json())
      .then((d) => setFearGreed({ value: parseInt(d.data[0].value), label: d.data[0].value_classification }))
      .catch(() => {});

    fetch(`https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=${import.meta.env.VITE_CRYPTOCOMPARE_API_KEY || ""}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.Data) setNews(d.Data.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    candleRef.current = {};
    setCandles([]);
    setConnected(false);

    fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${activeCoin.id}&price_change_percentage=24h`)
      .then((r) => r.json())
      .then((d) => {
        if (d[0]) {
          setPrice(d[0].current_price);
          setChange24h(d[0].price_change_percentage_24h);
        }
      })
      .catch(() => {});

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${activeCoin.wsSymbol}@kline_1m`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (e) => {
      const data = JSON.parse(e.data);
      const k = data.k;
      const candle = {
        time: k.t,
        open: parseFloat(k.o),
        high: parseFloat(k.h),
        low: parseFloat(k.l),
        close: parseFloat(k.c),
        volume: parseFloat(k.v),
      };

      setPrice(candle.close);

      candleRef.current[k.t] = candle;
      const sorted = Object.values(candleRef.current).sort((a, b) => a.time - b.time).slice(-60);
      setCandles([...sorted]);
    };

    return () => ws.close();
  }, [activeCoin]);

  const isUp = change24h >= 0;

  return (
    <div style={{
      background: "#0a0a0f",
      minHeight: "100vh",
      fontFamily: "'JetBrains Mono', 'Courier New', monospace",
      color: "#e2e8f0",
      padding: 0,
    }}>
      {/* Top Nav */}
      <div style={{
        background: "#0d0d15",
        borderBottom: "1px solid #1a1f2e",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00d97e", boxShadow: "0 0 8px #00d97e" }} />
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 2, color: "#00d97e" }}>CRYPTOSENTINEL</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {COINS.map((c) => (
            <button key={c.id} onClick={() => setActiveCoin(c)} style={{
              background: activeCoin.id === c.id ? "#00d97e15" : "transparent",
              border: `1px solid ${activeCoin.id === c.id ? "#00d97e" : "#1a1f2e"}`,
              color: activeCoin.id === c.id ? "#00d97e" : "#4a5568",
              padding: "6px 16px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              fontFamily: "inherit",
            }}>{c.symbol}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#00d97e" : "#ff4d6d" }} />
          <span style={{ fontSize: 11, color: "#4a5568" }}>{connected ? "LIVE" : "CONNECTING"}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 0, height: "calc(100vh - 53px)" }}>

        {/* Left - Chart Area */}
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Price Header */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: "#e2e8f0", letterSpacing: -1 }}>
              ${price ? price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "---"}
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              color: isUp ? "#00d97e" : "#ff4d6d",
              background: isUp ? "#00d97e15" : "#ff4d6d15",
              padding: "2px 10px",
              borderRadius: 4,
            }}>
              {isUp ? "+" : ""}{change24h?.toFixed(2)}%
            </span>
            <span style={{ fontSize: 11, color: "#4a5568" }}>{activeCoin.symbol}/USDT • 1m</span>
          </div>

          {/* Chart */}
          <div style={{
            background: "#0d0d15",
            border: "1px solid #1a1f2e",
            borderRadius: 8,
            flex: 1,
            overflow: "hidden",
            position: "relative",
          }}>
            {candles.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#4a5568", fontSize: 12 }}>
                Waiting for live data...
              </div>
            ) : (
              <CandleChart candles={candles} currentPrice={price} />
            )}
          </div>

          {/* Bottom Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              { label: "24H HIGH", value: candles.length ? `$${Math.max(...candles.map(c => c.high)).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "---", color: "#00d97e" },
              { label: "24H LOW", value: candles.length ? `$${Math.min(...candles.map(c => c.low)).toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "---", color: "#ff4d6d" },
              { label: "VOLUME", value: candles.length ? `${(candles.reduce((s, c) => s + c.volume, 0)).toFixed(2)}` : "---", color: "#a78bfa" },
              { label: "CANDLES", value: `${candles.length}`, color: "#ffd60a" },
            ].map((s) => (
              <div key={s.label} style={{ background: "#0d0d15", border: "1px solid #1a1f2e", borderRadius: 6, padding: "10px 14px" }}>
                <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div style={{
          borderLeft: "1px solid #1a1f2e",
          background: "#0d0d15",
          display: "flex",
          flexDirection: "column",
          gap: 0,
          overflowY: "auto",
        }}>

          {/* Fear & Greed */}
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1f2e" }}>
            <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 2, marginBottom: 12 }}>FEAR & GREED INDEX</div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <FearGreedGauge value={fearGreed.value} label={fearGreed.label} />
            </div>
          </div>

          {/* Anomaly */}
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1f2e" }}>
            <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 2, marginBottom: 10 }}>ANOMALY DETECTOR</div>
            <div style={{
              background: "#ff4d6d08",
              border: "1px solid #ff4d6d30",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              color: "#ff4d6d",
              lineHeight: 1.6,
            }}>
              {anomaly}
            </div>
          </div>

          {/* Market Sentiment */}
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1f2e" }}>
            <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 2, marginBottom: 10 }}>MARKET SENTIMENT</div>
            <div style={{ display: "flex", gap: 6 }}>
              {["BULLISH", "NEUTRAL", "BEARISH"].map((s) => (
                <div key={s} style={{
                  flex: 1,
                  padding: "8px 4px",
                  borderRadius: 6,
                  textAlign: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  background: sentiment === s
                    ? s === "BULLISH" ? "#00d97e20" : s === "BEARISH" ? "#ff4d6d20" : "#ffd60a20"
                    : "#0a0a0f",
                  border: `1px solid ${sentiment === s
                    ? s === "BULLISH" ? "#00d97e" : s === "BEARISH" ? "#ff4d6d" : "#ffd60a"
                    : "#1a1f2e"}`,
                  color: sentiment === s
                    ? s === "BULLISH" ? "#00d97e" : s === "BEARISH" ? "#ff4d6d" : "#ffd60a"
                    : "#4a5568",
                  cursor: "pointer",
                }} onClick={() => setSentiment(s)}>{s}</div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div style={{ padding: "16px", borderBottom: "1px solid #1a1f2e" }}>
            <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 2, marginBottom: 10 }}>AI INSIGHT</div>
            <div style={{
              background: "#a78bfa10",
              border: "1px solid #a78bfa30",
              borderRadius: 6,
              padding: "10px 12px",
              fontSize: 11,
              color: "#c4b5fd",
              lineHeight: 1.7,
            }}>
              {aiInsight}
            </div>
          </div>

          {/* News Feed */}
          <div style={{ padding: "16px", flex: 1 }}>
            <div style={{ fontSize: 9, color: "#4a5568", letterSpacing: 2, marginBottom: 10 }}>LIVE NEWS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {news.length === 0 ? (
                <div style={{ fontSize: 11, color: "#4a5568" }}>Loading news...</div>
              ) : news.map((n, i) => (
                <div key={i} style={{
                  background: "#0a0a0f",
                  border: "1px solid #1a1f2e",
                  borderRadius: 6,
                  padding: "8px 10px",
                  cursor: "pointer",
                }} onClick={() => window.open(n.url, "_blank")}>
                  <div style={{ fontSize: 10, color: "#e2e8f0", lineHeight: 1.5, marginBottom: 4 }}>{n.title}</div>
                  <div style={{ fontSize: 9, color: "#4a5568" }}>{n.source}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
