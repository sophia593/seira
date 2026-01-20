import type {
  DemoExample,
  DemoPrompt,
  SearchLayer,
  CategoryTab,
  DemoCategory,
} from './types'

// =============================================================================
// Search Layer Templates
// =============================================================================

const createSearchLayers = (
  ticketStatus: string,
  flightStatus: string,
  hotelStatus: string
): SearchLayer[] => [
  {
    iconKey: 'ticket',
    label: 'Event inventory',
    signals: ['Verified resale', 'Primary access', 'Seat scoring'],
    status: ticketStatus,
  },
  {
    iconKey: 'flight',
    label: 'Flight routes',
    signals: ['Nonstop priority', 'Buffer protected', 'Flex returns'],
    status: flightStatus,
  },
  {
    iconKey: 'hotel',
    label: 'Lodging',
    signals: ['Venue proximity', '4★+ filter', 'Free cancel'],
    status: hotelStatus,
  },
]

// =============================================================================
// Category Tabs
// =============================================================================

export const categoryTabs: CategoryTab[] = [
  { id: 'concerts', label: 'Concerts', iconKey: 'music' },
  { id: 'sports', label: 'Sports', iconKey: 'trophy' },
  { id: 'theater', label: 'Theater', iconKey: 'theater' },
  { id: 'racing', label: 'Racing', iconKey: 'flag' },
]

// =============================================================================
// Demo Examples
// =============================================================================

