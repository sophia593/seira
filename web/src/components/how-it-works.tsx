"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Search,
  Check,
  ArrowRight,
  Ticket,
  Plane,
  Hotel,
  Music,
  Trophy,
  Theater,
  Flag,
  Loader2,
  Calendar,
  Clock,
  Star,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// =============================================================================
// Types
// =============================================================================

type Category = "concerts" | "sports" | "theater" | "racing"

interface ChatMessage {
  role: "user" | "assistant"
  text: string
}

interface ResultOption {
  icon: typeof Ticket
  label: string
  detail: string
  price: number
  tooltip: string
  isBest?: boolean
}

interface TripDay {
  day: string
  label: string
  detail: string
}

interface HowItWorksExample {
  category: Category
  chat: ChatMessage[]
  results: {
    tickets: ResultOption[]
    flights: ResultOption[]
    hotels: ResultOption[]
  }
  summary: {
    event: string
    venue: string
    date: string
    itinerary: TripDay[]
    breakdown: { label: string; price: number }[]
    total: number
  }
}

interface CategoryConfig {
  id: Category
  label: string
  icon: React.ReactNode
}

// =============================================================================
// Categories
// =============================================================================

const CATEGORIES: CategoryConfig[] = [
  { id: "concerts", label: "concerts", icon: <Music className="w-3.5 h-3.5" /> },
  { id: "sports", label: "sports", icon: <Trophy className="w-3.5 h-3.5" /> },
  { id: "theater", label: "theater", icon: <Theater className="w-3.5 h-3.5" /> },
  { id: "racing", label: "racing", icon: <Flag className="w-3.5 h-3.5" /> },
]

// =============================================================================
// Example Data (4-5 per category)
// =============================================================================

