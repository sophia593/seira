"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import {
  Ticket,
  Plane,
  Hotel,
  MapPin,
  Calendar,
  ArrowRight,
  Check,
  Loader2,
  Music,
  Trophy,
  Theater,
  Flag,
  Shuffle
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

interface EventExample {
  query: string
  event: string
  venue: string
  date: string
  ticket: number
  flight: number
  hotel: number
  ticketDetail: string
  flightDetail: string
  hotelDetail: string
}

type Category = "concerts" | "sports" | "theater" | "racing"

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
// Example Tags (clickable quick prompts)
// =============================================================================

const EXAMPLE_TAGS = [
  { label: "taylor swift", prompt: "taylor swift eras tour" },
  { label: "lakers game", prompt: "lakers games in los angeles" },
  { label: "coachella", prompt: "coachella 2026 weekend 1" },
  { label: "f1 miami", prompt: "formula 1 miami grand prix" },
  { label: "hamilton", prompt: "hamilton on broadway" },
  { label: "ufc", prompt: "ufc fights in las vegas" },
]

// =============================================================================
// Concert Examples (30)
// =============================================================================

const CONCERTS: EventExample[] = [
  { query: "taylor swift eras tour in LA", event: "The Eras Tour", venue: "SoFi Stadium, Los Angeles", date: "Aug 7, 2026", ticket: 450, flight: 289, hotel: 180, ticketDetail: "Lower Bowl Sec 118", flightDetail: "JFK → LAX, Delta, 5h 30m", hotelDetail: "JW Marriott LA Live, 4.5★" },
  { query: "beyoncé renaissance tour miami", event: "Renaissance World Tour", venue: "Hard Rock Stadium, Miami", date: "Jul 15, 2026", ticket: 380, flight: 195, hotel: 220, ticketDetail: "Floor Seats Row 15", flightDetail: "ATL → MIA, Delta, 1h 45m", hotelDetail: "Fontainebleau Miami, 4.7★" },
  { query: "bad bunny in san juan", event: "Most Wanted Tour", venue: "Coliseo de Puerto Rico", date: "Dec 5, 2026", ticket: 275, flight: 320, hotel: 165, ticketDetail: "GA Floor Standing", flightDetail: "MIA → SJU, JetBlue, 2h 30m", hotelDetail: "La Concha Resort, 4.4★" },
  { query: "drake concert in toronto", event: "It's All A Blur Tour", venue: "Scotiabank Arena, Toronto", date: "Sep 12, 2026", ticket: 295, flight: 180, hotel: 195, ticketDetail: "Section 108 Row 12", flightDetail: "NYC → YYZ, Air Canada, 1h 30m", hotelDetail: "Fairmont Royal York, 4.6★" },
  { query: "the weeknd in vegas", event: "After Hours Til Dawn", venue: "Allegiant Stadium, Las Vegas", date: "Oct 20, 2026", ticket: 340, flight: 145, hotel: 175, ticketDetail: "Lower Level Sec 134", flightDetail: "LAX → LAS, Southwest, 1h", hotelDetail: "Wynn Las Vegas, 4.8★" },
  { query: "billie eilish at msg", event: "Hit Me Hard and Soft Tour", venue: "Madison Square Garden, NYC", date: "Mar 8, 2026", ticket: 265, flight: 0, hotel: 280, ticketDetail: "200 Level Sec 210", flightDetail: "Local - No flight needed", hotelDetail: "The Standard High Line, 4.3★" },
  { query: "kendrick lamar in compton", event: "The Big Steppers Tour", venue: "Crypto.com Arena, LA", date: "Jun 22, 2026", ticket: 310, flight: 275, hotel: 190, ticketDetail: "Premier Seats Row 8", flightDetail: "SFO → LAX, United, 1h 20m", hotelDetail: "InterContinental DTLA, 4.5★" },
  { query: "sza concert in atlanta", event: "SOS Tour", venue: "State Farm Arena, Atlanta", date: "Apr 18, 2026", ticket: 185, flight: 165, hotel: 145, ticketDetail: "Section 102 Row 20", flightDetail: "DCA → ATL, Delta, 1h 45m", hotelDetail: "W Atlanta Midtown, 4.4★" },
  { query: "harry styles in london", event: "Love On Tour", venue: "Wembley Stadium, London", date: "Jul 1, 2026", ticket: 420, flight: 580, hotel: 310, ticketDetail: "Pitch Standing GA", flightDetail: "JFK → LHR, British Airways, 7h", hotelDetail: "The Londoner, 4.6★" },
  { query: "coldplay concert seattle", event: "Music of the Spheres", venue: "Lumen Field, Seattle", date: "Aug 25, 2026", ticket: 225, flight: 210, hotel: 175, ticketDetail: "Field Level Sec A4", flightDetail: "DEN → SEA, Alaska, 2h 45m", hotelDetail: "Thompson Seattle, 4.5★" },
  { query: "ed sheeran in nashville", event: "Mathematics Tour", venue: "Nissan Stadium, Nashville", date: "May 30, 2026", ticket: 195, flight: 155, hotel: 165, ticketDetail: "Lower Bowl Sec 111", flightDetail: "ORD → BNA, American, 1h 40m", hotelDetail: "The Hermitage Hotel, 4.7★" },
  { query: "adele residency vegas", event: "Weekends With Adele", venue: "The Colosseum, Caesars Palace", date: "Nov 15, 2026", ticket: 680, flight: 175, hotel: 245, ticketDetail: "Orchestra Center Row 10", flightDetail: "PHX → LAS, Southwest, 1h", hotelDetail: "Caesars Palace, 4.5★" },
  { query: "bruno mars in honolulu", event: "24K Magic World Tour", venue: "Aloha Stadium, Honolulu", date: "Feb 14, 2026", ticket: 355, flight: 420, hotel: 285, ticketDetail: "VIP Package Sec 101", flightDetail: "LAX → HNL, Hawaiian, 5h 30m", hotelDetail: "The Royal Hawaiian, 4.6★" },
  { query: "dua lipa concert chicago", event: "Future Nostalgia Tour", venue: "United Center, Chicago", date: "Jun 5, 2026", ticket: 175, flight: 145, hotel: 185, ticketDetail: "100 Level Sec 119", flightDetail: "DTW → ORD, United, 1h", hotelDetail: "The Langham Chicago, 4.7★" },
  { query: "post malone in dallas", event: "Twelve Carat Tour", venue: "AT&T Stadium, Dallas", date: "Sep 28, 2026", ticket: 165, flight: 190, hotel: 140, ticketDetail: "Club Level Row 5", flightDetail: "MSP → DFW, American, 2h 30m", hotelDetail: "The Joule Dallas, 4.5★" },
  { query: "lady gaga in paris", event: "Chromatica Ball", venue: "Stade de France, Paris", date: "Jul 20, 2026", ticket: 390, flight: 620, hotel: 340, ticketDetail: "Fosse Or Standing", flightDetail: "JFK → CDG, Air France, 7h 30m", hotelDetail: "Le Bristol Paris, 4.8★" },
  { query: "travis scott in houston", event: "Utopia Tour", venue: "NRG Stadium, Houston", date: "Nov 8, 2026", ticket: 285, flight: 175, hotel: 135, ticketDetail: "Floor GA Wristband", flightDetail: "DEN → IAH, United, 2h 30m", hotelDetail: "Hotel Granduca, 4.6★" },
  { query: "olivia rodrigo in boston", event: "GUTS World Tour", venue: "TD Garden, Boston", date: "Apr 5, 2026", ticket: 195, flight: 125, hotel: 225, ticketDetail: "Loge Sec 12 Row 8", flightDetail: "DCA → BOS, JetBlue, 1h 30m", hotelDetail: "Four Seasons Boston, 4.7★" },
  { query: "morgan wallen nashville", event: "One Night At A Time", venue: "Nissan Stadium, Nashville", date: "Jun 15, 2026", ticket: 245, flight: 155, hotel: 175, ticketDetail: "Lower Bowl Sec 105", flightDetail: "CLT → BNA, American, 1h 15m", hotelDetail: "The Joseph Nashville, 4.6★" },
  { query: "rihanna super bowl halftime", event: "Super Bowl Halftime", venue: "State Farm Stadium, Phoenix", date: "Feb 9, 2026", ticket: 2800, flight: 285, hotel: 450, ticketDetail: "Lower Level Sec 128", flightDetail: "LAX → PHX, Southwest, 1h 15m", hotelDetail: "The Phoenician, 4.8★" },
  { query: "justin timberlake in memphis", event: "The Forget Tomorrow Tour", venue: "FedExForum, Memphis", date: "May 10, 2026", ticket: 225, flight: 180, hotel: 125, ticketDetail: "Terrace Level Row 3", flightDetail: "ATL → MEM, Delta, 1h 20m", hotelDetail: "The Peabody Memphis, 4.5★" },
  { query: "arctic monkeys in manchester", event: "The Car Tour", venue: "Emirates Old Trafford, Manchester", date: "Jun 28, 2026", ticket: 165, flight: 540, hotel: 195, ticketDetail: "Standing GA", flightDetail: "JFK → MAN, Virgin Atlantic, 7h", hotelDetail: "The Midland Hotel, 4.4★" },
  { query: "tyler the creator in la", event: "Call Me If You Get Lost Tour", venue: "The Forum, Los Angeles", date: "Oct 31, 2026", ticket: 195, flight: 265, hotel: 175, ticketDetail: "Floor Sec 2 Row 15", flightDetail: "SEA → LAX, Alaska, 2h 30m", hotelDetail: "The LINE LA, 4.3★" },
  { query: "the 1975 in philadelphia", event: "Still At Their Very Best", venue: "Wells Fargo Center, Philadelphia", date: "Mar 22, 2026", ticket: 145, flight: 95, hotel: 165, ticketDetail: "Lower Level Sec 108", flightDetail: "BOS → PHL, JetBlue, 1h 15m", hotelDetail: "The Rittenhouse Hotel, 4.6★" },
  { query: "lana del rey in san francisco", event: "Norman Rockwell Tour", venue: "Chase Center, San Francisco", date: "Aug 12, 2026", ticket: 210, flight: 185, hotel: 245, ticketDetail: "Lower Bowl Sec 110", flightDetail: "PDX → SFO, Alaska, 1h 30m", hotelDetail: "Palace Hotel SF, 4.5★" },
  { query: "metallica in phoenix", event: "M72 World Tour", venue: "State Farm Stadium, Phoenix", date: "Sep 5, 2026", ticket: 275, flight: 165, hotel: 155, ticketDetail: "Snake Pit Package", flightDetail: "DEN → PHX, Southwest, 1h 45m", hotelDetail: "Arizona Biltmore, 4.6★" },
  { query: "foo fighters in denver", event: "Everything Or Nothing Tour", venue: "Empower Field, Denver", date: "Jul 8, 2026", ticket: 185, flight: 195, hotel: 165, ticketDetail: "Field Level Sec 120", flightDetail: "ORD → DEN, United, 2h 30m", hotelDetail: "The Crawford Hotel, 4.5★" },
  { query: "imagine dragons in salt lake", event: "Loom World Tour", venue: "Rice-Eccles Stadium, Salt Lake City", date: "Aug 1, 2026", ticket: 145, flight: 175, hotel: 125, ticketDetail: "Lower Bowl Sec 35", flightDetail: "LAX → SLC, Delta, 1h 45m", hotelDetail: "Grand America Hotel, 4.7★" },
  { query: "red hot chili peppers san diego", event: "Unlimited Love Tour", venue: "Petco Park, San Diego", date: "May 25, 2026", ticket: 195, flight: 145, hotel: 175, ticketDetail: "Field Box Sec 3", flightDetail: "SFO → SAN, Southwest, 1h 20m", hotelDetail: "Pendry San Diego, 4.6★" },
  { query: "blink-182 reunion tour anaheim", event: "One More Time Tour", venue: "Honda Center, Anaheim", date: "Apr 28, 2026", ticket: 225, flight: 275, hotel: 165, ticketDetail: "Lower Level Sec 215", flightDetail: "SEA → SNA, Alaska, 2h 30m", hotelDetail: "The Westin Anaheim, 4.4★" },
]

