# Treasury Visualizer

The interactive demo surface for Treasury Agent. This is what judges see during the live pitch.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## What's in here

- **Hero** — opening pitch with cost/time numbers
- **LiveDashboard** — interactive settlement simulator (the centerpiece)
  - Click "Run Demo" to walk through: AI route prediction → multi-sig approval → Solana submission → confirmation
  - Logs stream in real time, Solana tx hash is generated, savings calculated against SWIFT baseline
- **RoutingComparison** — side-by-side cost comparison across rails
- **Architecture** — system diagram
- **Financials** — unit economics and TAM

## Demo tips

- Browser zoom 110% so judges in the back can read metrics
- Demo is 100% client-side — works offline if Wi-Fi flakes at the venue
- Running once takes ~5 seconds; the savings counter is the moment that lands

See `../DEMO_SCRIPT.md` for the full pitch flow.
