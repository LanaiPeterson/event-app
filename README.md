# RTT Events App

A full-stack React web app for discovering local events, exploring nearby places, and planning your day or next vacation with an AI assistant powered by Claude.

---

## Features

- **Event Discovery** — Browse concerts, sports, arts, comedy, and family events pulled from the Ticketmaster API, filtered by category, date, and distance.
- **Interactive Map** — View events and places on a Google Map with clickable pins and detail modals.
- **Places Explorer** — Find nearby museums, parks, restaurants, amusement parks, escape rooms, and more via Google Places API.
- **Saved Events** — Bookmark events and view them in a dedicated saved list.
- **AI Itinerary Planner** — Type (or speak) a request and Claude builds a custom day plan around nearby places and events, factoring in your budget, group size, travel time, traffic patterns, and live weather.
- **AI Vacation Planner** — Ask Claude to recommend a vacation anywhere in the world. Get destination suggestions, per-person cost breakdowns (flights, hotel, food, activities), a sample day-by-day itinerary, booking tips, and three alternative destinations.
- **Event Organizer Role** — Users with the "planner" role can create and manage their own events.
- **AI Chat Assistant** — A floating chat box available on every page for quick questions and suggestions.
- **Authentication** — Sign up, log in, and reset your password. New users pick interest categories before landing on the events feed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Vite |
| Maps | Google Maps JavaScript API (`@react-google-maps/api`) |
| Events | Ticketmaster Discovery API |
| Places | Google Places API (New) |
| AI | Anthropic Claude (`claude-haiku-4-5-20251001`) |
| Weather | Open-Meteo (free, no key required) |
| Geocoding | Google Geocoding API |

---

## Getting Started

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd events-app
npm install
```

### 2. Add your API keys

Copy `.env.example` to a new file named `.env.local`:

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all three keys:

```
VITE_TICKETMASTER_KEY=your_key_here
VITE_GOOGLE_MAPS_KEY=your_key_here
VITE_ANTHROPIC_KEY=your_key_here
```

See the section below for where to get each key.

### 3. Run the dev server

```bash
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## API Key Setup

### Ticketmaster (free — 5,000 calls/day)

1. Sign up at [developer.ticketmaster.com](https://developer.ticketmaster.com/)
2. Go to **My Apps** → Create a new app
3. Copy the **Consumer Key** into `VITE_TICKETMASTER_KEY`

### Google Maps / Places (free $200/month credit)

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a project
2. Enable **Places API (New)** and **Maps JavaScript API** in APIs & Services → Library
3. Create credentials → **API Key**
4. Copy the key into `VITE_GOOGLE_MAPS_KEY`

### Anthropic / Claude (pay-as-you-go, ~$0.25/1M tokens)

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Go to **API Keys** → Create a new key
3. Copy the key into `VITE_ANTHROPIC_KEY`
4. Add billing credits at **Plans & Billing** (minimum $5) — the AI planner will not work without credits

---

## How to Use

### Browsing Events

After logging in and selecting your interest categories, you land on the **Events** page. Use the filters at the top to narrow by category, date range, or distance. Click any event card to see the full details, get directions, or save it to your list.

### Exploring Places

Click **Places** in the nav to search for nearby venues — restaurants, parks, museums, and more. The map updates as you search. Click a pin or card to see hours, ratings, and a link to Google Maps.

### AI Itinerary Planner

Click **Plan Day** (on the Events page header) or navigate to `/itinerary`.

**For a local day plan**, type something like:

> "A fun family afternoon with lunch and an outdoor activity, budget $120"

The AI reads nearby places and upcoming events, checks today's weather forecast, detects the season, and builds a timed itinerary with estimated costs, travel minutes between stops, and practical tips.

**For a vacation recommendation**, type something like:

> "Recommend a beach vacation for me and my husband anywhere in the world, budget $1,800 per person"

The AI detects vacation intent from your prompt and switches to vacation mode — recommending a destination, estimating flights from your city, breaking down the full per-person cost, and providing a sample multi-day itinerary with booking tips and three alternatives.

**Voice input** — click the microphone icon to dictate your request instead of typing.

**Change city** — click the location badge at the top of the planner to search for a different city for your itinerary.

### Saving Events

Click the bookmark icon on any event card to save it. Access your saved events from the **Saved** page in the nav.

### Creating Events (Organizer role)

If your account has the **planner** role, you are routed to the **Organizer** dashboard where you can create new events and manage your listings.

---

## Project Structure

```
src/
├── api/
│   ├── auth.js            # Login / signup / password reset
│   ├── geocode.js         # Google Geocoding helpers
│   ├── googlePlaces.js    # Google Places API calls
│   ├── itinerary.js       # Claude AI — local planner + vacation planner
│   ├── overpass.js        # OpenStreetMap Overpass API (supplemental places)
│   ├── ticketmaster.js    # Ticketmaster event search
│   ├── userEvents.js      # User-created event CRUD
│   └── weather.js         # Open-Meteo weather forecast
├── components/
│   ├── auth/              # LoginForm, SignupForm, ForgotPasswordForm
│   ├── chat/              # AIChatBox (floating assistant)
│   ├── events/            # EventCard, EventList, EventMap, Filters, LocationSearch
│   ├── itinerary/         # ItineraryBuilder (AI planner UI)
│   ├── notifications/     # NotificationBell
│   ├── places/            # PlaceDetailModal
│   └── ui/                # AddressAutocomplete
├── constants/
│   └── seasons.js         # Season detection + AI hints (used internally by itinerary)
├── contexts/
│   ├── FilterContext.jsx
│   ├── NotificationContext.jsx
│   ├── SavedEventsContext.jsx
│   └── UserContext.jsx
├── pages/
│   ├── CategoryPage.jsx   # Interest category picker (onboarding)
│   ├── CreateEventPage.jsx
│   ├── EventsPage.jsx     # Main event feed
│   ├── ItineraryPage.jsx  # AI planner page
│   ├── LoginPage.jsx
│   ├── OrganizerPage.jsx
│   ├── PlacesPage.jsx
│   └── SavedEventsPage.jsx
└── styles/
    └── index.css
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `VITE_TICKETMASTER_KEY` | Yes | Ticketmaster Discovery API consumer key |
| `VITE_GOOGLE_MAPS_KEY` | Yes | Google Maps + Places API key |
| `VITE_ANTHROPIC_KEY` | Yes (for AI features) | Anthropic Claude API key |

Never commit `.env.local` — it is already listed in `.gitignore`.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`. Note that the Vite dev proxy (used for the Anthropic API) is only active in development. For production you will need a backend proxy or serverless function to forward requests to `https://api.anthropic.com` to keep your API key server-side.