// =============================================================================
// Sports Examples (30)
// =============================================================================

const SPORTS: EventExample[] = [
  { query: "lakers vs celtics in boston", event: "NBA Regular Season", venue: "TD Garden, Boston", date: "Feb 14, 2026", ticket: 320, flight: 245, hotel: 210, ticketDetail: "Loge Sec 1 Row 12", flightDetail: "LAX → BOS, JetBlue, 5h 15m", hotelDetail: "Four Seasons Boston, 4.7★" },
  { query: "super bowl in new orleans", event: "Super Bowl LX", venue: "Caesars Superdome, New Orleans", date: "Feb 8, 2026", ticket: 4500, flight: 285, hotel: 380, ticketDetail: "Lower Level Sec 129", flightDetail: "DFW → MSY, American, 1h 30m", hotelDetail: "The Roosevelt New Orleans, 4.6★" },
  { query: "warriors vs nuggets playoffs", event: "NBA Western Conference Finals", venue: "Chase Center, San Francisco", date: "May 20, 2026", ticket: 485, flight: 195, hotel: 275, ticketDetail: "Lower Bowl Sec 108", flightDetail: "DEN → SFO, United, 2h 30m", hotelDetail: "St. Regis San Francisco, 4.8★" },
  { query: "yankees vs red sox at fenway", event: "MLB Regular Season", venue: "Fenway Park, Boston", date: "Jul 4, 2026", ticket: 175, flight: 125, hotel: 225, ticketDetail: "Green Monster Sec M4", flightDetail: "LGA → BOS, Delta Shuttle, 1h", hotelDetail: "The Newbury Boston, 4.5★" },
  { query: "cowboys vs eagles in philly", event: "NFL Monday Night Football", venue: "Lincoln Financial Field, Philadelphia", date: "Nov 16, 2026", ticket: 295, flight: 165, hotel: 185, ticketDetail: "Lower Level Sec 124", flightDetail: "DFW → PHL, American, 3h", hotelDetail: "The Rittenhouse Hotel, 4.6★" },
  { query: "chiefs at raiders in vegas", event: "NFL AFC West Showdown", venue: "Allegiant Stadium, Las Vegas", date: "Nov 22, 2026", ticket: 385, flight: 175, hotel: 195, ticketDetail: "Club Level Sec C220", flightDetail: "MCI → LAS, Southwest, 2h 45m", hotelDetail: "Encore at Wynn, 4.8★" },
  { query: "dodgers world series game", event: "World Series Game 1", venue: "Dodger Stadium, Los Angeles", date: "Oct 25, 2026", ticket: 650, flight: 285, hotel: 245, ticketDetail: "Dugout Club Row 3", flightDetail: "JFK → LAX, JetBlue, 5h 30m", hotelDetail: "The West Hollywood Edition, 4.6★" },
  { query: "wimbledon mens final", event: "Wimbledon Championships Final", venue: "Centre Court, London", date: "Jul 12, 2026", ticket: 1200, flight: 680, hotel: 420, ticketDetail: "Debenture Seat Row 15", flightDetail: "JFK → LHR, British Airways, 7h", hotelDetail: "The Savoy London, 4.9★" },
  { query: "us open tennis finals", event: "US Open Men's Final", venue: "Arthur Ashe Stadium, NYC", date: "Sep 13, 2026", ticket: 485, flight: 0, hotel: 295, ticketDetail: "Promenade Sec 302", flightDetail: "Local - No flight needed", hotelDetail: "The William Vale, 4.5★" },
  { query: "masters golf tournament", event: "The Masters", venue: "Augusta National, Georgia", date: "Apr 10, 2026", ticket: 375, flight: 195, hotel: 285, ticketDetail: "Thursday Practice Round", flightDetail: "CLT → AGS, American, 45m", hotelDetail: "The Partridge Inn, 4.4★" },
  { query: "nba all star game in san francisco", event: "NBA All-Star Weekend", venue: "Chase Center, San Francisco", date: "Feb 15, 2026", ticket: 850, flight: 225, hotel: 295, ticketDetail: "Lower Bowl Sec 118", flightDetail: "ORD → SFO, United, 4h 15m", hotelDetail: "Palace Hotel SF, 4.5★" },
  { query: "nhl stanley cup finals", event: "Stanley Cup Final Game 7", venue: "Madison Square Garden, NYC", date: "Jun 15, 2026", ticket: 725, flight: 165, hotel: 310, ticketDetail: "100 Level Sec 105", flightDetail: "BOS → LGA, Delta Shuttle, 1h", hotelDetail: "The Plaza Hotel, 4.7★" },
  { query: "el clasico in madrid", event: "Real Madrid vs Barcelona", venue: "Santiago Bernabéu, Madrid", date: "Oct 26, 2026", ticket: 450, flight: 620, hotel: 280, ticketDetail: "Lateral Este Row 25", flightDetail: "JFK → MAD, Iberia, 7h 30m", hotelDetail: "The Westin Palace Madrid, 4.6★" },
  { query: "manchester united vs liverpool", event: "Premier League", venue: "Old Trafford, Manchester", date: "Mar 15, 2026", ticket: 285, flight: 540, hotel: 195, ticketDetail: "Stretford End Tier 2", flightDetail: "JFK → MAN, Virgin Atlantic, 7h", hotelDetail: "The Lowry Hotel, 4.5★" },
  { query: "miami heat playoff game", event: "NBA Eastern Conference Semis", venue: "Kaseya Center, Miami", date: "May 8, 2026", ticket: 275, flight: 185, hotel: 235, ticketDetail: "Lower Bowl Sec 113", flightDetail: "ATL → MIA, Delta, 1h 45m", hotelDetail: "Faena Miami Beach, 4.7★" },
  { query: "packers vs bears at lambeau", event: "NFL NFC North Rivalry", venue: "Lambeau Field, Green Bay", date: "Dec 6, 2026", ticket: 245, flight: 165, hotel: 145, ticketDetail: "Lower Bowl Sec 110", flightDetail: "ORD → GRB, United, 1h", hotelDetail: "Lodge Kohler, 4.4★" },
  { query: "march madness final four", event: "NCAA Final Four", venue: "Lucas Oil Stadium, Indianapolis", date: "Apr 4, 2026", ticket: 425, flight: 155, hotel: 195, ticketDetail: "Lower Level Sec 142", flightDetail: "DEN → IND, United, 2h 45m", hotelDetail: "Conrad Indianapolis, 4.6★" },
  { query: "college football championship", event: "CFP National Championship", venue: "Mercedes-Benz Stadium, Atlanta", date: "Jan 12, 2026", ticket: 575, flight: 175, hotel: 185, ticketDetail: "Club Level Sec C126", flightDetail: "DFW → ATL, Delta, 2h", hotelDetail: "The St. Regis Atlanta, 4.7★" },
  { query: "ufc 300 in vegas", event: "UFC 300", venue: "T-Mobile Arena, Las Vegas", date: "Apr 13, 2026", ticket: 425, flight: 175, hotel: 195, ticketDetail: "Lower Bowl Sec 17", flightDetail: "LAX → LAS, Southwest, 1h", hotelDetail: "MGM Grand, 4.4★" },
  { query: "conor mcgregor fight in dublin", event: "UFC Fight Night Dublin", venue: "3Arena, Dublin", date: "Sep 20, 2026", ticket: 385, flight: 580, hotel: 245, ticketDetail: "Floor Sec A Row 8", flightDetail: "JFK → DUB, Aer Lingus, 6h 30m", hotelDetail: "The Merrion Hotel, 4.8★" },
  { query: "pga championship at valhalla", event: "PGA Championship", venue: "Valhalla Golf Club, Louisville", date: "May 15, 2026", ticket: 195, flight: 165, hotel: 155, ticketDetail: "Weekly Grounds Pass", flightDetail: "ORD → SDF, American, 1h 15m", hotelDetail: "The Brown Hotel, 4.5★" },
  { query: "kentucky derby churchill downs", event: "Kentucky Derby", venue: "Churchill Downs, Louisville", date: "May 2, 2026", ticket: 325, flight: 165, hotel: 245, ticketDetail: "Section 111 Box Seat", flightDetail: "ATL → SDF, Delta, 1h 15m", hotelDetail: "21c Museum Hotel, 4.6★" },
  { query: "world cup final qatar", event: "FIFA World Cup Final", venue: "Lusail Stadium, Qatar", date: "Dec 18, 2026", ticket: 1850, flight: 1200, hotel: 480, ticketDetail: "Category 1 Midfield", flightDetail: "JFK → DOH, Qatar Airways, 13h", hotelDetail: "Mondrian Doha, 4.7★" },
  { query: "messi inter miami game", event: "MLS Regular Season", venue: "DRV PNK Stadium, Fort Lauderdale", date: "Jun 8, 2026", ticket: 245, flight: 185, hotel: 195, ticketDetail: "Supporters Section", flightDetail: "ATL → FLL, Spirit, 1h 45m", hotelDetail: "W Fort Lauderdale, 4.5★" },
  { query: "boxing canelo vs crawford", event: "Undisputed Championship", venue: "T-Mobile Arena, Las Vegas", date: "Sep 14, 2026", ticket: 550, flight: 175, hotel: 225, ticketDetail: "Lower Level Sec 8", flightDetail: "DFW → LAS, Southwest, 2h 45m", hotelDetail: "Bellagio Las Vegas, 4.7★" },
  { query: "ryder cup in ireland", event: "Ryder Cup 2027", venue: "Adare Manor, Limerick", date: "Sep 24, 2027", ticket: 485, flight: 620, hotel: 380, ticketDetail: "Friday Grounds Pass", flightDetail: "JFK → SNN, Aer Lingus, 6h 30m", hotelDetail: "Adare Manor, 4.9★" },
  { query: "knicks vs nets at barclays", event: "NBA Battle of NYC", venue: "Barclays Center, Brooklyn", date: "Dec 25, 2026", ticket: 385, flight: 0, hotel: 275, ticketDetail: "Lower Bowl Sec 25", flightDetail: "Local - No flight needed", hotelDetail: "1 Hotel Brooklyn Bridge, 4.6★" },
  { query: "bills vs dolphins in miami", event: "NFL AFC East Matchup", venue: "Hard Rock Stadium, Miami", date: "Oct 18, 2026", ticket: 225, flight: 195, hotel: 215, ticketDetail: "Lower Level Sec 147", flightDetail: "BUF → MIA, JetBlue, 3h 15m", hotelDetail: "Nobu Hotel Miami Beach, 4.6★" },
  { query: "cubs vs cardinals at wrigley", event: "MLB Rivalry Series", venue: "Wrigley Field, Chicago", date: "Jun 21, 2026", ticket: 145, flight: 155, hotel: 195, ticketDetail: "Bleacher Sec 311", flightDetail: "STL → ORD, Southwest, 1h", hotelDetail: "The Gwen Chicago, 4.5★" },
  { query: "celtics championship parade", event: "NBA Championship Celebration", venue: "Downtown Boston", date: "Jun 20, 2026", ticket: 0, flight: 145, hotel: 265, ticketDetail: "Free Public Event", flightDetail: "LGA → BOS, Delta Shuttle, 1h", hotelDetail: "The Liberty Hotel, 4.5★" },
]

