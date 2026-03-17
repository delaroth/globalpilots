---
name: amadeus_self_service_dead
description: Amadeus Self-Service API is being decommissioned July 2026 — cannot be used, need alternative live data source
type: project
---

Amadeus for Developers self-service portal is being shut down July 17, 2026. Enterprise APIs remain but require contracts/minimums unsuitable for a solo dev.

**Why:** User got "Access denied" on the portal. The announcement confirms decommission. Our Amadeus integration (test host) is dead code.

**How to apply:** Remove Amadeus from the provider chain. Replace with Kiwi Tequila API as primary live source. The KIWI_API_KEY env var exists but is currently empty — needs a real key. All references to 'amadeus' in search-gate, provider chain, and confidence scoring need updating.