export const demoExamples: DemoExample[] = [
  // ---------------------------------------------------------------------------
  // Sports
  // ---------------------------------------------------------------------------
  {
    id: 'lakers-celtics',
    category: 'sports',
    query: 'Lakers vs Celtics in February, flying from Chicago',
    meta: {
      date: 'Feb 14, 2026',
      travelers: 2,
      nights: 2,
      origin: 'ORD',
      originCity: 'Chicago',
      destination: 'Los Angeles',
      understood: ['NBA', 'Los Angeles', 'Valentine\'s weekend', 'Origin: Chicago'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Lakers vs Celtics',
      subtitle: 'Feb 14, 2026 · Crypto.com Arena · Los Angeles',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Lower bowl, 2 tickets',
          detail: 'Multiple sections',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'flight',
          label: 'ORD → LAX round-trip',
          detail: 'Nonstop options',
          range: { min: 280, max: 420 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights downtown',
          detail: '4★+ near venue',
          range: { min: 220, max: 380 },
        },
      ],
      totalRange: { min: 680, max: 1120 },
    },
  },
  {
    id: 'el-clasico',
    category: 'sports',
    query: 'El Clásico in Madrid, flying from New York',
    meta: {
      date: 'Apr 12, 2026',
      travelers: 2,
      nights: 3,
      origin: 'JFK',
      originCity: 'New York',
      destination: 'Madrid',
      understood: ['La Liga', 'Real Madrid vs Barcelona', 'Bernabéu', 'Origin: NYC'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Real Madrid vs Barcelona',
      subtitle: 'Apr 12, 2026 · Santiago Bernabéu · Madrid',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Category 2, 2 tickets',
          detail: 'Side sections',
          range: { min: 320, max: 580 },
        },
        {
          iconKey: 'flight',
          label: 'JFK → MAD round-trip',
          detail: 'Direct flights',
          range: { min: 650, max: 950 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights central',
          detail: '4★+ Gran Vía area',
          range: { min: 380, max: 520 },
        },
      ],
      totalRange: { min: 1350, max: 2050 },
    },
  },
  {
    id: 'super-bowl',
    category: 'sports',
    query: 'Super Bowl 2026, flying from Miami',
    meta: {
      date: 'Feb 8, 2026',
      travelers: 2,
      nights: 3,
      origin: 'MIA',
      originCity: 'Miami',
      destination: 'New Orleans',
      understood: ['NFL Championship', 'Super Bowl LX', 'Caesars Superdome', 'Origin: Miami'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Super Bowl LX',
      subtitle: 'Feb 8, 2026 · Caesars Superdome · New Orleans',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Upper level, 2 tickets',
          detail: 'End zone view',
          range: { min: 3500, max: 5500 },
        },
        {
          iconKey: 'flight',
          label: 'MIA → MSY round-trip',
          detail: 'Direct flights',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights French Quarter',
          detail: 'Limited availability',
          range: { min: 450, max: 750 },
        },
      ],
      totalRange: { min: 4130, max: 6570 },
    },
  },
  {
    id: 'world-series',
    category: 'sports',
    query: 'World Series Game 7, flying from Seattle',
    meta: {
      date: 'Oct 2026',
      travelers: 2,
      nights: 2,
      origin: 'SEA',
      originCity: 'Seattle',
      destination: 'TBD',
      understood: ['MLB', 'World Series', 'Game 7 if necessary', 'Origin: Seattle'],
    },
    layers: createSearchLayers('Monitoring dates', 'Routes ready', 'Areas mapped'),
    itinerary: {
      title: 'World Series Game 7',
      subtitle: 'Oct 2026 · Venue TBD · Championship Round',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Field level, 2 tickets',
          detail: 'Premium sections',
          range: { min: 800, max: 1500 },
        },
        {
          iconKey: 'flight',
          label: 'SEA → TBD round-trip',
          detail: 'Flexible booking',
          range: { min: 250, max: 450 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights near stadium',
          detail: '4★+ downtown',
          range: { min: 280, max: 450 },
        },
      ],
      totalRange: { min: 1330, max: 2400 },
    },
  },
  {
    id: 'champions-league-final',
    category: 'sports',
    query: 'Champions League Final in Munich, from London',
    meta: {
      date: 'May 30, 2026',
      travelers: 2,
      nights: 3,
      origin: 'LHR',
      originCity: 'London',
      destination: 'Munich',
      understood: ['UEFA', 'Champions League', 'Allianz Arena', 'Origin: London'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'UEFA Champions League Final',
      subtitle: 'May 30, 2026 · Allianz Arena · Munich',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Category 1, 2 tickets',
          detail: 'Sideline sections',
          range: { min: 900, max: 1800 },
        },
        {
          iconKey: 'flight',
          label: 'LHR → MUC round-trip',
          detail: 'Direct flights',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights central Munich',
          detail: '4★+ Marienplatz area',
          range: { min: 350, max: 550 },
        },
      ],
      totalRange: { min: 1430, max: 2670 },
    },
  },

  // ---------------------------------------------------------------------------
  // Concerts
  // ---------------------------------------------------------------------------
  {
    id: 'billie-eilish',
    category: 'concerts',
    query: 'Billie Eilish tour, anywhere on the West Coast',
    meta: {
      date: 'Aug 2026',
      travelers: 2,
      nights: 2,
      origin: 'DEN',
      originCity: 'Denver',
      destination: 'Los Angeles',
      understood: ['Hit Me Hard and Soft Tour', 'CA dates', 'Flexible venue', 'Origin: Denver'],
    },
    layers: createSearchLayers('Dates scanned', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Billie Eilish · Hit Me Hard and Soft',
      subtitle: 'Aug 8, 2026 · Kia Forum · Los Angeles',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Floor seats, 2 tickets',
          detail: 'Verified resale',
          range: { min: 280, max: 550 },
        },
        {
          iconKey: 'flight',
          label: 'DEN → LAX round-trip',
          detail: 'Multiple options',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights Los Angeles',
          detail: '4★+ near venue',
          range: { min: 280, max: 420 },
        },
      ],
      totalRange: { min: 740, max: 1290 },
    },
  },
  {
    id: 'coachella',
    category: 'concerts',
    query: 'Coachella Weekend 1, flying from Phoenix',
    meta: {
      date: 'Apr 10-12, 2026',
      travelers: 2,
      nights: 3,
      origin: 'PHX',
      originCity: 'Phoenix',
      destination: 'Palm Springs',
      understood: ['Festival', 'Weekend 1', 'Indio', 'Origin: Phoenix'],
    },
    layers: createSearchLayers('Passes found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Coachella 2026',
      subtitle: 'Apr 10-12, 2026 · Empire Polo Club · Indio',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'GA pass, 2 tickets',
          detail: '3-day weekend',
          range: { min: 500, max: 650 },
        },
        {
          iconKey: 'flight',
          label: 'PHX → PSP round-trip',
          detail: 'Short flight',
          range: { min: 150, max: 280 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights Palm Springs',
          detail: 'Festival shuttle access',
          range: { min: 320, max: 520 },
        },
      ],
      totalRange: { min: 970, max: 1450 },
    },
  },
  {
    id: 'beyonce',
    category: 'concerts',
    query: 'Beyoncé Renaissance Tour, flying from Atlanta',
    meta: {
      date: 'Jul 2026',
      travelers: 2,
      nights: 2,
      origin: 'ATL',
      originCity: 'Atlanta',
      destination: 'Houston',
      understood: ['Renaissance Tour', 'Stadium show', 'NRG Stadium', 'Origin: Atlanta'],
    },
    layers: createSearchLayers('Dates scanned', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Beyoncé · Renaissance Tour',
      subtitle: 'Jul 18, 2026 · NRG Stadium · Houston',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Lower bowl, 2 tickets',
          detail: 'Stage view sections',
          range: { min: 350, max: 650 },
        },
        {
          iconKey: 'flight',
          label: 'ATL → IAH round-trip',
          detail: 'Nonstop options',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights downtown',
          detail: '4★+ near venue',
          range: { min: 200, max: 350 },
        },
      ],
      totalRange: { min: 730, max: 1320 },
    },
  },
  {
    id: 'coldplay',
    category: 'concerts',
    query: 'Coldplay Music of the Spheres, from San Francisco',
    meta: {
      date: 'Sep 2026',
      travelers: 2,
      nights: 2,
      origin: 'SFO',
      originCity: 'San Francisco',
      destination: 'Los Angeles',
      understood: ['World Tour', 'Stadium show', 'SoFi Stadium', 'Origin: SF'],
    },
    layers: createSearchLayers('Dates scanned', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Coldplay · Music of the Spheres',
      subtitle: 'Sep 12, 2026 · SoFi Stadium · Los Angeles',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Field GA, 2 tickets',
          detail: 'Standing floor',
          range: { min: 280, max: 450 },
        },
        {
          iconKey: 'flight',
          label: 'SFO → LAX round-trip',
          detail: 'Shuttle options',
          range: { min: 120, max: 220 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights Inglewood',
          detail: '4★+ near stadium',
          range: { min: 220, max: 380 },
        },
      ],
      totalRange: { min: 620, max: 1050 },
    },
  },
  {
    id: 'bad-bunny',
    category: 'concerts',
    query: 'Bad Bunny in Miami, local show',
    meta: {
      date: 'Nov 2026',
      travelers: 2,
      nights: 0,
      origin: 'MIA',
      originCity: 'Miami',
      destination: 'Miami',
      understood: ['Stadium tour', 'Hard Rock Stadium', 'Local event', 'No flight needed'],
    },
    layers: createSearchLayers('Options found', 'Not needed', 'Optional'),
    itinerary: {
      title: 'Bad Bunny · Most Wanted Tour',
      subtitle: 'Nov 8, 2026 · Hard Rock Stadium · Miami',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Floor seats, 2 tickets',
          detail: 'Premium sections',
          range: { min: 380, max: 700 },
        },
        {
          iconKey: 'flight',
          label: 'Local event',
          detail: 'No flight needed',
          range: { min: 0, max: 0 },
        },
        {
          iconKey: 'hotel',
          label: 'Optional stay',
          detail: 'If needed',
          range: { min: 0, max: 250 },
        },
      ],
      totalRange: { min: 380, max: 950 },
    },
  },

  // ---------------------------------------------------------------------------
  // Racing
  // ---------------------------------------------------------------------------
  {
    id: 'f1-monaco',
    category: 'racing',
    query: 'Monaco Grand Prix from London',
    meta: {
      date: 'May 24, 2026',
      travelers: 2,
      nights: 3,
      origin: 'LHR',
      originCity: 'London',
      destination: 'Monte Carlo',
      understood: ['F1', 'Monaco GP', 'Race weekend', 'Origin: London'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Monaco Grand Prix',
      subtitle: 'May 24, 2026 · Circuit de Monaco · Monte Carlo',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Grandstand K, 2 tickets',
          detail: 'Sunday race day',
          range: { min: 680, max: 1200 },
        },
        {
          iconKey: 'flight',
          label: 'LHR → NCE round-trip',
          detail: 'Direct to Nice',
          range: { min: 220, max: 380 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights Monaco/Nice',
          detail: 'Limited availability',
          range: { min: 520, max: 950 },
        },
      ],
      totalRange: { min: 1420, max: 2530 },
    },
  },
  {
    id: 'f1-austin',
    category: 'racing',
    query: 'F1 US Grand Prix in Austin, from Dallas',
    meta: {
      date: 'Oct 18, 2026',
      travelers: 2,
      nights: 2,
      origin: 'DFW',
      originCity: 'Dallas',
      destination: 'Austin',
      understood: ['F1', 'COTA', 'US Grand Prix', 'Origin: Dallas'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'F1 US Grand Prix',
      subtitle: 'Oct 18, 2026 · Circuit of the Americas · Austin',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Turn 1, 2 tickets',
          detail: '3-day weekend pass',
          range: { min: 450, max: 750 },
        },
        {
          iconKey: 'flight',
          label: 'DFW → AUS round-trip',
          detail: 'Short flight or drive',
          range: { min: 80, max: 180 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights downtown',
          detail: '4★+ 6th Street area',
          range: { min: 280, max: 450 },
        },
      ],
      totalRange: { min: 810, max: 1380 },
    },
  },
  {
    id: 'f1-miami',
    category: 'racing',
    query: 'Miami Grand Prix, flying from New York',
    meta: {
      date: 'May 3, 2026',
      travelers: 2,
      nights: 3,
      origin: 'JFK',
      originCity: 'New York',
      destination: 'Miami',
      understood: ['F1', 'Miami GP', 'Hard Rock Stadium', 'Origin: NYC'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Miami Grand Prix',
      subtitle: 'May 3, 2026 · Miami International Autodrome',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Beach grandstand, 2 tickets',
          detail: 'Full weekend access',
          range: { min: 550, max: 900 },
        },
        {
          iconKey: 'flight',
          label: 'JFK → MIA round-trip',
          detail: 'Direct flights',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '3 nights Miami Beach',
          detail: '4★+ South Beach',
          range: { min: 380, max: 620 },
        },
      ],
      totalRange: { min: 1110, max: 1840 },
    },
  },
  {
    id: 'daytona-500',
    category: 'racing',
    query: 'Daytona 500, flying from Chicago',
    meta: {
      date: 'Feb 15, 2026',
      travelers: 2,
      nights: 2,
      origin: 'ORD',
      originCity: 'Chicago',
      destination: 'Daytona Beach',
      understood: ['NASCAR', 'Daytona 500', 'Season opener', 'Origin: Chicago'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Daytona 500',
      subtitle: 'Feb 15, 2026 · Daytona International Speedway',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Frontstretch, 2 tickets',
          detail: 'Start/finish view',
          range: { min: 200, max: 380 },
        },
        {
          iconKey: 'flight',
          label: 'ORD → DAB round-trip',
          detail: 'Connection likely',
          range: { min: 220, max: 380 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights beachside',
          detail: '3★+ Daytona Beach',
          range: { min: 150, max: 280 },
        },
      ],
      totalRange: { min: 570, max: 1040 },
    },
  },
  {
    id: 'indy-500',
    category: 'racing',
    query: 'Indy 500, flying from Los Angeles',
    meta: {
      date: 'May 24, 2026',
      travelers: 2,
      nights: 2,
      origin: 'LAX',
      originCity: 'Los Angeles',
      destination: 'Indianapolis',
      understood: ['IndyCar', 'Indy 500', 'Indianapolis Motor Speedway', 'Origin: LA'],
    },
    layers: createSearchLayers('Options found', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Indianapolis 500',
      subtitle: 'May 24, 2026 · Indianapolis Motor Speedway',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Paddock, 2 tickets',
          detail: 'Premium seating',
          range: { min: 280, max: 500 },
        },
        {
          iconKey: 'flight',
          label: 'LAX → IND round-trip',
          detail: 'Nonstop options',
          range: { min: 250, max: 420 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights downtown',
          detail: '4★+ near speedway',
          range: { min: 200, max: 350 },
        },
      ],
      totalRange: { min: 730, max: 1270 },
    },
  },

  // ---------------------------------------------------------------------------
  // Theater
  // ---------------------------------------------------------------------------
  {
    id: 'hamilton-broadway',
    category: 'theater',
    query: 'Hamilton on Broadway, weekend trip from Boston',
    meta: {
      date: 'Mar 2026',
      travelers: 2,
      nights: 1,
      origin: 'BOS',
      originCity: 'Boston',
      destination: 'New York',
      understood: ['Broadway', 'Richard Rodgers Theatre', 'Weekend', 'Origin: Boston'],
    },
    layers: createSearchLayers('Dates checked', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Hamilton',
      subtitle: 'Mar 14, 2026 · Richard Rodgers Theatre · New York',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Orchestra, 2 tickets',
          detail: 'Center sections',
          range: { min: 350, max: 580 },
        },
        {
          iconKey: 'flight',
          label: 'BOS → NYC round-trip',
          detail: 'Shuttle or train',
          range: { min: 120, max: 220 },
        },
        {
          iconKey: 'hotel',
          label: '1 night Midtown',
          detail: '4★+ Theater District',
          range: { min: 280, max: 420 },
        },
      ],
      totalRange: { min: 750, max: 1220 },
    },
  },
  {
    id: 'wicked-london',
    category: 'theater',
    query: 'Wicked in London West End, from Paris',
    meta: {
      date: 'Apr 2026',
      travelers: 2,
      nights: 2,
      origin: 'CDG',
      originCity: 'Paris',
      destination: 'London',
      understood: ['West End', 'Apollo Victoria Theatre', 'Musical', 'Origin: Paris'],
    },
    layers: createSearchLayers('Dates checked', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Wicked',
      subtitle: 'Apr 18, 2026 · Apollo Victoria Theatre · London',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Stalls, 2 tickets',
          detail: 'Premium view',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'flight',
          label: 'CDG → LHR round-trip',
          detail: 'Eurostar option',
          range: { min: 150, max: 280 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights West End',
          detail: '4★+ Covent Garden',
          range: { min: 280, max: 450 },
        },
      ],
      totalRange: { min: 610, max: 1050 },
    },
  },
  {
    id: 'lion-king',
    category: 'theater',
    query: 'Lion King on Broadway, family trip from DC',
    meta: {
      date: 'Jul 2026',
      travelers: 4,
      nights: 2,
      origin: 'DCA',
      originCity: 'Washington DC',
      destination: 'New York',
      understood: ['Broadway', 'Minskoff Theatre', 'Family show', 'Origin: DC'],
    },
    layers: createSearchLayers('Dates checked', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'The Lion King',
      subtitle: 'Jul 11, 2026 · Minskoff Theatre · New York',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Mezzanine, 4 tickets',
          detail: 'Full stage view',
          range: { min: 480, max: 720 },
        },
        {
          iconKey: 'flight',
          label: 'DCA → NYC round-trip',
          detail: 'Train recommended',
          range: { min: 200, max: 360 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights Times Square',
          detail: '4★+ family-friendly',
          range: { min: 350, max: 550 },
        },
      ],
      totalRange: { min: 1030, max: 1630 },
    },
  },
  {
    id: 'phantom-london',
    category: 'theater',
    query: 'Phantom of the Opera, anniversary show London',
    meta: {
      date: 'Oct 2026',
      travelers: 2,
      nights: 2,
      origin: 'JFK',
      originCity: 'New York',
      destination: 'London',
      understood: ['West End', 'His Majesty\'s Theatre', 'Classic musical', 'Origin: NYC'],
    },
    layers: createSearchLayers('Dates checked', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Phantom of the Opera',
      subtitle: 'Oct 9, 2026 · His Majesty\'s Theatre · London',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Royal Circle, 2 tickets',
          detail: 'Classic seats',
          range: { min: 150, max: 280 },
        },
        {
          iconKey: 'flight',
          label: 'JFK → LHR round-trip',
          detail: 'Direct flights',
          range: { min: 450, max: 750 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights Piccadilly',
          detail: '4★+ theater district',
          range: { min: 320, max: 500 },
        },
      ],
      totalRange: { min: 920, max: 1530 },
    },
  },
  {
    id: 'moulin-rouge',
    category: 'theater',
    query: 'Moulin Rouge musical, Broadway from Miami',
    meta: {
      date: 'May 2026',
      travelers: 2,
      nights: 2,
      origin: 'MIA',
      originCity: 'Miami',
      destination: 'New York',
      understood: ['Broadway', 'Al Hirschfeld Theatre', 'Musical', 'Origin: Miami'],
    },
    layers: createSearchLayers('Dates checked', 'Routes mapped', 'Area scanned'),
    itinerary: {
      title: 'Moulin Rouge! The Musical',
      subtitle: 'May 16, 2026 · Al Hirschfeld Theatre · New York',
      lineItems: [
        {
          iconKey: 'ticket',
          label: 'Orchestra, 2 tickets',
          detail: 'Immersive experience',
          range: { min: 280, max: 450 },
        },
        {
          iconKey: 'flight',
          label: 'MIA → JFK round-trip',
          detail: 'Nonstop options',
          range: { min: 180, max: 320 },
        },
        {
          iconKey: 'hotel',
          label: '2 nights Midtown',
          detail: '4★+ near theater',
          range: { min: 280, max: 450 },
        },
      ],
      totalRange: { min: 740, max: 1220 },
    },
  },
]