// =============================================================================
// Theater Examples (30)
// =============================================================================

const THEATER: EventExample[] = [
  { query: "hamilton on broadway nyc", event: "Hamilton", venue: "Richard Rodgers Theatre, NYC", date: "Mar 15, 2026", ticket: 350, flight: 199, hotel: 280, ticketDetail: "Orchestra Center Row J", flightDetail: "ORD → LGA, American, 2h 15m", hotelDetail: "The Knickerbocker, 4.5★" },
  { query: "wicked in london west end", event: "Wicked", venue: "Apollo Victoria Theatre, London", date: "Apr 22, 2026", ticket: 185, flight: 580, hotel: 295, ticketDetail: "Stalls Row G", flightDetail: "JFK → LHR, British Airways, 7h", hotelDetail: "The Savoy, 4.9★" },
  { query: "phantom of the opera final show", event: "The Phantom of the Opera", venue: "His Majesty's Theatre, London", date: "Jun 5, 2026", ticket: 225, flight: 580, hotel: 275, ticketDetail: "Royal Circle Row A", flightDetail: "BOS → LHR, Virgin Atlantic, 6h 45m", hotelDetail: "The Langham London, 4.8★" },
  { query: "lion king broadway tickets", event: "The Lion King", venue: "Minskoff Theatre, NYC", date: "Jul 18, 2026", ticket: 195, flight: 175, hotel: 265, ticketDetail: "Mezzanine Center Row B", flightDetail: "MIA → JFK, JetBlue, 3h", hotelDetail: "The Beekman, 4.6★" },
  { query: "moulin rouge musical nyc", event: "Moulin Rouge! The Musical", venue: "Al Hirschfeld Theatre, NYC", date: "Feb 28, 2026", ticket: 275, flight: 145, hotel: 285, ticketDetail: "Orchestra Row H", flightDetail: "DCA → LGA, Delta Shuttle, 1h", hotelDetail: "Lotte New York Palace, 4.7★" },
  { query: "les miserables west end", event: "Les Misérables", venue: "Sondheim Theatre, London", date: "Aug 10, 2026", ticket: 165, flight: 540, hotel: 255, ticketDetail: "Dress Circle Row C", flightDetail: "LAX → LHR, American, 10h 30m", hotelDetail: "Rosewood London, 4.8★" },
  { query: "six the musical chicago", event: "SIX", venue: "CIBC Theatre, Chicago", date: "May 5, 2026", ticket: 125, flight: 165, hotel: 185, ticketDetail: "Orchestra Row L", flightDetail: "DEN → ORD, United, 2h 30m", hotelDetail: "The Peninsula Chicago, 4.8★" },
  { query: "beetlejuice broadway nyc", event: "Beetlejuice", venue: "Marquis Theatre, NYC", date: "Oct 31, 2026", ticket: 185, flight: 195, hotel: 275, ticketDetail: "Orchestra Row K", flightDetail: "ATL → JFK, Delta, 2h 15m", hotelDetail: "The Plaza Hotel, 4.7★" },
  { query: "dear evan hansen in la", event: "Dear Evan Hansen", venue: "Ahmanson Theatre, Los Angeles", date: "Mar 20, 2026", ticket: 145, flight: 265, hotel: 195, ticketDetail: "Orchestra Center Row M", flightDetail: "SFO → LAX, United, 1h 20m", hotelDetail: "The NoMad Los Angeles, 4.5★" },
  { query: "book of mormon london", event: "The Book of Mormon", venue: "Prince of Wales Theatre, London", date: "Jun 15, 2026", ticket: 175, flight: 560, hotel: 285, ticketDetail: "Stalls Row H", flightDetail: "EWR → LHR, United, 7h", hotelDetail: "Claridge's, 4.9★" },
  { query: "chicago the musical nyc", event: "Chicago", venue: "Ambassador Theatre, NYC", date: "Apr 8, 2026", ticket: 155, flight: 135, hotel: 255, ticketDetail: "Orchestra Row G", flightDetail: "PHL → LGA, American, 1h", hotelDetail: "The Mark Hotel, 4.8★" },
  { query: "aladdin broadway show", event: "Aladdin", venue: "New Amsterdam Theatre, NYC", date: "Dec 22, 2026", ticket: 175, flight: 185, hotel: 295, ticketDetail: "Orchestra Row J", flightDetail: "CLT → JFK, American, 2h", hotelDetail: "The Ritz-Carlton NYC, 4.8★" },
  { query: "come from away toronto", event: "Come From Away", venue: "Royal Alexandra Theatre, Toronto", date: "Sep 8, 2026", ticket: 125, flight: 155, hotel: 175, ticketDetail: "Orchestra Center Row K", flightDetail: "ORD → YYZ, Air Canada, 1h 30m", hotelDetail: "Shangri-La Toronto, 4.7★" },
  { query: "hadestown broadway tickets", event: "Hadestown", venue: "Walter Kerr Theatre, NYC", date: "Feb 14, 2026", ticket: 195, flight: 165, hotel: 275, ticketDetail: "Orchestra Row E", flightDetail: "BOS → LGA, JetBlue, 1h 15m", hotelDetail: "The Ludlow Hotel, 4.4★" },
  { query: "mamma mia london show", event: "Mamma Mia!", venue: "Novello Theatre, London", date: "Jul 25, 2026", ticket: 145, flight: 545, hotel: 245, ticketDetail: "Stalls Row F", flightDetail: "JFK → LGW, Norse Atlantic, 7h 15m", hotelDetail: "The Corinthia London, 4.8★" },
  { query: "jersey boys las vegas", event: "Jersey Boys", venue: "Orleans Hotel and Casino, Las Vegas", date: "Nov 12, 2026", ticket: 95, flight: 145, hotel: 125, ticketDetail: "Orchestra Row H", flightDetail: "PHX → LAS, Southwest, 1h", hotelDetail: "The Venetian, 4.6★" },
  { query: "to kill a mockingbird broadway", event: "To Kill a Mockingbird", venue: "Belasco Theatre, NYC", date: "May 18, 2026", ticket: 185, flight: 155, hotel: 265, ticketDetail: "Orchestra Row D", flightDetail: "DCA → LGA, Delta Shuttle, 1h", hotelDetail: "The Chatwal, 4.6★" },
  { query: "the notebook musical on broadway", event: "The Notebook", venue: "Gerald Schoenfeld Theatre, NYC", date: "Aug 22, 2026", ticket: 225, flight: 195, hotel: 275, ticketDetail: "Orchestra Center Row F", flightDetail: "MSP → JFK, Delta, 3h", hotelDetail: "Park Hyatt New York, 4.7★" },
  { query: "matilda the musical west end", event: "Matilda The Musical", venue: "Cambridge Theatre, London", date: "Apr 5, 2026", ticket: 135, flight: 520, hotel: 235, ticketDetail: "Dress Circle Row B", flightDetail: "BOS → LHR, JetBlue, 6h 45m", hotelDetail: "The Ned London, 4.6★" },
  { query: "mrs doubtfire broadway show", event: "Mrs. Doubtfire", venue: "Stephen Sondheim Theatre, NYC", date: "Jun 28, 2026", ticket: 145, flight: 175, hotel: 255, ticketDetail: "Orchestra Row L", flightDetail: "MIA → LGA, Delta, 3h", hotelDetail: "The Carlyle, 4.8★" },
  { query: "back to the future london", event: "Back to the Future: The Musical", venue: "Adelphi Theatre, London", date: "Sep 15, 2026", ticket: 155, flight: 555, hotel: 265, ticketDetail: "Stalls Row E", flightDetail: "IAD → LHR, United, 7h 30m", hotelDetail: "The Connaught, 4.9★" },
  { query: "frozen broadway show nyc", event: "Frozen", venue: "St. James Theatre, NYC", date: "Dec 18, 2026", ticket: 195, flight: 185, hotel: 285, ticketDetail: "Orchestra Row H", flightDetail: "DEN → JFK, JetBlue, 4h", hotelDetail: "The London NYC, 4.6★" },
  { query: "harry potter cursed child london", event: "Harry Potter and the Cursed Child", venue: "Palace Theatre, London", date: "Oct 10, 2026", ticket: 245, flight: 565, hotel: 285, ticketDetail: "Stalls Row G", flightDetail: "JFK → LHR, British Airways, 7h", hotelDetail: "Bulgari Hotel London, 4.8★" },
  { query: "waitress musical tour la", event: "Waitress", venue: "Pantages Theatre, Los Angeles", date: "Mar 8, 2026", ticket: 115, flight: 245, hotel: 175, ticketDetail: "Orchestra Row N", flightDetail: "SEA → LAX, Alaska, 2h 30m", hotelDetail: "Hotel Figueroa, 4.4★" },
  { query: "company broadway revival", event: "Company", venue: "Bernard B. Jacobs Theatre, NYC", date: "May 25, 2026", ticket: 175, flight: 155, hotel: 265, ticketDetail: "Orchestra Row F", flightDetail: "BOS → LGA, JetBlue, 1h 15m", hotelDetail: "The Greenwich Hotel, 4.7★" },
  { query: "mean girls broadway show", event: "Mean Girls", venue: "August Wilson Theatre, NYC", date: "Jul 12, 2026", ticket: 165, flight: 175, hotel: 255, ticketDetail: "Orchestra Row J", flightDetail: "ORD → LGA, American, 2h 15m", hotelDetail: "The Quin, 4.5★" },
  { query: "the play that goes wrong london", event: "The Play That Goes Wrong", venue: "Duchess Theatre, London", date: "Nov 5, 2026", ticket: 85, flight: 495, hotel: 215, ticketDetail: "Stalls Row C", flightDetail: "BOS → LGW, Norse Atlantic, 6h 45m", hotelDetail: "The Hoxton Holborn, 4.3★" },
  { query: "newsies tour in boston", event: "Newsies", venue: "Boston Opera House, Boston", date: "Feb 22, 2026", ticket: 125, flight: 145, hotel: 195, ticketDetail: "Orchestra Row K", flightDetail: "DCA → BOS, JetBlue, 1h 30m", hotelDetail: "The Envoy Hotel, 4.4★" },
  { query: "rent broadway anniversary", event: "RENT 30th Anniversary", venue: "Nederlander Theatre, NYC", date: "Apr 29, 2026", ticket: 195, flight: 165, hotel: 265, ticketDetail: "Orchestra Center Row E", flightDetail: "ATL → JFK, Delta, 2h 15m", hotelDetail: "The Bowery Hotel, 4.5★" },
  { query: "cabaret revival broadway", event: "Cabaret", venue: "Kit Kat Club at August Wilson Theatre, NYC", date: "Jun 1, 2026", ticket: 285, flight: 185, hotel: 275, ticketDetail: "Table Seating", flightDetail: "LAX → JFK, JetBlue, 5h 30m", hotelDetail: "The Standard East Village, 4.3★" },
]