const EXAMPLES: HowItWorksExample[] = [
  // CONCERTS
  {
    category: "concerts",
    chat: [
      { role: "user", text: "i want to see taylor swift in LA" },
      { role: "assistant", text: "great choice! which city are you flying from?" },
      { role: "user", text: "san francisco" },
      { role: "assistant", text: "found 3 Eras Tour dates at SoFi Stadium. aug 7th has the best availability..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Lower Bowl Sec 118", detail: "Row 15", price: 450, tooltip: "Great view of main stage, aisle seats", isBest: true },
        { icon: Ticket, label: "Floor GA", detail: "Standing", price: 680, tooltip: "General admission floor access" },
      ],
      flights: [
        { icon: Plane, label: "SFO → LAX", detail: "Delta, 1h 20m", price: 127, tooltip: "Departs 2:30pm, arrives 3:50pm", isBest: true },
        { icon: Plane, label: "SFO → LAX", detail: "United, 1h 25m", price: 142, tooltip: "Departs 11:00am, arrives 12:25pm" },
      ],
      hotels: [
        { icon: Hotel, label: "JW Marriott LA Live", detail: "0.3 mi from venue", price: 189, tooltip: "4.5★ · Walking distance to SoFi", isBest: true },
        { icon: Hotel, label: "The Westin LAX", detail: "2.1 mi from venue", price: 145, tooltip: "4.2★ · Free airport shuttle" },
      ],
    },
    summary: {
      event: "Taylor Swift - The Eras Tour",
      venue: "SoFi Stadium, Los Angeles",
      date: "Aug 7, 2026",
      itinerary: [
        { day: "Aug 6", label: "Arrive LA", detail: "Flight + hotel check-in" },
        { day: "Aug 7", label: "Show Day", detail: "Eras Tour @ 7:00pm" },
        { day: "Aug 8", label: "Return", detail: "Check-out + flight home" },
      ],
      breakdown: [
        { label: "Ticket", price: 450 },
        { label: "Flight (round trip)", price: 254 },
        { label: "Hotel (2 nights)", price: 378 },
      ],
      total: 1082,
    },
  },
  {
    category: "concerts",
    chat: [
      { role: "user", text: "kendrick lamar concert this summer" },
      { role: "assistant", text: "nice! where would you like to see him?" },
      { role: "user", text: "somewhere in california, im coming from denver" },
      { role: "assistant", text: "he's playing Crypto.com Arena in LA on June 22nd. let me find options..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Premier Seats", detail: "Row 8", price: 310, tooltip: "VIP section with dedicated entrance", isBest: true },
        { icon: Ticket, label: "Section 102", detail: "Row 20", price: 185, tooltip: "Lower bowl, slight side angle" },
      ],
      flights: [
        { icon: Plane, label: "DEN → LAX", detail: "Southwest, 2h 15m", price: 138, tooltip: "Departs 1:45pm, arrives 2:00pm PT", isBest: true },
        { icon: Plane, label: "DEN → LAX", detail: "United, 2h 30m", price: 165, tooltip: "Departs 9:00am, arrives 9:30am PT" },
      ],
      hotels: [
        { icon: Hotel, label: "InterContinental DTLA", detail: "0.5 mi", price: 195, tooltip: "4.5★ · Rooftop bar, walkable", isBest: true },
        { icon: Hotel, label: "Freehand LA", detail: "1.2 mi", price: 125, tooltip: "4.0★ · Trendy boutique hotel" },
      ],
    },
    summary: {
      event: "Kendrick Lamar - Big Steppers Tour",
      venue: "Crypto.com Arena, LA",
      date: "Jun 22, 2026",
      itinerary: [
        { day: "Jun 21", label: "Arrive LA", detail: "Flight + check-in" },
        { day: "Jun 22", label: "Concert", detail: "Show @ 8:00pm" },
        { day: "Jun 23", label: "Depart", detail: "Late checkout + flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 310 },
        { label: "Flight (round trip)", price: 276 },
        { label: "Hotel (2 nights)", price: 390 },
      ],
      total: 976,
    },
  },
  {
    category: "concerts",
    chat: [
      { role: "user", text: "beyoncé renaissance tour" },
      { role: "assistant", text: "queen bey! where are you located?" },
      { role: "user", text: "atlanta" },
      { role: "assistant", text: "she's playing Hard Rock Stadium in Miami on July 15th. only a short flight..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Floor Row 15", detail: "Center stage", price: 380, tooltip: "Incredible view, close to B-stage", isBest: true },
        { icon: Ticket, label: "Section 136", detail: "Row 22", price: 245, tooltip: "Lower level, end zone view" },
      ],
      flights: [
        { icon: Plane, label: "ATL → MIA", detail: "Delta, 1h 45m", price: 98, tooltip: "Nonstop, departs 12:30pm", isBest: true },
        { icon: Plane, label: "ATL → MIA", detail: "Spirit, 2h", price: 65, tooltip: "Basic economy, 2:15pm departure" },
      ],
      hotels: [
        { icon: Hotel, label: "Fontainebleau Miami", detail: "Beach + pools", price: 285, tooltip: "4.7★ · Iconic Miami Beach resort", isBest: true },
        { icon: Hotel, label: "W South Beach", detail: "Oceanfront", price: 320, tooltip: "4.5★ · Modern luxury" },
      ],
    },
    summary: {
      event: "Beyoncé - Renaissance World Tour",
      venue: "Hard Rock Stadium, Miami",
      date: "Jul 15, 2026",
      itinerary: [
        { day: "Jul 14", label: "Miami arrival", detail: "Beach day + dinner" },
        { day: "Jul 15", label: "Renaissance", detail: "Show @ 7:30pm" },
        { day: "Jul 16", label: "Fly home", detail: "Morning flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 380 },
        { label: "Flight (round trip)", price: 196 },
        { label: "Hotel (2 nights)", price: 570 },
      ],
      total: 1146,
    },
  },
  {
    category: "concerts",
    chat: [
      { role: "user", text: "adele in vegas" },
      { role: "assistant", text: "her residency is amazing! where will you be coming from?" },
      { role: "user", text: "phoenix" },
      { role: "assistant", text: "perfect, that's just a quick flight. Nov 15th has great seats available..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Orchestra Center", detail: "Row 10", price: 680, tooltip: "Prime viewing, intimate venue", isBest: true },
        { icon: Ticket, label: "Mezzanine", detail: "Row 5", price: 425, tooltip: "Elevated view, great acoustics" },
      ],
      flights: [
        { icon: Plane, label: "PHX → LAS", detail: "Southwest, 1h", price: 89, tooltip: "Quick hop, bags fly free", isBest: true },
        { icon: Plane, label: "PHX → LAS", detail: "Spirit, 1h 5m", price: 59, tooltip: "Basic fare, no bags included" },
      ],
      hotels: [
        { icon: Hotel, label: "Caesars Palace", detail: "Same property", price: 245, tooltip: "4.5★ · Walk to The Colosseum", isBest: true },
        { icon: Hotel, label: "The Venetian", detail: "0.5 mi", price: 215, tooltip: "4.6★ · Gorgeous suites" },
      ],
    },
    summary: {
      event: "Weekends With Adele",
      venue: "The Colosseum at Caesars Palace",
      date: "Nov 15, 2026",
      itinerary: [
        { day: "Nov 14", label: "Vegas baby", detail: "Arrive + explore strip" },
        { day: "Nov 15", label: "Adele night", detail: "Show @ 8:00pm" },
        { day: "Nov 16", label: "Head home", detail: "Brunch + flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 680 },
        { label: "Flight (round trip)", price: 178 },
        { label: "Hotel (2 nights)", price: 490 },
      ],
      total: 1348,
    },
  },

  // SPORTS
  {
    category: "sports",
    chat: [
      { role: "user", text: "i want to see the lakers play" },
      { role: "assistant", text: "nice! where are you flying from?" },
      { role: "user", text: "san francisco" },
      { role: "assistant", text: "lakers vs celtics on Feb 14th is a great matchup. checking prices..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Section 108", detail: "Row 12", price: 320, tooltip: "Courtside level, center court view", isBest: true },
        { icon: Ticket, label: "Section 302", detail: "Row 8", price: 145, tooltip: "Upper level, still great sightlines" },
      ],
      flights: [
        { icon: Plane, label: "SFO → LAX", detail: "United, 1h 20m", price: 119, tooltip: "Morning departure, direct", isBest: true },
        { icon: Plane, label: "OAK → BUR", detail: "Southwest, 1h 15m", price: 98, tooltip: "Burbank closer to downtown" },
      ],
      hotels: [
        { icon: Hotel, label: "The Ritz-Carlton LA", detail: "0.8 mi", price: 345, tooltip: "4.8★ · Luxury downtown", isBest: true },
        { icon: Hotel, label: "Ace Hotel DTLA", detail: "0.4 mi", price: 185, tooltip: "4.3★ · Hip rooftop bar" },
      ],
    },
    summary: {
      event: "Lakers vs Celtics",
      venue: "Crypto.com Arena, LA",
      date: "Feb 14, 2026",
      itinerary: [
        { day: "Feb 13", label: "Arrive LA", detail: "Check-in + LA Live" },
        { day: "Feb 14", label: "Game Day", detail: "Tip-off @ 7:30pm" },
        { day: "Feb 15", label: "Head home", detail: "Morning flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 320 },
        { label: "Flight (round trip)", price: 238 },
        { label: "Hotel (2 nights)", price: 690 },
      ],
      total: 1248,
    },
  },
  {
    category: "sports",
    chat: [
      { role: "user", text: "super bowl tickets" },
      { role: "assistant", text: "the big game! where are you coming from?" },
      { role: "user", text: "dallas" },
      { role: "assistant", text: "Super Bowl LX is in New Orleans this year. Feb 8th. let me find options..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Lower Level 129", detail: "Row 18", price: 4500, tooltip: "Amazing view, sideline seats", isBest: true },
        { icon: Ticket, label: "Upper Level 608", detail: "Row 5", price: 2800, tooltip: "Full field view, great atmosphere" },
      ],
      flights: [
        { icon: Plane, label: "DFW → MSY", detail: "American, 1h 30m", price: 145, tooltip: "Direct flight, arrives noon", isBest: true },
        { icon: Plane, label: "DFW → MSY", detail: "Southwest, 1h 35m", price: 128, tooltip: "Afternoon departure" },
      ],
      hotels: [
        { icon: Hotel, label: "The Roosevelt", detail: "French Quarter", price: 425, tooltip: "4.6★ · Historic luxury", isBest: true },
        { icon: Hotel, label: "Hotel Monteleone", detail: "Bourbon St", price: 385, tooltip: "4.5★ · Famous carousel bar" },
      ],
    },
    summary: {
      event: "Super Bowl LX",
      venue: "Caesars Superdome, New Orleans",
      date: "Feb 8, 2026",
      itinerary: [
        { day: "Feb 6", label: "NOLA arrival", detail: "French Quarter exploring" },
        { day: "Feb 7", label: "Game Eve", detail: "Fan fest + Bourbon St" },
        { day: "Feb 8", label: "Super Bowl", detail: "Kickoff @ 5:30pm CT" },
        { day: "Feb 9", label: "Recovery", detail: "Beignets + flight home" },
      ],
      breakdown: [
        { label: "Ticket", price: 4500 },
        { label: "Flight (round trip)", price: 290 },
        { label: "Hotel (3 nights)", price: 1275 },
      ],
      total: 6065,
    },
  },
  {
    category: "sports",
    chat: [
      { role: "user", text: "yankees red sox at fenway" },
      { role: "assistant", text: "classic rivalry! are you local or traveling?" },
      { role: "user", text: "flying from nyc" },
      { role: "assistant", text: "July 4th weekend series is perfect. checking availability..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Green Monster M4", detail: "Standing room", price: 175, tooltip: "Iconic seats on the wall!", isBest: true },
        { icon: Ticket, label: "Grandstand 27", detail: "Row 8", price: 95, tooltip: "Behind home plate view" },
      ],
      flights: [
        { icon: Plane, label: "LGA → BOS", detail: "Delta Shuttle, 1h", price: 125, tooltip: "Hourly departures", isBest: true },
        { icon: Plane, label: "JFK → BOS", detail: "JetBlue, 1h 10m", price: 89, tooltip: "Extra legroom included" },
      ],
      hotels: [
        { icon: Hotel, label: "The Newbury Boston", detail: "Back Bay", price: 295, tooltip: "4.5★ · Elegant, near Fenway", isBest: true },
        { icon: Hotel, label: "Hotel Commonwealth", detail: "Kenmore Sq", price: 265, tooltip: "4.4★ · Walking distance to park" },
      ],
    },
    summary: {
      event: "Yankees vs Red Sox",
      venue: "Fenway Park, Boston",
      date: "Jul 4, 2026",
      itinerary: [
        { day: "Jul 3", label: "Boston bound", detail: "Shuttle + check-in" },
        { day: "Jul 4", label: "Game Day", detail: "First pitch @ 4:10pm" },
        { day: "Jul 5", label: "Return", detail: "Morning shuttle to NYC" },
      ],
      breakdown: [
        { label: "Ticket", price: 175 },
        { label: "Flight (round trip)", price: 250 },
        { label: "Hotel (2 nights)", price: 590 },
      ],
      total: 1015,
    },
  },
  {
    category: "sports",
    chat: [
      { role: "user", text: "wimbledon mens final" },
      { role: "assistant", text: "incredible experience! flying from the US?" },
      { role: "user", text: "yes, from new york" },
      { role: "assistant", text: "July 12th final at Centre Court. these are special tickets..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Debenture Seat", detail: "Row 15", price: 1200, tooltip: "Guaranteed Centre Court, premium", isBest: true },
        { icon: Ticket, label: "Public Ballot", detail: "If available", price: 250, tooltip: "Limited availability, queue early" },
      ],
      flights: [
        { icon: Plane, label: "JFK → LHR", detail: "British Airways, 7h", price: 680, tooltip: "Direct, arrives 7am local", isBest: true },
        { icon: Plane, label: "EWR → LHR", detail: "United, 7h 15m", price: 620, tooltip: "Direct, evening departure" },
      ],
      hotels: [
        { icon: Hotel, label: "The Savoy", detail: "Central London", price: 520, tooltip: "4.9★ · Legendary luxury", isBest: true },
        { icon: Hotel, label: "Premier Inn Wimbledon", detail: "Near venue", price: 185, tooltip: "3.8★ · Practical, close to courts" },
      ],
    },
    summary: {
      event: "Wimbledon Men's Final",
      venue: "Centre Court, London",
      date: "Jul 12, 2026",
      itinerary: [
        { day: "Jul 10", label: "Fly to London", detail: "Overnight flight" },
        { day: "Jul 11", label: "Explore", detail: "Rest + London sights" },
        { day: "Jul 12", label: "The Final", detail: "Match @ 2:00pm BST" },
        { day: "Jul 13", label: "Fly home", detail: "Morning departure" },
      ],
      breakdown: [
        { label: "Ticket", price: 1200 },
        { label: "Flight (round trip)", price: 1360 },
        { label: "Hotel (3 nights)", price: 1560 },
      ],
      total: 4120,
    },
  },

  // THEATER
  {
    category: "theater",
    chat: [
      { role: "user", text: "hamilton on broadway" },
      { role: "assistant", text: "a classic! where are you coming from?" },
      { role: "user", text: "chicago" },
      { role: "assistant", text: "March 15th has orchestra seats available at Richard Rodgers..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Orchestra Center", detail: "Row J", price: 350, tooltip: "Best view of the turntable stage", isBest: true },
        { icon: Ticket, label: "Rear Mezzanine", detail: "Row E", price: 185, tooltip: "Great acoustics, full stage view" },
      ],
      flights: [
        { icon: Plane, label: "ORD → LGA", detail: "American, 2h 15m", price: 145, tooltip: "Arrives LaGuardia, close to Midtown", isBest: true },
        { icon: Plane, label: "ORD → EWR", detail: "United, 2h 20m", price: 128, tooltip: "Newark, longer transfer to city" },
      ],
      hotels: [
        { icon: Hotel, label: "The Knickerbocker", detail: "Times Square", price: 285, tooltip: "4.5★ · Steps from theater", isBest: true },
        { icon: Hotel, label: "Pod Times Square", detail: "W 42nd St", price: 165, tooltip: "3.8★ · Compact, great location" },
      ],
    },
    summary: {
      event: "Hamilton",
      venue: "Richard Rodgers Theatre, NYC",
      date: "Mar 15, 2026",
      itinerary: [
        { day: "Mar 14", label: "NYC arrival", detail: "Check-in + dinner" },
        { day: "Mar 15", label: "Hamilton", detail: "Curtain @ 7:00pm" },
        { day: "Mar 16", label: "Fly home", detail: "Brunch + flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 350 },
        { label: "Flight (round trip)", price: 290 },
        { label: "Hotel (2 nights)", price: 570 },
      ],
      total: 1210,
    },
  },
  {
    category: "theater",
    chat: [
      { role: "user", text: "phantom of the opera in london" },
      { role: "assistant", text: "west end magic! where are you flying from?" },
      { role: "user", text: "boston" },
      { role: "assistant", text: "June 5th at His Majesty's Theatre. let me find the best seats..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Royal Circle", detail: "Row A", price: 225, tooltip: "Elevated view, see the chandelier drop", isBest: true },
        { icon: Ticket, label: "Stalls", detail: "Row N", price: 165, tooltip: "Ground level, immersive experience" },
      ],
      flights: [
        { icon: Plane, label: "BOS → LHR", detail: "Virgin Atlantic, 6h 45m", price: 580, tooltip: "Direct, premium economy available", isBest: true },
        { icon: Plane, label: "BOS → LGW", detail: "Norse Atlantic, 7h", price: 420, tooltip: "Budget option, Gatwick arrival" },
      ],
      hotels: [
        { icon: Hotel, label: "The Langham", detail: "West End", price: 385, tooltip: "4.8★ · Victorian elegance", isBest: true },
        { icon: Hotel, label: "The Hoxton Holborn", detail: "Covent Garden", price: 225, tooltip: "4.3★ · Trendy, great breakfast" },
      ],
    },
    summary: {
      event: "The Phantom of the Opera",
      venue: "His Majesty's Theatre, London",
      date: "Jun 5, 2026",
      itinerary: [
        { day: "Jun 3", label: "Fly to London", detail: "Overnight flight" },
        { day: "Jun 4", label: "West End walk", detail: "Explore theater district" },
        { day: "Jun 5", label: "Phantom", detail: "Show @ 7:30pm" },
        { day: "Jun 6", label: "Return", detail: "Morning flight home" },
      ],
      breakdown: [
        { label: "Ticket", price: 225 },
        { label: "Flight (round trip)", price: 1160 },
        { label: "Hotel (3 nights)", price: 1155 },
      ],
      total: 2540,
    },
  },
  {
    category: "theater",
    chat: [
      { role: "user", text: "wicked the musical" },
      { role: "assistant", text: "defying gravity! broadway or touring?" },
      { role: "user", text: "broadway, coming from miami" },
      { role: "assistant", text: "April 22nd at the Gershwin Theatre has great availability..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Orchestra", detail: "Row H", price: 275, tooltip: "See the Emerald City set up close", isBest: true },
        { icon: Ticket, label: "Front Mezzanine", detail: "Row B", price: 195, tooltip: "Perfect angle for flying scenes" },
      ],
      flights: [
        { icon: Plane, label: "MIA → JFK", detail: "JetBlue, 3h", price: 165, tooltip: "Direct, extra legroom", isBest: true },
        { icon: Plane, label: "MIA → LGA", detail: "Delta, 3h 5m", price: 148, tooltip: "Closer to Midtown" },
      ],
      hotels: [
        { icon: Hotel, label: "The Beekman", detail: "Financial District", price: 265, tooltip: "4.6★ · Historic landmark", isBest: true },
        { icon: Hotel, label: "citizenM Times Sq", detail: "W 50th St", price: 195, tooltip: "4.2★ · Modern, walkable" },
      ],
    },
    summary: {
      event: "Wicked",
      venue: "Gershwin Theatre, NYC",
      date: "Apr 22, 2026",
      itinerary: [
        { day: "Apr 21", label: "NYC arrival", detail: "Flight + hotel" },
        { day: "Apr 22", label: "Wicked", detail: "Curtain @ 7:00pm" },
        { day: "Apr 23", label: "Fly home", detail: "Central Park + flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 275 },
        { label: "Flight (round trip)", price: 330 },
        { label: "Hotel (2 nights)", price: 530 },
      ],
      total: 1135,
    },
  },
  {
    category: "theater",
    chat: [
      { role: "user", text: "lion king broadway" },
      { role: "assistant", text: "the puppetry is incredible! traveling from?" },
      { role: "user", text: "seattle" },
      { role: "assistant", text: "July 18th matinee has family-friendly seating..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Mezzanine Center", detail: "Row B", price: 195, tooltip: "Best view of Pride Rock scenes", isBest: true },
        { icon: Ticket, label: "Orchestra", detail: "Row L", price: 225, tooltip: "Close to parade down the aisle" },
      ],
      flights: [
        { icon: Plane, label: "SEA → JFK", detail: "Delta, 5h 15m", price: 285, tooltip: "Direct, arrive evening", isBest: true },
        { icon: Plane, label: "SEA → EWR", detail: "Alaska, 5h 30m", price: 245, tooltip: "One stop, longer travel" },
      ],
      hotels: [
        { icon: Hotel, label: "Lotte New York Palace", detail: "Midtown", price: 345, tooltip: "4.7★ · Iconic courtyard", isBest: true },
        { icon: Hotel, label: "EVEN Hotel Times Sq", detail: "W 35th St", price: 185, tooltip: "4.0★ · Wellness focused" },
      ],
    },
    summary: {
      event: "The Lion King",
      venue: "Minskoff Theatre, NYC",
      date: "Jul 18, 2026",
      itinerary: [
        { day: "Jul 17", label: "Red eye flight", detail: "Overnight to NYC" },
        { day: "Jul 18", label: "Lion King", detail: "Matinee @ 2:00pm" },
        { day: "Jul 19", label: "Explore + fly", detail: "Museums + evening flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 195 },
        { label: "Flight (round trip)", price: 570 },
        { label: "Hotel (2 nights)", price: 690 },
      ],
      total: 1455,
    },
  },

  // RACING
  {
    category: "racing",
    chat: [
      { role: "user", text: "f1 monaco grand prix" },
      { role: "assistant", text: "the crown jewel! where are you based?" },
      { role: "user", text: "new york" },
      { role: "assistant", text: "May 25th race weekend. grandstand K has amazing harbor views..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Grandstand K", detail: "Row 8", price: 890, tooltip: "Harbor chicane, yacht views", isBest: true },
        { icon: Ticket, label: "General Admission", detail: "Rocher area", price: 320, tooltip: "Standing, multiple viewpoints" },
      ],
      flights: [
        { icon: Plane, label: "JFK → NCE", detail: "Delta, 8h 30m", price: 680, tooltip: "Direct to Nice, short transfer", isBest: true },
        { icon: Plane, label: "EWR → NCE", detail: "United, 9h", price: 620, tooltip: "One stop in Paris" },
      ],
      hotels: [
        { icon: Hotel, label: "Fairmont Monte Carlo", detail: "Harborfront", price: 650, tooltip: "4.7★ · Overlooks the circuit!", isBest: true },
        { icon: Hotel, label: "Novotel Nice", detail: "Nice (20 min)", price: 245, tooltip: "4.0★ · Budget-friendly option" },
      ],
    },
    summary: {
      event: "Formula 1 Monaco Grand Prix",
      venue: "Circuit de Monaco",
      date: "May 25, 2026",
      itinerary: [
        { day: "May 23", label: "Fly to Nice", detail: "Overnight flight" },
        { day: "May 24", label: "Qualifying", detail: "Watch from grandstand" },
        { day: "May 25", label: "Race Day", detail: "Lights out @ 3pm" },
        { day: "May 26", label: "Return", detail: "Morning flight home" },
      ],
      breakdown: [
        { label: "Ticket (3-day)", price: 890 },
        { label: "Flight (round trip)", price: 1360 },
        { label: "Hotel (3 nights)", price: 1950 },
      ],
      total: 4200,
    },
  },
  {
    category: "racing",
    chat: [
      { role: "user", text: "f1 las vegas night race" },
      { role: "assistant", text: "the strip under the lights! coming from?" },
      { role: "user", text: "los angeles" },
      { role: "assistant", text: "Nov 22nd. the Sphere grandstand has incredible views..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Sphere Grandstand", detail: "Row 5", price: 750, tooltip: "Views of Sphere + strip", isBest: true },
        { icon: Ticket, label: "T-Mobile Zone", detail: "GA", price: 450, tooltip: "General admission, great vibes" },
      ],
      flights: [
        { icon: Plane, label: "LAX → LAS", detail: "Southwest, 1h", price: 89, tooltip: "Quick hop, bags free", isBest: true },
        { icon: Plane, label: "BUR → LAS", detail: "Spirit, 1h 5m", price: 59, tooltip: "Ultra budget option" },
      ],
      hotels: [
        { icon: Hotel, label: "Wynn Las Vegas", detail: "On the circuit", price: 425, tooltip: "4.8★ · Watch from your window", isBest: true },
        { icon: Hotel, label: "The LINQ", detail: "Center strip", price: 185, tooltip: "4.0★ · High Roller views" },
      ],
    },
    summary: {
      event: "Formula 1 Las Vegas Grand Prix",
      venue: "Las Vegas Strip Circuit",
      date: "Nov 22, 2026",
      itinerary: [
        { day: "Nov 21", label: "Vegas arrival", detail: "Check-in + explore" },
        { day: "Nov 22", label: "Race Night", detail: "Green flag @ 10pm" },
        { day: "Nov 23", label: "Recovery", detail: "Brunch + flight home" },
      ],
      breakdown: [
        { label: "Ticket (3-day)", price: 750 },
        { label: "Flight (round trip)", price: 178 },
        { label: "Hotel (2 nights)", price: 850 },
      ],
      total: 1778,
    },
  },
  {
    category: "racing",
    chat: [
      { role: "user", text: "indy 500" },
      { role: "assistant", text: "the greatest spectacle in racing! where from?" },
      { role: "user", text: "chicago" },
      { role: "assistant", text: "May 24th at the Brickyard. easy drive or quick flight..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Turn 1 Grandstand", detail: "Row 28", price: 195, tooltip: "See the first corner action", isBest: true },
        { icon: Ticket, label: "Paddock Infield", detail: "GA", price: 75, tooltip: "Infield access, bring a chair" },
      ],
      flights: [
        { icon: Plane, label: "ORD → IND", detail: "American, 1h", price: 95, tooltip: "Quick flight, small plane", isBest: true },
        { icon: Plane, label: "Drive", detail: "3h 15m", price: 0, tooltip: "Scenic road trip option" },
      ],
      hotels: [
        { icon: Hotel, label: "The Alexander", detail: "Downtown Indy", price: 225, tooltip: "4.5★ · Art-filled boutique", isBest: true },
        { icon: Hotel, label: "JW Marriott Indy", detail: "Convention area", price: 285, tooltip: "4.4★ · Connected to mall" },
      ],
    },
    summary: {
      event: "Indianapolis 500",
      venue: "Indianapolis Motor Speedway",
      date: "May 24, 2026",
      itinerary: [
        { day: "May 23", label: "Carb Day", detail: "Final practice + concerts" },
        { day: "May 24", label: "Race Day", detail: "Green flag @ 12:45pm" },
        { day: "May 25", label: "Drive home", detail: "Victory breakfast" },
      ],
      breakdown: [
        { label: "Ticket (2-day)", price: 195 },
        { label: "Flight (round trip)", price: 190 },
        { label: "Hotel (2 nights)", price: 450 },
      ],
      total: 835,
    },
  },
  {
    category: "racing",
    chat: [
      { role: "user", text: "daytona 500" },
      { role: "assistant", text: "the great american race! flying in?" },
      { role: "user", text: "yeah from atlanta" },
      { role: "assistant", text: "Feb 15th. sprint tower has the best views of the finish line..." },
    ],
    results: {
      tickets: [
        { icon: Ticket, label: "Sprint Tower", detail: "Row 35", price: 275, tooltip: "Finish line + full track view", isBest: true },
        { icon: Ticket, label: "Turn 4 Lower", detail: "Row 15", price: 145, tooltip: "See them come off turn 4" },
      ],
      flights: [
        { icon: Plane, label: "ATL → DAB", detail: "Delta, 1h 15m", price: 125, tooltip: "Direct to Daytona Beach", isBest: true },
        { icon: Plane, label: "ATL → MCO", detail: "Southwest, 1h 20m", price: 98, tooltip: "Orlando, 1hr drive to track" },
      ],
      hotels: [
        { icon: Hotel, label: "Hard Rock Daytona", detail: "Beachfront", price: 245, tooltip: "4.4★ · Guitar-shaped pool", isBest: true },
        { icon: Hotel, label: "Hilton Daytona Beach", detail: "Oceanfront", price: 185, tooltip: "4.2★ · Classic beach hotel" },
      ],
    },
    summary: {
      event: "Daytona 500",
      venue: "Daytona International Speedway",
      date: "Feb 15, 2026",
      itinerary: [
        { day: "Feb 14", label: "Arrive Daytona", detail: "Beach + fan zone" },
        { day: "Feb 15", label: "Race Day", detail: "Green flag @ 2:30pm" },
        { day: "Feb 16", label: "Fly home", detail: "Morning flight" },
      ],
      breakdown: [
        { label: "Ticket", price: 275 },
        { label: "Flight (round trip)", price: 250 },
        { label: "Hotel (2 nights)", price: 490 },
      ],
      total: 1015,
    },
  },
]

