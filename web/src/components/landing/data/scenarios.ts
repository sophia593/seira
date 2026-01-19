// =============================================================================
// Trip Scenarios - Landing Page Demo Data
// =============================================================================
// Demo trip scenarios for the hero section Trip Builder Preview.
// Users click scenario chips to see different trip previews.
//
// To add a new scenario:
// 1. Add the accent color slug to colors/ if it doesn't exist
// 2. Copy an existing scenario object below
// 3. Update all fields with realistic data
// 4. The scenario will automatically appear in the UI
// =============================================================================

import { getAccent } from './colors';

// =============================================================================
// Types
// =============================================================================

/**
 * A single day in the trip itinerary
 */
export interface ItineraryDay {
  /** Day label (e.g., "Fri", "Sat", "Sun") */
  day: string;
  /** Activities for this day, with times where relevant */
  items: string[];
}

/**
 * Event information for a trip
 */
export interface TripEvent {
  /** Full event name */
  name: string;
  /** Venue name */
  venue: string;
  /** City name */
  city: string;
  /** Specific date (e.g., "Oct 19, 2026") */
  date: string;
  /** Number of nights for the trip */
  nights: number;
}

/**
 * Flight information for a trip
 */
export interface TripFlight {
  /** Route (e.g., "LAX → AUS") */
  route: string;
  /** Flight details (e.g., "Fri morning–midday") */
  details: string;
  /** Price range [min, max] */
  priceRange: [number, number];
}

/**
 * Hotel information for a trip
 */
export interface TripHotel {
  /** Hotel name or neighborhood */
  name: string;
  /** Hotel rating (e.g., 4.4) */
  rating: number;
  /** Price per night range [min, max] */
  pricePerNight: [number, number];
}

/**
 * Complete trip scenario for the landing page demo
 */
export interface TripScenario {
  /** Unique identifier (kebab-case) */
  id: string;
  /** Accent color slug from colors registry */
  accentSlug: string;
  /** Short label for the chip (e.g., "F1 Austin") */
  chipLabel: string;
  /** Subtext under chip (e.g., "Oct weekend · 2 nights") */
  queryLabel: string;
  /** Event details */
  event: TripEvent;
  /** Flight details */
  flight: TripFlight;
  /** Hotel details */
  hotel: TripHotel;
  /** Total trip cost range [min, max] - hand-authored for display */
  totalRange: [number, number];
  /** Day-by-day itinerary */
  itinerary: ItineraryDay[];
}

// =============================================================================
// Scenarios Data
// =============================================================================