// =============================================================================
// Racing Examples (30)
// =============================================================================

const RACING: EventExample[] = [
  { query: "f1 monaco grand prix", event: "Formula 1 Monaco GP", venue: "Circuit de Monaco", date: "May 25, 2026", ticket: 890, flight: 680, hotel: 450, ticketDetail: "Grandstand K Row 8", flightDetail: "JFK → NCE, Delta, 8h 30m", hotelDetail: "Fairmont Monte Carlo, 4.7★" },
  { query: "f1 austin texas gp", event: "Formula 1 US Grand Prix", venue: "Circuit of the Americas, Austin", date: "Oct 19, 2026", ticket: 485, flight: 195, hotel: 225, ticketDetail: "Turn 1 Grandstand Row 15", flightDetail: "LAX → AUS, Southwest, 3h", hotelDetail: "The LINE Austin, 4.5★" },
  { query: "f1 miami grand prix", event: "Formula 1 Miami GP", venue: "Miami International Autodrome", date: "May 4, 2026", ticket: 595, flight: 185, hotel: 285, ticketDetail: "Beach Grandstand Row 10", flightDetail: "ATL → MIA, Delta, 1h 45m", hotelDetail: "Faena Miami Beach, 4.7★" },
  { query: "f1 las vegas night race", event: "Formula 1 Las Vegas GP", venue: "Las Vegas Strip Circuit", date: "Nov 22, 2026", ticket: 750, flight: 165, hotel: 325, ticketDetail: "Sphere Grandstand Row 5", flightDetail: "LAX → LAS, Southwest, 1h", hotelDetail: "Wynn Las Vegas, 4.8★" },
  { query: "f1 singapore night race", event: "Formula 1 Singapore GP", venue: "Marina Bay Street Circuit", date: "Sep 21, 2026", ticket: 685, flight: 1100, hotel: 380, ticketDetail: "Padang Grandstand Row 12", flightDetail: "LAX → SIN, Singapore Air, 18h", hotelDetail: "Marina Bay Sands, 4.7★" },
  { query: "f1 british grand prix silverstone", event: "Formula 1 British GP", venue: "Silverstone Circuit, UK", date: "Jul 6, 2026", ticket: 425, flight: 580, hotel: 245, ticketDetail: "Copse Corner Row 20", flightDetail: "JFK → LHR, British Airways, 7h", hotelDetail: "Whittlebury Hall, 4.4★" },
  { query: "f1 italian grand prix monza", event: "Formula 1 Italian GP", venue: "Autodromo di Monza, Italy", date: "Sep 7, 2026", ticket: 385, flight: 620, hotel: 275, ticketDetail: "Parabolica Tribune Row 8", flightDetail: "JFK → MXP, ITA Airways, 8h 30m", hotelDetail: "Park Hyatt Milan, 4.8★" },
  { query: "f1 japanese grand prix suzuka", event: "Formula 1 Japanese GP", venue: "Suzuka Circuit, Japan", date: "Apr 6, 2026", ticket: 445, flight: 980, hotel: 295, ticketDetail: "Degner Curve Row 15", flightDetail: "LAX → NRT, JAL, 11h 30m", hotelDetail: "The Ritz-Carlton Osaka, 4.8★" },
  { query: "f1 abu dhabi season finale", event: "Formula 1 Abu Dhabi GP", venue: "Yas Marina Circuit, UAE", date: "Dec 7, 2026", ticket: 595, flight: 850, hotel: 385, ticketDetail: "North Grandstand Row 10", flightDetail: "JFK → AUH, Etihad, 13h", hotelDetail: "W Abu Dhabi Yas Island, 4.6★" },
  { query: "f1 spa belgium grand prix", event: "Formula 1 Belgian GP", venue: "Circuit de Spa-Francorchamps", date: "Aug 31, 2026", ticket: 365, flight: 545, hotel: 195, ticketDetail: "Eau Rouge View Row 5", flightDetail: "JFK → BRU, United, 7h 30m", hotelDetail: "Radisson Blu Spa, 4.3★" },
  { query: "daytona 500 nascar race", event: "Daytona 500", venue: "Daytona International Speedway, FL", date: "Feb 15, 2026", ticket: 275, flight: 175, hotel: 185, ticketDetail: "Sprint Tower Row 35", flightDetail: "ATL → DAB, Delta, 1h 15m", hotelDetail: "Hard Rock Daytona Beach, 4.4★" },
  { query: "indy 500 memorial weekend", event: "Indianapolis 500", venue: "Indianapolis Motor Speedway", date: "May 24, 2026", ticket: 195, flight: 155, hotel: 165, ticketDetail: "Turn 1 Grandstand Row 28", flightDetail: "ORD → IND, American, 1h", hotelDetail: "The Alexander, 4.5★" },
  { query: "nascar coca cola 600 charlotte", event: "Coca-Cola 600", venue: "Charlotte Motor Speedway, NC", date: "May 25, 2026", ticket: 145, flight: 165, hotel: 135, ticketDetail: "Ford Grandstand Row 22", flightDetail: "ATL → CLT, Delta, 1h", hotelDetail: "The Ritz-Carlton Charlotte, 4.6★" },
  { query: "le mans 24 hour race france", event: "24 Hours of Le Mans", venue: "Circuit de la Sarthe, France", date: "Jun 14, 2026", ticket: 285, flight: 595, hotel: 195, ticketDetail: "Tertre Rouge Grandstand", flightDetail: "JFK → CDG, Air France, 7h 30m", hotelDetail: "Mercure Le Mans Centre, 4.2★" },
  { query: "motogp austin texas", event: "MotoGP Grand Prix of the Americas", venue: "Circuit of the Americas, Austin", date: "Apr 13, 2026", ticket: 225, flight: 195, hotel: 195, ticketDetail: "Turn 15 Grandstand Row 10", flightDetail: "DEN → AUS, United, 2h 30m", hotelDetail: "Fairmont Austin, 4.6★" },
  { query: "f1 canadian grand prix montreal", event: "Formula 1 Canadian GP", venue: "Circuit Gilles Villeneuve, Montreal", date: "Jun 15, 2026", ticket: 395, flight: 185, hotel: 225, ticketDetail: "Senna Grandstand Row 12", flightDetail: "JFK → YUL, Air Canada, 1h 30m", hotelDetail: "Ritz-Carlton Montreal, 4.7★" },
  { query: "nascar bristol night race", event: "Bass Pro Shops Night Race", venue: "Bristol Motor Speedway, TN", date: "Sep 20, 2026", ticket: 165, flight: 175, hotel: 125, ticketDetail: "Kulwicki Grandstand Row 18", flightDetail: "ATL → TRI, Delta, 1h", hotelDetail: "The Carnegie Hotel, 4.3★" },
  { query: "f1 mexico city grand prix", event: "Formula 1 Mexico City GP", venue: "Autodromo Hermanos Rodriguez", date: "Oct 26, 2026", ticket: 345, flight: 285, hotel: 165, ticketDetail: "Foro Sol Sec 15 Row 8", flightDetail: "LAX → MEX, Aeromexico, 3h 45m", hotelDetail: "St. Regis Mexico City, 4.8★" },
  { query: "f1 brazil sao paulo gp", event: "Formula 1 São Paulo GP", venue: "Interlagos Circuit, Brazil", date: "Nov 9, 2026", ticket: 385, flight: 745, hotel: 185, ticketDetail: "Senna S Grandstand Row 6", flightDetail: "MIA → GRU, LATAM, 8h 30m", hotelDetail: "Fasano São Paulo, 4.7★" },
  { query: "bathurst 1000 australia", event: "Bathurst 1000", venue: "Mount Panorama Circuit, Australia", date: "Oct 12, 2026", ticket: 245, flight: 1150, hotel: 175, ticketDetail: "Murray's Corner Row 15", flightDetail: "LAX → SYD, Qantas, 15h", hotelDetail: "Rydges Mount Panorama, 4.2★" },
  { query: "goodwood festival of speed", event: "Goodwood Festival of Speed", venue: "Goodwood House, UK", date: "Jul 10, 2026", ticket: 185, flight: 545, hotel: 225, ticketDetail: "Hillclimb General Admission", flightDetail: "JFK → LHR, American, 7h", hotelDetail: "The Goodwood Hotel, 4.4★" },
  { query: "nurburgring 24 hours", event: "24 Hours of Nürburgring", venue: "Nürburgring Nordschleife, Germany", date: "Jun 7, 2026", ticket: 145, flight: 595, hotel: 165, ticketDetail: "Brünnchen Grandstand", flightDetail: "JFK → CGN, Lufthansa, 8h", hotelDetail: "Lindner Nürburgring, 4.3★" },
  { query: "monaco historic grand prix", event: "Monaco Historic Grand Prix", venue: "Circuit de Monaco", date: "May 10, 2026", ticket: 425, flight: 680, hotel: 380, ticketDetail: "Tabac Grandstand Row 5", flightDetail: "JFK → NCE, Delta, 8h 30m", hotelDetail: "Hôtel de Paris Monaco, 4.9★" },
  { query: "nascar all star race texas", event: "NASCAR All-Star Race", venue: "Texas Motor Speedway", date: "May 18, 2026", ticket: 125, flight: 175, hotel: 145, ticketDetail: "Victory Lane Club Row 8", flightDetail: "ORD → DFW, American, 2h 30m", hotelDetail: "The Worthington Renaissance, 4.4★" },
  { query: "motogp valencia season finale", event: "MotoGP Valencia GP", venue: "Circuit Ricardo Tormo, Spain", date: "Nov 16, 2026", ticket: 195, flight: 620, hotel: 145, ticketDetail: "Main Grandstand Row 12", flightDetail: "JFK → VLC, TAP Air, 9h", hotelDetail: "The Westin Valencia, 4.5★" },
  { query: "rally monte carlo wrc", event: "WRC Rally Monte Carlo", venue: "Monaco and French Alps", date: "Jan 25, 2026", ticket: 95, flight: 680, hotel: 285, ticketDetail: "Special Stage Viewing", flightDetail: "JFK → NCE, Air France, 9h", hotelDetail: "Le Méridien Nice, 4.5★" },
  { query: "f1 australian grand prix melbourne", event: "Formula 1 Australian GP", venue: "Albert Park Circuit, Melbourne", date: "Mar 16, 2026", ticket: 485, flight: 1050, hotel: 225, ticketDetail: "Jones Chicane Row 10", flightDetail: "LAX → MEL, Qantas, 16h", hotelDetail: "Crown Towers Melbourne, 4.8★" },
  { query: "rolex 24 at daytona", event: "Rolex 24 at Daytona", venue: "Daytona International Speedway, FL", date: "Jan 25, 2026", ticket: 145, flight: 175, hotel: 165, ticketDetail: "Infield Grandstand Row 20", flightDetail: "JFK → DAB, JetBlue, 2h 15m", hotelDetail: "Hilton Daytona Beach, 4.3★" },
  { query: "long beach grand prix indycar", event: "Acura Grand Prix of Long Beach", venue: "Streets of Long Beach, CA", date: "Apr 12, 2026", ticket: 185, flight: 145, hotel: 195, ticketDetail: "Turn 11 Grandstand Row 8", flightDetail: "SFO → LGB, Southwest, 1h 15m", hotelDetail: "The Westin Long Beach, 4.4★" },
  { query: "f1 qatar grand prix losail", event: "Formula 1 Qatar GP", venue: "Losail International Circuit", date: "Nov 30, 2026", ticket: 545, flight: 920, hotel: 345, ticketDetail: "Main Grandstand Row 8", flightDetail: "JFK → DOH, Qatar Airways, 13h", hotelDetail: "Marsa Malaz Kempinski, 4.8★" },
]

