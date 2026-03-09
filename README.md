# GlobePilot ✈️

**Budget in. Adventure out.**

GlobePilot is an AI-powered budget travel planning web app built with Next.js 14, TypeScript, and Tailwind CSS. Find the best flight deals, discover mystery destinations, and plan your perfect adventure.

🌐 **Live at:** [GlobePilots.com](https://globepilots.com)

---

## 🚀 Features

### 1. **Cheapest Days Calendar** (`/calendar`)
Interactive monthly calendar showing the cheapest flight prices for each day.
- Color-coded pricing (green = cheapest, yellow = mid, red = expensive)
- Click any day to book via affiliate link
- Real-time price data from TravelPayouts API

### 2. **Weekend Deals** (`/weekend`)
Find affordable weekend getaways from your city.
- Top 6 cheapest destinations for upcoming weekends
- Auto-detect departure city
- Quick booking with departure date info

### 3. **Mystery Vacation** (`/mystery`)
AI-powered surprise destination generator.
- Input: budget, departure city, dates, vibes, traveller type
- **AI generates** a perfect destination with:
  - Real flight prices from TravelPayouts
  - 3-day itinerary
  - Local food recommendations
  - Insider tips
- Reveal animation with shareable links

### 4. **Layover Arbitrage** (`/layover`)
Save money by booking stopover flights instead of direct routes.
- Compares direct vs. stopover prices through major hubs
- Shows savings and turn layovers into bonus destinations
- Checks 5 major hub cities automatically

### 5. **Price Alerts** (`/alerts`)
Set target prices and get notified when flights drop.
- Local storage tracking (Supabase ready)
- Active/pause toggle for alerts
- Current price vs. target price comparison

### 6. **Natural Language Search** (Homepage)
AI-powered search that understands plain English.
- Example queries:
  - "Beach vacation under $1500"
  - "NYC to Tokyo in summer"
  - "Cheap weekend from LA"
- Routes to appropriate feature automatically

---

## 🤖 AI APIs

### `/api/ai-mystery` (POST)
Generate mystery destination with real price data.

**Request:**
```json
{
  "origin": "NYC",
  "budget": 1500,
  "vibes": ["beach", "food"],
  "dates": "July 2024"
}
```

**Features:**
- Fetches real prices from TravelPayouts first
- Passes to DeepSeek AI for destination selection
- 1-hour cache
- Claude fallback on DeepSeek failure

### `/api/ai-predict` (GET)
Price trend prediction (BUY_NOW or WAIT).

**Query params:**
- `origin`: Departure airport code
- `destination`: Arrival airport code

**Response:**
```json
{
  "action": "BUY_NOW",
  "reason": "Prices are 15% below average and trending up",
  "confidence": "high"
}
```

**Features:**
- Analyzes last 3 months of price data
- 6-hour cache per route
- AI-powered trend analysis

### `/api/ai-itinerary` (POST)
Generate detailed day-by-day itinerary.

**Request:**
```json
{
  "destination": "Barcelona",
  "days": 3,
  "vibe": "food and culture"
}
```

**Features:**
- Cached permanently by destination+vibe (Supabase ready)
- Never generates same itinerary twice
- Budget estimates included

### `/api/ai-parse` (POST)
Parse natural language into structured search params.

**Request:**
```json
{
  "query": "Beach vacation under $1500"
}
```

**Response:**
```json
{
  "origin": null,
  "destination": null,
  "budget": 1500,
  "dates": null,
  "vibe": ["beach"],
  "confidence": "high"
}
```

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **APIs:**
  - TravelPayouts Data API (flight prices, calendar data)
  - DeepSeek AI (primary, cost-effective)
  - Claude Sonnet 4.5 (fallback)
- **Caching:** In-memory cache with TTL
- **Deployment:** Vercel (recommended)

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- TravelPayouts API credentials
- DeepSeek API key
- Claude API key (fallback)

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/delaroth/globalpilots.git
cd globepilots
```

2. **Install dependencies:**
```bash
npm install
```

3. **Environment variables:**

Create `.env.local`:

```env
# TravelPayouts API
TRAVELPAYOUTS_TOKEN=your_token_here
TRAVELPAYOUTS_MARKER=708764
TRAVELPAYOUTS_CAMPAIGN_ID=100
TRAVELPAYOUTS_TRS=505363

# AI APIs
DEEPSEEK_API_KEY=your_deepseek_key_here
ANTHROPIC_API_KEY=your_claude_key_here

# Optional
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Run development server:**
```bash
npm run dev
```

5. **Open:** [http://localhost:3000](http://localhost:3000)

---

## 🏗 Project Structure

```
globepilots/
├── app/
│   ├── api/
│   │   ├── ai-mystery/         # Mystery destination generator
│   │   ├── ai-predict/         # Price prediction
│   │   ├── ai-itinerary/       # Itinerary generator
│   │   ├── ai-parse/           # NL query parser
│   │   └── travelpayouts/      # Flight data proxies
│   ├── calendar/               # Calendar feature page
│   ├── weekend/                # Weekend deals page
│   ├── mystery/                # Mystery vacation page
│   ├── layover/                # Layover arbitrage page
│   ├── alerts/                 # Price alerts page
│   ├── sitemap.ts              # SEO sitemap
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Homepage
├── components/
│   ├── Navigation.tsx          # Global nav with mobile menu
│   ├── Footer.tsx              # Global footer
│   ├── NaturalLanguageSearch.tsx  # AI search bar
│   ├── CalendarGrid.tsx        # Price calendar
│   ├── DestinationCard.tsx     # Weekend deal cards
│   ├── MysteryReveal.tsx       # Mystery destination reveal
│   ├── RouteComparison.tsx     # Layover vs direct comparison
│   └── ...
├── lib/
│   ├── ai.ts                   # AI utilities (DeepSeek + Claude fallback)
│   ├── cache.ts                # In-memory caching with TTL
│   ├── affiliate.ts            # Affiliate link generation
│   ├── geolocation.ts          # City/airport mapping
│   ├── hubs.ts                 # Major airline hubs
│   └── storage.ts              # LocalStorage utilities
├── public/
│   └── robots.txt              # SEO robots file
└── .env.local                  # Environment variables (not in git)
```

---

##📊 AI Cost Optimization

All AI endpoints:
- ✅ Check cache before API call
- ✅ Log token usage to console
- ✅ Claude API fallback if DeepSeek fails
- ✅ Reasonable temperature & max_tokens settings

**Estimated costs** (DeepSeek):
- Mystery vacation: ~$0.001 per request
- Price prediction: ~$0.0003 per request
- Itinerary: ~$0.002 per request (cached permanently)
- Query parsing: ~$0.0002 per request

---

## 🔗 Affiliate Integration

All booking links use TravelPayouts affiliate format:

```
https://tp.media/r?campaign_id=100&marker=708764&p=4114&sub_id=GlobePilots&trs=505363&u={destination_url}
```

**Commission rates:**
- Aviasales.com flights: 50-70% commission
- Hotels: 40-50% commission

---

## 🚢 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables in Production
Set all variables from `.env.local` in your hosting provider's dashboard.

---

## 📈 SEO Optimizations

✅ Metadata tags on all pages
✅ Sitemap.xml at `/sitemap.xml`
✅ robots.txt for search engines
✅ Semantic HTML structure
✅ Mobile-responsive design
✅ Fast page loads with Next.js 14

---

## 🎨 Design System

**Colors:**
- Navy: `#0A1F44` (primary brand)
- Sky Blue: `#87CEEB` (accent)
- Gradients: Navy-dark → Navy → Navy-light

**Typography:**
- Font: Inter (Google Fonts)
- Headers: Bold, large sizing
- Body: Regular weight, good contrast

**Components:**
- Rounded corners (`rounded-xl`, `rounded-2xl`)
- Glass morphism effects (`backdrop-blur-sm`)
- Hover animations (`hover:scale-105`)
- Mobile-first responsive design

---

## 🧪 Testing

```bash
npm run dev     # Start dev server
npm run build   # Build for production
npm run lint    # Run ESLint
```

**Test each feature:**
1. Calendar: Try JFK → LAX for next month
2. Weekend: Select NYC as origin
3. Mystery: Fill form with $1500 budget
4. Layover: Try NYC → TYO
5. Alerts: Create alert for any route
6. NL Search: Type "beach vacation under $1000"

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

ISC License - see LICENSE file for details.

---

## 👨‍💻 Author

Built with ❤️ for budget travellers.

**Links:**
- Website: [GlobePilots.com](https://globepilots.com)
- GitHub: [@delaroth](https://github.com/delaroth)

---

## 🙏 Acknowledgments

- **TravelPayouts** for flight data API
- **DeepSeek** for cost-effective AI
- **Anthropic Claude** for reliable AI fallback
- **Vercel** for hosting platform
