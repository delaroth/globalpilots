# Future Features — Build Later

## Tier 3: Unique Differentiators (Medium Impact)

### 10. Interactive Deal Map
- World map with price pins colored by affordability (green=cheap, red=expensive)
- Click a pin to see destination details + "Plan Trip" button
- Uses SerpApi Explore data + airport-coordinates.ts for lat/lon
- Needs: Leaflet or react-simple-maps library
- Effort: Large (2-3 days)
- API cost: 1 Explore call (cached)

### 11. Contextual Travel Hack Tips
- Destination-specific money-saving tips alongside search results
- Examples: "In Bangkok: BTS day pass saves 40%, buy SIM at 7-Eleven not airport"
- "In Tokyo: Get a Suica card, avoid taxis, convenience store food is great"
- Curated database: 5-10 tips per destination, starting with top 30
- Could seed with AI-generated tips, human-review later
- Effort: Medium (1-2 days for data + UI)
- API cost: Free (static content)

### 12. Group Trip Cost Splitter
- Input: number of travelers, destination, trip length
- Shows: per-person costs for shared vs individual accommodation
- "$120/night apartment ÷ 4 = $30/person beats $50/night hostel beds"
- Optimizes for group savings (shared transport, bulk activity discounts)
- Effort: Small (mostly math on existing destination-costs data)
- API cost: Free

---

## Other Ideas for Later

### Price History Sparkline Chart
- Visual chart of price trends for a route over the past 2 months
- Data: price_history table in Supabase (already populated by cron)
- Reinforces the AI predict BUY/WAIT decision
- Effort: 1 day

### Hotel Value Score
- Ranks hotels by rating/price ratio from SerpApi Hotels data
- "Best value: 4.2 stars for $35/night" vs "Overpriced: 3.8 stars for $90/night"
- Effort: 0.5 day

### Hostel Affiliate Links
- Add Hostelworld affiliate links for budget-tier accommodation searches
- Completes the budget accommodation story
- Effort: 0.5 day

### Personalized Deal Preferences
- Extend price_alerts with region/vibe/budget preferences
- Send personalized deal emails: "Beach destinations under $300 from BKK"
- Effort: 1-2 days

### Budget Airline Identifier
- Tag which results are from low-cost carriers (LCCs)
- "Budget carrier: bags not included" warning
- Data already in Kiwi results
- Effort: 0.5 day

### Rome2Rio-style Ground Transport
- Show bus/train/ferry alternatives for short-haul routes
- "Train BKK→Chiang Mai: $15 (10hrs) vs Flight: $45 (1hr)"
- Would need Rome2Rio API or manual data
- Effort: Large

### Error Fare / Deal Detection
- Compare current SerpApi Explore prices to TravelPayouts historical averages
- Flag anything >40% below average as a "deal"
- Could power a "Today's Deals" email digest
- Effort: Medium

---

*Last updated: 2026-03-16*
*Review periodically and move items to active development when ready.*