// =============================================================================
// Combined Data by Category
// =============================================================================

const EXAMPLES_BY_CATEGORY: Record<Category, EventExample[]> = {
  concerts: CONCERTS,
  sports: SPORTS,
  theater: THEATER,
  racing: RACING,
}

// =============================================================================
// Constants
// =============================================================================

const CYCLE_INTERVAL = 8000
const ANIMATION_STEP_DELAY = 400 // Faster on mobile

// =============================================================================
// Utility: Get random example from category
// =============================================================================

function getRandomExample(category: Category, excludeQuery?: string): EventExample {
  const examples = EXAMPLES_BY_CATEGORY[category]
  const filtered = excludeQuery
    ? examples.filter(e => e.query !== excludeQuery)
    : examples
  return filtered[Math.floor(Math.random() * filtered.length)]
}

// =============================================================================
// Animated Price Card with Hover Tooltip
// =============================================================================

type AnimationPhase = "searching" | "found" | "idle"

interface AnimatedPriceCardProps {
  icon: React.ReactNode
  label: string
  price: number
  suffix?: string
  phase: AnimationPhase
  detail: string
}

function AnimatedPriceCard({ icon, label, price, suffix, phase, detail }: AnimatedPriceCardProps) {
  const showTooltip = phase === "found" && price > 0

  const cardContent = (
    <div className={cn(
      "flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-xl bg-muted/50 min-h-[88px] sm:min-h-[96px] transition-colors",
      showTooltip && "hover:bg-muted cursor-help"
    )}>
      <div className="text-muted-foreground">{icon}</div>

      <AnimatePresence mode="wait">
        {phase === "searching" ? (
          <motion.div
            key="searching"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.7 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-1"
          >
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-[10px] sm:text-xs text-muted-foreground">finding...</span>
          </motion.div>
        ) : phase === "idle" ? (
          <motion.div
            key="idle"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0.5 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="text-lg sm:text-xl font-semibold text-muted-foreground/30">—</div>
            <div className="text-[10px] sm:text-xs text-muted-foreground/50">{label}</div>
          </motion.div>
        ) : (
          <motion.div
            key="found"
            initial={{ opacity: 0.8, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-0.5"
          >
            <div className="text-lg sm:text-xl font-semibold">
              {price === 0 ? "free" : `$${price.toLocaleString()}`}
            </div>
            <div className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
              <span>{label}{suffix}</span>
              <Check className="w-3 h-3 text-green-500" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  if (!showTooltip) return cardContent

  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger asChild>
        {cardContent}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        className="max-w-[200px] text-center text-xs"
      >
        {detail}
      </TooltipContent>
    </Tooltip>
  )
}

// =============================================================================
// Demo Preview Component
// =============================================================================

export function DemoPreview() {
  const [activeCategory, setActiveCategory] = useState<Category>("concerts")
  const [current, setCurrent] = useState<EventExample>(() => getRandomExample("concerts"))
  const [animationStep, setAnimationStep] = useState(0)
  const [isShuffling, setIsShuffling] = useState(false)

  const total = useMemo(() => {
    return current.ticket + current.flight + current.hotel * 2
  }, [current])

  // Animation sequence
  const runAnimation = useCallback(() => {
    setAnimationStep(0)

    const t1 = setTimeout(() => setAnimationStep(1), 100)
    const t2 = setTimeout(() => setAnimationStep(2), ANIMATION_STEP_DELAY + 100)
    const t3 = setTimeout(() => setAnimationStep(3), ANIMATION_STEP_DELAY * 2 + 100)
    const t4 = setTimeout(() => setAnimationStep(4), ANIMATION_STEP_DELAY * 3 + 100)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  // Run animation when current example changes
  useEffect(() => {
    const cleanup = runAnimation()
    return cleanup
  }, [current, runAnimation])

  // Auto-cycle examples
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => getRandomExample(activeCategory, prev.query))
    }, CYCLE_INTERVAL)

    return () => clearInterval(interval)
  }, [activeCategory])

  // Handle category change
  function handleCategoryChange(category: Category) {
    if (category === activeCategory) return
    setActiveCategory(category)
    setCurrent(getRandomExample(category))
  }

  // Handle shuffle
  function handleShuffle() {
    setIsShuffling(true)
    setCurrent(prev => getRandomExample(activeCategory, prev.query))
    setTimeout(() => setIsShuffling(false), 300)
  }

  // Determine phase for each card
  const ticketPhase: AnimationPhase = animationStep === 0 ? "idle" : animationStep === 1 ? "searching" : "found"
  const flightPhase: AnimationPhase = animationStep < 2 ? "idle" : animationStep === 2 ? "searching" : "found"
  const hotelPhase: AnimationPhase = animationStep < 3 ? "idle" : animationStep === 3 ? "searching" : "found"
  const showTotal = animationStep >= 4

  return (
    <TooltipProvider>
      <div className="w-full max-w-xl mx-auto">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[36px]",
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

        {/* Main Card */}
        <motion.div
          key={current.query}
          initial={{ opacity: 0.9, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-2xl border bg-card p-5 sm:p-6 shadow-lg"
        >
          {/* Search Query */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm text-primary">&#10022;</span>
            </div>
            <div className="flex-1 px-4 py-2 rounded-full bg-muted text-sm truncate">
              &ldquo;{current.query}&rdquo;
            </div>
          </div>

          {/* Event Info */}
          <div className="mb-5 sm:mb-6 space-y-1.5">
            <h3 className="font-semibold text-base sm:text-lg">{current.event}</h3>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{current.venue}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{current.date}</span>
            </div>
          </div>

          {/* Animated Price Cards with Hover */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5 sm:mb-6">
            <AnimatedPriceCard
              icon={<Ticket className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="ticket"
              price={current.ticket}
              phase={ticketPhase}
              detail={current.ticketDetail}
            />
            <AnimatedPriceCard
              icon={<Plane className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="flight"
              price={current.flight}
              suffix=" rt"
              phase={flightPhase}
              detail={current.flightDetail}
            />
            <AnimatedPriceCard
              icon={<Hotel className="w-4 h-4 sm:w-5 sm:h-5" />}
              label="hotel"
              price={current.hotel}
              suffix="/n"
              phase={hotelPhase}
              detail={current.hotelDetail}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <div className="text-xs sm:text-sm text-muted-foreground">estimated total</div>
              <AnimatePresence mode="wait">
                {showTotal ? (
                  <motion.div
                    key="total"
                    initial={{ opacity: 0.8, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xl sm:text-2xl font-semibold"
                  >
                    ~${total.toLocaleString()}
                  </motion.div>
                ) : (
                  <motion.div
                    key="calculating"
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0.7 }}
                    transition={{ duration: 0.15 }}
                    className="text-xl sm:text-2xl font-semibold text-muted-foreground/50"
                  >
                    calculating...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Link
              href={`/chat?prompt=${encodeURIComponent(current.query)}`}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all active:scale-[0.97]",
                showTotal
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground pointer-events-none"
              )}
            >
              plan this trip
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Shuffle Button */}
        <div className="flex justify-center mt-5">
          <button
            onClick={handleShuffle}
            disabled={isShuffling}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm text-muted-foreground",
              "bg-muted/50 hover:bg-muted transition-all duration-200",
              "active:scale-[0.97]",
              isShuffling && "opacity-50"
            )}
          >
            <Shuffle className={cn("w-4 h-4", isShuffling && "animate-spin")} />
            <span>show me another</span>
          </button>
        </div>

        {/* Example Tags */}
        <div className="mt-6 text-center">
          <p className="text-xs text-muted-foreground/60 mb-3">or try one of these</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {EXAMPLE_TAGS.map((tag) => (
              <Link
                key={tag.label}
                href={`/chat?prompt=${encodeURIComponent(tag.prompt)}`}
                className="px-4 py-2.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors min-h-[40px] flex items-center"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

// =============================================================================
// Minimal Version
// =============================================================================

export function DemoPreviewMinimal() {
  const [current, setCurrent] = useState<EventExample>(() => getRandomExample("concerts"))

  useEffect(() => {
    const categories: Category[] = ["concerts", "sports", "theater", "racing"]
    let categoryIndex = 0

    const interval = setInterval(() => {
      categoryIndex = (categoryIndex + 1) % categories.length
      setCurrent(getRandomExample(categories[categoryIndex]))
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        key={current.query}
        initial={{ opacity: 0.9, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl border bg-card p-5 shadow-sm"
      >
        <div className="text-sm text-muted-foreground mb-3">
          &ldquo;{current.query}&rdquo;
        </div>

        <div className="font-medium mb-4">{current.event}</div>

        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <Ticket className="w-4 h-4 text-muted-foreground" />
            <span>${current.ticket}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-muted-foreground" />
            <span>${current.flight}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hotel className="w-4 h-4 text-muted-foreground" />
            <span>${current.hotel}/n</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// =============================================================================
// Static Version
// =============================================================================

export function DemoPreviewStatic() {
  const examples = [
    getRandomExample("concerts"),
    getRandomExample("sports"),
    getRandomExample("theater"),
  ]

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="grid md:grid-cols-3 gap-4">
        {examples.map((example, index) => (
          <Link
            key={index}
            href={`/chat?prompt=${encodeURIComponent(example.query)}`}
            className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="text-xs text-muted-foreground mb-2">
              &ldquo;{example.query}&rdquo;
            </div>
            <div className="font-medium text-sm mb-3">{example.event}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Ticket className="w-3.5 h-3.5" />
                ${example.ticket}
              </span>
              <span className="flex items-center gap-1">
                <Plane className="w-3.5 h-3.5" />
                ${example.flight}
              </span>
              <span className="flex items-center gap-1">
                <Hotel className="w-3.5 h-3.5" />
                ${example.hotel}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