export const scenarios: TripScenario[] = [
  // ---------------------------------------------------------------------------
  // F1 Austin - US Grand Prix Weekend
  // ---------------------------------------------------------------------------
  {
    id: 'f1-austin',
    accentSlug: 'f1-default',
    chipLabel: 'F1 Austin',
    queryLabel: 'Oct weekend · 2 nights',
    event: {
      name: 'Formula 1 United States Grand Prix',
      venue: 'Circuit of the Americas',
      city: 'Austin',
      date: 'Oct 19, 2026',
      nights: 2,
    },
    flight: {
      route: 'LAX → AUS',
      details: 'Fri morning, return Sun night',
      priceRange: [280, 420],
    },
    hotel: {
      name: 'JW Marriott Downtown',
      rating: 4.6,
      pricePerNight: [289, 389],
    },
    totalRange: [1850, 2650],
    itinerary: [
      {
        day: 'Fri',
        items: [
          'Arrive Austin 2:30pm',
          'Check in downtown',
          'Dinner on Rainey St',
          'Live music on 6th',
        ],
      },
      {
        day: 'Sat',
        items: [
          'COTA gates open 8am',
          'FP3 & Qualifying',
          'Explore Turn 15 views',
          'Concert at COTA (post-quali)',
        ],
      },
      {
        day: 'Sun',
        items: [
          'Race day - gates 7am',
          'Pre-race grid walk',
          'Race start 2pm',
          'Depart AUS 9:15pm',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Kendrick Lamar at MSG
  // ---------------------------------------------------------------------------
  {
    id: 'kendrick-nyc',
    accentSlug: 'kendrick-lamar',
    chipLabel: 'Kendrick NYC',
    queryLabel: 'Aug weekend · 2 nights',
    event: {
      name: 'Kendrick Lamar',
      venue: 'Madison Square Garden',
      city: 'New York',
      date: 'Aug 15, 2026',
      nights: 2,
    },
    flight: {
      route: 'SFO → JFK',
      details: 'Fri afternoon, return Sun evening',
      priceRange: [320, 480],
    },
    hotel: {
      name: 'The Langham, Fifth Ave',
      rating: 4.7,
      pricePerNight: [359, 489],
    },
    totalRange: [1650, 2400],
    itinerary: [
      {
        day: 'Fri',
        items: [
          'Arrive JFK 4pm',
          'Check in Midtown',
          'Explore Times Square',
          'Dinner in Hell\'s Kitchen',
        ],
      },
      {
        day: 'Sat',
        items: [
          'Brunch in SoHo',
          'Walk High Line',
          'Pre-show drinks',
          'Show at MSG 8pm',
          'Late night eats',
        ],
      },
      {
        day: 'Sun',
        items: [
          'Sleep in',
          'Brunch in West Village',
          'Central Park walk',
          'Depart JFK 6pm',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Lakers vs Celtics
  // ---------------------------------------------------------------------------
  {
    id: 'lakers-celtics',
    accentSlug: 'los-angeles-lakers',
    chipLabel: 'Lakers Game',
    queryLabel: 'Feb weekend · 2 nights',
    event: {
      name: 'Lakers vs Celtics',
      venue: 'Crypto.com Arena',
      city: 'Los Angeles',
      date: 'Feb 14, 2026',
      nights: 2,
    },
    flight: {
      route: 'ORD → LAX',
      details: 'Fri midday, return Sun night',
      priceRange: [240, 380],
    },
    hotel: {
      name: 'The Ritz-Carlton LA Live',
      rating: 4.8,
      pricePerNight: [399, 549],
    },
    totalRange: [1400, 2100],
    itinerary: [
      {
        day: 'Fri',
        items: [
          'Arrive LAX 3pm',
          'Check in LA Live',
          'Santa Monica Pier',
          'Dinner in Venice',
        ],
      },
      {
        day: 'Sat',
        items: [
          'Brunch at Republique',
          'Walk of Fame',
          'Pre-game at Yard House',
          'Game tip-off 7:30pm',
          'Post-game at LA Live',
        ],
      },
      {
        day: 'Sun',
        items: [
          'Brunch at Catch',
          'Griffith Observatory',
          'Sunset at Runyon',
          'Depart LAX 8pm',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Hamilton on Broadway
  // ---------------------------------------------------------------------------
  {
    id: 'hamilton-broadway',
    accentSlug: 'hamilton',
    chipLabel: 'Hamilton',
    queryLabel: 'Mar Saturday · 1 night',
    event: {
      name: 'Hamilton',
      venue: 'Richard Rodgers Theatre',
      city: 'New York',
      date: 'Mar 14, 2026',
      nights: 1,
    },
    flight: {
      route: 'BOS → LGA',
      details: 'Sat morning shuttle',
      priceRange: [120, 180],
    },
    hotel: {
      name: 'The Knickerbocker',
      rating: 4.5,
      pricePerNight: [329, 429],
    },
    totalRange: [950, 1350],
    itinerary: [
      {
        day: 'Sat',
        items: [
          'Arrive LGA 10am',
          'Drop bags at hotel',
          'Lunch at Joe Allen',
          'Explore Theater District',
          'Matinee at 2pm',
          'Dinner at Sardi\'s',
          'Walk Times Square at night',
        ],
      },
      {
        day: 'Sun',
        items: [
          'Brunch at Bubby\'s',
          'Walk Brooklyn Bridge',
          'Coffee in DUMBO',
          'Depart LGA 4pm',
        ],
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // Coachella Weekend 1
  // ---------------------------------------------------------------------------
  {
    id: 'coachella',
    accentSlug: 'coachella',
    chipLabel: 'Coachella',
    queryLabel: 'April W1 · 3 nights',
    event: {
      name: 'Coachella Weekend 1',
      venue: 'Empire Polo Club',
      city: 'Indio',
      date: 'Apr 10–12, 2026',
      nights: 3,
    },
    flight: {
      route: 'SEA → PSP',
      details: 'Thurs afternoon, return Mon',
      priceRange: [280, 420],
    },
    hotel: {
      name: 'La Quinta Resort & Club',
      rating: 4.4,
      pricePerNight: [349, 549],
    },
    totalRange: [2200, 3400],
    itinerary: [
      {
        day: 'Fri',
        items: [
          'Gates open 12pm',
          'Explore art installations',
          'Catch afternoon sets',
          'Headliner at 10:15pm',
          'Sahara tent til close',
        ],
      },
      {
        day: 'Sat',
        items: [
          'Pool morning at hotel',
          'Arrive grounds 3pm',
          'Gobi & Mojave tents',
          'Sunset at main stage',
          'Saturday headliner',
        ],
      },
      {
        day: 'Sun',
        items: [
          'Brunch in Palm Springs',
          'Final day gates 2pm',
          'Don\'t miss closers',
          'Festival ends midnight',
        ],
      },
      {
        day: 'Mon',
        items: [
          'Sleep in',
          'Recovery brunch',
          'Depart PSP 2pm',
        ],
      },
    ],
  },
];

// =============================================================================
// Helper Functions
// =============================================================================

/** Default scenario ID (first in the list) */
export const defaultScenarioId = scenarios[0].id;

/**
 * Get a scenario by its ID
 * @returns The scenario or undefined if not found
 */
export function getScenarioById(id: string): TripScenario | undefined {
  return scenarios.find((s) => s.id === id);
}

/**
 * Get the default scenario (first in the list)
 */
export function getDefaultScenario(): TripScenario {
  return scenarios[0];
}

/**
 * Get the accent color for a scenario
 */
export function getScenarioAccent(scenario: TripScenario): string {
  return getAccent(scenario.accentSlug);
}

/**
 * Get all scenario IDs
 */
export function getAllScenarioIds(): string[] {
  return scenarios.map((s) => s.id);
}

/**
 * Get scenario count
 */
export function getScenarioCount(): number {
  return scenarios.length;
}

// =============================================================================
// Additional Scenarios (commented out for future use)
// =============================================================================
// Copy one of these templates to add more scenarios:
//
// {
//   id: 'scenario-id',
//   accentSlug: 'color-slug',
//   chipLabel: 'Short Label',
//   queryLabel: 'Month · X nights',
//   event: {
//     name: 'Event Name',
//     venue: 'Venue Name',
//     city: 'City',
//     date: 'Mon DD, YYYY',
//     nights: 2,
//   },
//   flight: {
//     route: 'XXX → YYY',
//     details: 'Day time, return Day',
//     priceRange: [200, 400],
//   },
//   hotel: {
//     name: 'Hotel Name',
//     rating: 4.5,
//     pricePerNight: [200, 350],
//   },
//   totalRange: [1000, 2000],
//   itinerary: [
//     { day: 'Day1', items: ['Activity 1', 'Activity 2'] },
//     { day: 'Day2', items: ['Activity 1', 'Activity 2'] },
//   ],
// },