// =============================================================================
// Steps Configuration
// =============================================================================

const STEPS = [
  {
    number: "01",
    title: "tell us the event",
    description: "Just type what you want to see — a concert, game, show, or race.",
    icon: MessageSquare,
  },
  {
    number: "02",
    title: "we find everything",
    description: "Tickets, flights, and hotels — all matched to your event dates.",
    icon: Search,
  },
  {
    number: "03",
    title: "book & go",
    description: "Review your trip and book directly. We don't take a cut.",
    icon: Check,
  },
]

// =============================================================================
// Typing Indicator Component
// =============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 rounded-full bg-muted-foreground/40"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  )
}

// =============================================================================
// Chat Demo Component (Enriched)
// =============================================================================

interface ChatDemoProps {
  messages: ChatMessage[]
  isActive: boolean
}

function ChatDemo({ messages, isActive }: ChatDemoProps) {
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [showTyping, setShowTyping] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setVisibleMessages(0)
      setShowTyping(false)
      return
    }

    const timers: NodeJS.Timeout[] = []
    let currentIndex = 0

    const showNextMessage = () => {
      if (currentIndex < messages.length) {
        // Show typing indicator before assistant messages
        if (messages[currentIndex].role === "assistant" && currentIndex > 0) {
          setShowTyping(true)
          timers.push(
            setTimeout(() => {
              setShowTyping(false)
              setVisibleMessages(currentIndex + 1)
              currentIndex++
              timers.push(setTimeout(showNextMessage, 400))
            }, 600)
          )
        } else {
          setVisibleMessages(currentIndex + 1)
          currentIndex++
          timers.push(setTimeout(showNextMessage, 500))
        }
      }
    }

    timers.push(setTimeout(showNextMessage, 200))

    return () => timers.forEach(clearTimeout)
  }, [isActive, messages])

  return (
    <div className="space-y-2.5 max-h-[280px] overflow-hidden">
      <AnimatePresence mode="popLayout">
        {messages.slice(0, visibleMessages).map((msg, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0.7, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex",
              msg.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "px-3.5 py-2.5 rounded-2xl text-sm max-w-[85%]",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {showTyping && (
        <motion.div
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0.5 }}
          transition={{ duration: 0.1 }}
          className="flex justify-start"
        >
          <div className="bg-muted rounded-2xl">
            <TypingIndicator />
          </div>
        </motion.div>
      )}
    </div>
  )
}

