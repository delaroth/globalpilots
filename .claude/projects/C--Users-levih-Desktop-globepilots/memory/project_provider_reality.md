---
name: provider_reality_march_2026
description: Current flight data provider situation — only TravelPayouts works, Kiwi/FlightAPI require investment or users
type: project
---

As of March 2026:
- **TravelPayouts**: ONLY working provider. Cached 1-3 day old prices. Free, unlimited. Real airlines/routes.
- **Kiwi Tequila**: No free tier anymore. Requires application with proof of active users. Blocked until we have traffic.
- **FlightAPI.io**: 30 free credits (15 searches). $49/mo for real usage. Not worth it until revenue exists.
- **Amadeus**: Self-Service decommissioned July 2026. Dead.
- **Duffel**: Test mode only, mock data. Future direct-booking enabler.

**Why:** Solo dev, pre-revenue, no active user base yet. Can't justify $49/mo or meet Kiwi's user requirements.

**How to apply:** Build everything around TravelPayouts as the sole data source. The value proposition is discovery/routing intelligence (Side Quests, Mystery, Multi-City), not live pricing. Infrastructure for Kiwi and FlightAPI exists and activates with just an API key — no code changes needed. Focus on getting users first, then upgrade data sources.
