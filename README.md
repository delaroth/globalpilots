# GlobePilot

**Budget in. Adventure out.**

GlobePilot is an AI-powered budget travel planning web app that helps you find the best flight deals and plan your perfect adventure.

## Features

- Flight search with real-time pricing
- AI-powered travel recommendations
- Budget-friendly options
- Global destination coverage

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **APIs:**
  - TravelPayouts API for flight data
  - Anthropic Claude API for AI recommendations

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/globepilots.git
cd globepilots
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with:

```env
TRAVELPAYOUTS_TOKEN=your_travelpayouts_token_here
TRAVELPAYOUTS_MARKER=your_travelpayouts_marker_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
globepilots/
├── app/                  # Next.js App Router pages
│   ├── globals.css      # Global styles
│   ├── layout.tsx       # Root layout
│   └── page.tsx         # Homepage
├── components/          # React components
│   └── FlightSearch.tsx # Flight search form
├── public/              # Static assets
└── .env.local          # Environment variables (not in git)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Color Scheme

- **Navy:** #0A1F44 (primary brand color)
- **Sky Blue:** #87CEEB (accent color)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

ISC

## Contact

Visit us at [GlobePilots.com](https://globepilots.com)
