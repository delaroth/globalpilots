---
name: agent_transition_vision
description: GlobePilots is building toward becoming a direct-booking travel agent, not just an affiliate redirector
type: project
---

Current phase: Inspire → Redirect (affiliate links via TravelPayouts/Aviasales)
Future phase: Inspire → Book Direct (Duffel or similar, take higher cut)

**Why:** Affiliate commissions are thin (~2-3%). Direct booking with markup (5-15%) is the real business model. The Bulgaria move enables the travel agency license needed for this.

**How to apply:** Every booking interaction must go through a typed `BookingAction` resolver. Today it returns `affiliate-redirect`. Tomorrow, flipping `BOOKING_FLAGS.duffelDirectBook = true` + `STEALTH_MODE = false` makes it return `direct-book`. Callers should never know or care which mode they're in. Never hardcode affiliate URLs — always go through the resolver.