// =============================================================================
// Results Demo Component (Enriched)
// =============================================================================

type SearchPhase = "idle" | "searching" | "found"

interface ResultsDemoProps {
  results: HowItWorksExample["results"]
  isActive: boolean
}

function ResultsDemo({ results, isActive }: ResultsDemoProps) {
  const [ticketPhase, setTicketPhase] = useState<SearchPhase>("idle")
  const [flightPhase, setFlightPhase] = useState<SearchPhase>("idle")
  const [hotelPhase, setHotelPhase] = useState<SearchPhase>("idle")

  useEffect(() => {
    if (!isActive) {
      setTicketPhase("idle")
      setFlightPhase("idle")
      setHotelPhase("idle")
      return
    }

    const timers: NodeJS.Timeout[] = []

    // Tickets
    timers.push(setTimeout(() => setTicketPhase("searching"), 100))
    timers.push(setTimeout(() => setTicketPhase("found"), 700))

    // Flights
    timers.push(setTimeout(() => setFlightPhase("searching"), 800))
    timers.push(setTimeout(() => setFlightPhase("found"), 1400))

    // Hotels
    timers.push(setTimeout(() => setHotelPhase("searching"), 1500))
    timers.push(setTimeout(() => setHotelPhase("found"), 2100))

    return () => timers.forEach(clearTimeout)
  }, [isActive])

  const renderSection = (
    icon: typeof Ticket,
    label: string,
    items: ResultOption[],
    phase: SearchPhase
  ) => {
    const Icon = icon
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
          {phase === "searching" && (
            <Loader2 className="w-3 h-3 animate-spin text-primary" />
          )}
          {phase === "found" && (
            <Check className="w-3 h-3 text-green-500" />
          )}
        </div>

        <AnimatePresence mode="wait">
          {phase === "idle" && (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0.5 }}
              className="h-[52px] rounded-lg bg-muted/30"
            />
          )}
          {phase === "searching" && (
            <motion.div
              initial={{ opacity: 0.7 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
              className="h-[52px] rounded-lg bg-muted/50 flex items-center justify-center"
            >
              <span className="text-xs text-muted-foreground">searching...</span>
            </motion.div>
          )}
          {phase === "found" && (
            <motion.div
              initial={{ opacity: 0.7, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-1"
            >
              {items.map((item, idx) => (
                <Tooltip key={idx} delayDuration={100}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg text-xs cursor-help transition-colors",
                        item.isBest
                          ? "bg-primary/10 border border-primary/20"
                          : "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{item.label}</span>
                          {item.isBest && (
                            <Star className="w-3 h-3 text-primary fill-primary" />
                          )}
                        </div>
                        <span className="text-muted-foreground">{item.detail}</span>
                      </div>
                      <span className="font-semibold">${item.price}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs max-w-[180px]">
                    {item.tooltip}
                  </TooltipContent>
                </Tooltip>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {renderSection(Ticket, "tickets", results.tickets, ticketPhase)}
        {renderSection(Plane, "flights", results.flights, flightPhase)}
        {renderSection(Hotel, "hotels", results.hotels, hotelPhase)}
      </div>
    </TooltipProvider>
  )
}

// =============================================================================
// Summary Demo Component (Enriched)
// =============================================================================

interface SummaryDemoProps {
  summary: HowItWorksExample["summary"]
  isActive: boolean
}

function SummaryDemo({ summary, isActive }: SummaryDemoProps) {
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isActive) {
      setShowContent(false)
      return
    }

    const timer = setTimeout(() => setShowContent(true), 150)
    return () => clearTimeout(timer)
  }, [isActive])

  return (
    <motion.div
      initial={{ opacity: 0.9, scale: 0.99 }}
      animate={{
        opacity: showContent ? 1 : 0.9,
        scale: showContent ? 1 : 0.99
      }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border bg-card overflow-hidden"
    >
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-3">
        <div className="flex items-center gap-2 mb-1">
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">trip ready</span>
        </div>
        <div className="font-semibold">{summary.event}</div>
        <div className="text-sm opacity-90">{summary.venue}</div>
      </div>

      {/* Itinerary */}
      <div className="p-3 space-y-2 border-b">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Itinerary
        </div>
        {summary.itinerary.map((day, idx) => (
          <div key={idx} className="flex items-start gap-2.5 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground min-w-[60px]">
              <Calendar className="w-3 h-3" />
              <span>{day.day}</span>
            </div>
            <div>
              <span className="font-medium">{day.label}</span>
              <span className="text-muted-foreground"> · {day.detail}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="p-3">
        <div className="space-y-1.5 mb-3">
          {summary.breakdown.map((item, idx) => (
            <div key={idx} className="flex justify-between text-xs">
              <span className="text-muted-foreground">{item.label}</span>
              <span>${item.price.toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <div className="text-xs text-muted-foreground">estimated total</div>
            <div className="text-lg font-semibold">${summary.total.toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            book this trip
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// Main How It Works Component
// =============================================================================

export function HowItWorks() {
  const [activeCategory, setActiveCategory] = useState<Category>("concerts")
  const [activeStep, setActiveStep] = useState(0)
  const [currentExample, setCurrentExample] = useState<HowItWorksExample>(
    () => EXAMPLES.find(e => e.category === "concerts")!
  )
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)

  // Get examples for current category
  const categoryExamples = EXAMPLES.filter(e => e.category === activeCategory)

  // Intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: "50px 0px 0px 0px" }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  // Auto-cycle through steps
  useEffect(() => {
    if (!isInView) return

    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length)
    }, 5000) // 5 seconds per step for richer content

    return () => clearInterval(interval)
  }, [isInView])

  // Handle category change
  function handleCategoryChange(category: Category) {
    if (category === activeCategory) return
    setActiveCategory(category)
    const examples = EXAMPLES.filter(e => e.category === category)
    setCurrentExample(examples[Math.floor(Math.random() * examples.length)])
    setActiveStep(0)
  }

  // Cycle to new example when completing all steps
  useEffect(() => {
    if (activeStep === 0 && isInView) {
      // Pick a new random example from the category
      const newExample = categoryExamples[Math.floor(Math.random() * categoryExamples.length)]
      if (newExample.chat[0].text !== currentExample.chat[0].text) {
        setCurrentExample(newExample)
      }
    }
  }, [activeStep, isInView, activeCategory])

  return (
    <section ref={sectionRef} id="how-it-works" className="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3 lowercase">
            how it works
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6">
            From idea to itinerary in minutes
          </p>

          {/* Category Filters */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-start">
          {/* Left: Step List */}
          <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
            {STEPS.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={cn(
                  "w-full text-left p-3 sm:p-4 rounded-2xl transition-all duration-300 active:scale-[0.98]",
                  activeStep === index ? "bg-muted" : "hover:bg-muted/50"
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={cn(
                      "w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors duration-300 flex-shrink-0",
                      activeStep === index
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/10 text-muted-foreground"
                    )}
                  >
                    {step.number}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm sm:text-base mb-0.5 sm:mb-1 lowercase">
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        "text-xs sm:text-sm transition-all duration-300",
                        activeStep === index
                          ? "text-muted-foreground"
                          : "text-muted-foreground/60"
                      )}
                    >
                      {step.description}
                    </p>
                  </div>

                  <ArrowRight
                    className={cn(
                      "w-4 h-4 mt-0.5 transition-all duration-300 flex-shrink-0 hidden sm:block",
                      activeStep === index
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Right: Demo Preview */}
          <div className="relative order-1 lg:order-2">
            <div className="bg-card border rounded-2xl p-4 sm:p-6 min-h-[320px] sm:min-h-[400px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* Chat Demo */}
                {activeStep === 0 && (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1"
                  >
                    <ChatDemo
                      messages={currentExample.chat}
                      isActive={activeStep === 0}
                    />
                  </motion.div>
                )}

                {/* Results Demo */}
                {activeStep === 1 && (
                  <motion.div
                    key="results"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1"
                  >
                    <ResultsDemo
                      results={currentExample.results}
                      isActive={activeStep === 1}
                    />
                  </motion.div>
                )}

                {/* Summary Demo */}
                {activeStep === 2 && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0.9 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.5 }}
                    transition={{ duration: 0.15 }}
                    className="flex-1"
                  >
                    <SummaryDemo
                      summary={currentExample.summary}
                      isActive={activeStep === 2}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2 mt-4">
              {STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    activeStep === index
                      ? "w-8 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Compact Version (for smaller spaces)
// =============================================================================

export function HowItWorksCompact() {
  return (
    <section className="py-12 sm:py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center text-lg sm:text-xl font-semibold mb-8 sm:mb-12 lowercase">
          how it works
        </h2>

        <div className="grid grid-cols-3 gap-4 sm:gap-8">
          {STEPS.map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-xs sm:text-sm mb-1 lowercase">
                {step.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// =============================================================================
// Inline Version (horizontal, minimal)
// =============================================================================

export function HowItWorksInline() {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8 py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">
          1
        </span>
        <span className="hidden sm:inline">tell us the event</span>
        <span className="sm:hidden">event</span>
      </div>
      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">
          2
        </span>
        <span className="hidden sm:inline">we find everything</span>
        <span className="sm:hidden">search</span>
      </div>
      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-medium">
          3
        </span>
        <span className="hidden sm:inline">book & go</span>
        <span className="sm:hidden">book</span>
      </div>
    </div>
  )
}