// =============================================================================
// Demo Prompts (quick tags)
// =============================================================================

export const demoPrompts: DemoPrompt[] = [
  { label: 'billie eilish', exampleId: 'billie-eilish' },
  { label: 'super bowl', exampleId: 'super-bowl' },
  { label: 'f1 monaco', exampleId: 'f1-monaco' },
  { label: 'el clásico', exampleId: 'el-clasico' },
  { label: 'hamilton', exampleId: 'hamilton-broadway' },
  { label: 'coachella', exampleId: 'coachella' },
  { label: 'bad bunny', exampleId: 'bad-bunny' },
  { label: 'wicked', exampleId: 'wicked-london' },
]

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get a specific example by ID
 */
export function getExampleById(id: string): DemoExample | undefined {
  return demoExamples.find((ex) => ex.id === id)
}

/**
 * Get all examples for a category
 */
export function getExamplesByCategory(category: DemoCategory): DemoExample[] {
  return demoExamples.filter((ex) => ex.category === category)
}

/**
 * Get the first example for a category
 */
export function getFirstExampleForCategory(category: DemoCategory): DemoExample | undefined {
  return demoExamples.find((ex) => ex.category === category)
}

/**
 * Get a random example from a category
 */
export function getRandomExampleForCategory(category: DemoCategory): DemoExample {
  const examples = getExamplesByCategory(category)
  return examples[Math.floor(Math.random() * examples.length)]
}

/**
 * Get the next example in a category (cycles)
 */
export function getNextExampleInCategory(currentId: string, category: DemoCategory): DemoExample {
  const examples = getExamplesByCategory(category)
  const currentIndex = examples.findIndex((ex) => ex.id === currentId)
  const nextIndex = (currentIndex + 1) % examples.length
  return examples[nextIndex]
}

/**
 * Format a price range for display
 */
export function formatPriceRange(range: { min: number; max: number }): string {
  if (range.min === 0 && range.max === 0) {
    return 'Included'
  }
  if (range.min === range.max) {
    return `~$${range.min.toLocaleString()}`
  }
  return `~$${range.min.toLocaleString()}–${range.max.toLocaleString()}`
}

/**
 * Calculate total range from line items
 */
export function calculateTotalRange(
  items: Array<{ range: { min: number; max: number } }>
): { min: number; max: number } {
  return items.reduce(
    (acc, item) => ({
      min: acc.min + item.range.min,
      max: acc.max + item.range.max,
    }),
    { min: 0, max: 0 }
  )
}

// =============================================================================
// Default Export
// =============================================================================

export const defaultExample = demoExamples[0] // Lakers vs Celtics
