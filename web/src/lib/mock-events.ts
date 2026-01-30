import type { EventResult, EventSearchParams, EventSearchResult, Showtime } from '@/hooks/use-event-search'

// =============================================================================
// Image pools by genre (stable Unsplash CDN URLs)
// =============================================================================

const CATEGORY_IMAGES: Record<string, string[]> = {
  Basketball: [
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=400&h=225&fit=crop',
  ],
  Football: [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=400&h=225&fit=crop',
  ],
  Baseball: [
    'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1529768167801-9173d94c2a42?w=400&h=225&fit=crop',
  ],
  Hockey: [
    'https://images.unsplash.com/photo-1580692475446-c2fabbbbf835?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1515703407324-5f753afd8be8?w=400&h=225&fit=crop',
  ],
  Soccer: [
    'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=225&fit=crop',
  ],
  Pop: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop',
  ],
  'Hip-Hop/Rap': [
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
  ],
  'R&B': [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop',
  ],
  Latin: [
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=225&fit=crop',
  ],
  Alternative: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&h=225&fit=crop',
  ],
  Country: [
    'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=225&fit=crop',
  ],
  Theatre: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=400&h=225&fit=crop',
  ],
  Comedy: [
    'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=400&h=225&fit=crop',
    'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=400&h=225&fit=crop',
  ],
}

function getImageForEvent(genre: string | null, index: number): string {
  const pool = (genre && CATEGORY_IMAGES[genre]) || CATEGORY_IMAGES['Pop']
  return pool[index % pool.length]
}

// =============================================================================
// Showtime generation
// =============================================================================

function generateShowtimes(eventId: string, baseDate: string, baseTime: string): Showtime[] {
  const base = new Date(baseDate + 'T00:00:00')
  const offsets = [0, 3, 7, 14, 21]
  // Deterministic count (3-5) based on last char of ID
  const count = 3 + (eventId.charCodeAt(eventId.length - 1) % 3)
  const times = [baseTime, '14:00:00', '19:30:00', '20:00:00', '13:00:00']

  return offsets.slice(0, count).map((dayOffset, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + dayOffset)
    const dateStr = d.toISOString().slice(0, 10)
    return {
      id: `${eventId}_st${i + 1}`,
      date: dateStr,
      time: i === 0 ? baseTime : times[i % times.length],
    }
  })
}

// =============================================================================
// 50 mock events across all categories
// =============================================================================

export const MOCK_EVENTS: EventResult[] = [
  // ---------------------------------------------------------------------------
  // NBA (6)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_nba_001', name: 'Los Angeles Lakers vs Boston Celtics',
    date: '2026-02-08', time: '19:30:00',
    venue: { name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', address: '1111 S Figueroa St' },
    image_url: null, price_range: { min: 110, max: 420, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_001',
  },
  {
    id: 'mock_nba_002', name: 'Golden State Warriors vs Denver Nuggets',
    date: '2026-02-22', time: '12:30:00',
    venue: { name: 'Chase Center', city: 'San Francisco', state: 'CA', address: '1 Warriors Way' },
    image_url: null, price_range: { min: 95, max: 360, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_002',
  },
  {
    id: 'mock_nba_003', name: 'New York Knicks vs Philadelphia 76ers',
    date: '2026-02-14', time: '19:00:00',
    venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY', address: '4 Pennsylvania Plaza' },
    image_url: null, price_range: { min: 130, max: 500, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_003',
  },
  {
    id: 'mock_nba_004', name: 'Milwaukee Bucks vs Miami Heat',
    date: '2026-03-01', time: '19:30:00',
    venue: { name: 'Fiserv Forum', city: 'Milwaukee', state: 'WI', address: '1111 Vel R. Phillips Ave' },
    image_url: null, price_range: { min: 75, max: 280, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_004',
  },
  {
    id: 'mock_nba_005', name: 'Phoenix Suns vs Dallas Mavericks',
    date: '2026-03-10', time: '20:00:00',
    venue: { name: 'Footprint Center', city: 'Phoenix', state: 'AZ', address: '201 E Jefferson St' },
    image_url: null, price_range: { min: 80, max: 310, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_005',
  },
  {
    id: 'mock_nba_006', name: 'Chicago Bulls vs Cleveland Cavaliers',
    date: '2026-03-15', time: '19:00:00',
    venue: { name: 'United Center', city: 'Chicago', state: 'IL', address: '1901 W Madison St' },
    image_url: null, price_range: { min: 65, max: 250, currency: 'USD' },
    purchase_url: '#', genre: 'Basketball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nba_006',
  },

  // ---------------------------------------------------------------------------
  // NFL (6)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_nfl_001', name: 'San Francisco 49ers vs Seattle Seahawks',
    date: '2026-10-18', time: '13:25:00',
    venue: { name: "Levi's Stadium", city: 'Santa Clara', state: 'CA', address: '4900 Marie P DeBartolo Way' },
    image_url: null, price_range: { min: 140, max: 650, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_001',
  },
  {
    id: 'mock_nfl_002', name: 'Kansas City Chiefs vs Buffalo Bills',
    date: '2026-11-01', time: '16:25:00',
    venue: { name: 'GEHA Field at Arrowhead Stadium', city: 'Kansas City', state: 'MO', address: '1 Arrowhead Dr' },
    image_url: null, price_range: { min: 160, max: 700, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_002',
  },
  {
    id: 'mock_nfl_003', name: 'Dallas Cowboys vs Philadelphia Eagles',
    date: '2026-10-25', time: '20:15:00',
    venue: { name: 'AT&T Stadium', city: 'Arlington', state: 'TX', address: '1 AT&T Way' },
    image_url: null, price_range: { min: 175, max: 800, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_003',
  },
  {
    id: 'mock_nfl_004', name: 'Los Angeles Rams vs Arizona Cardinals',
    date: '2026-11-08', time: '13:05:00',
    venue: { name: 'SoFi Stadium', city: 'Inglewood', state: 'CA', address: '1001 Stadium Dr' },
    image_url: null, price_range: { min: 120, max: 550, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_004',
  },
  {
    id: 'mock_nfl_005', name: 'Green Bay Packers vs Chicago Bears',
    date: '2026-11-15', time: '12:00:00',
    venue: { name: 'Lambeau Field', city: 'Green Bay', state: 'WI', address: '1265 Lombardi Ave' },
    image_url: null, price_range: { min: 130, max: 480, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_005',
  },
  {
    id: 'mock_nfl_006', name: 'Miami Dolphins vs New York Jets',
    date: '2026-12-06', time: '13:00:00',
    venue: { name: 'Hard Rock Stadium', city: 'Miami Gardens', state: 'FL', address: '347 Don Shula Dr' },
    image_url: null, price_range: { min: 95, max: 400, currency: 'USD' },
    purchase_url: '#', genre: 'Football', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nfl_006',
  },

  // ---------------------------------------------------------------------------
  // MLB (5)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_mlb_001', name: 'New York Yankees vs Boston Red Sox',
    date: '2026-06-12', time: '19:05:00',
    venue: { name: 'Yankee Stadium', city: 'New York', state: 'NY', address: '1 E 161st St' },
    image_url: null, price_range: { min: 60, max: 310, currency: 'USD' },
    purchase_url: '#', genre: 'Baseball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_mlb_001',
  },
  {
    id: 'mock_mlb_002', name: 'Los Angeles Dodgers vs San Francisco Giants',
    date: '2026-07-04', time: '18:10:00',
    venue: { name: 'Dodger Stadium', city: 'Los Angeles', state: 'CA', address: '1000 Vin Scully Ave' },
    image_url: null, price_range: { min: 55, max: 280, currency: 'USD' },
    purchase_url: '#', genre: 'Baseball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_mlb_002',
  },
  {
    id: 'mock_mlb_003', name: 'Chicago Cubs vs St. Louis Cardinals',
    date: '2026-06-20', time: '13:20:00',
    venue: { name: 'Wrigley Field', city: 'Chicago', state: 'IL', address: '1060 W Addison St' },
    image_url: null, price_range: { min: 50, max: 240, currency: 'USD' },
    purchase_url: '#', genre: 'Baseball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_mlb_003',
  },
  {
    id: 'mock_mlb_004', name: 'Houston Astros vs Texas Rangers',
    date: '2026-08-15', time: '19:10:00',
    venue: { name: 'Minute Maid Park', city: 'Houston', state: 'TX', address: '501 Crawford St' },
    image_url: null, price_range: { min: 45, max: 220, currency: 'USD' },
    purchase_url: '#', genre: 'Baseball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_mlb_004',
  },
  {
    id: 'mock_mlb_005', name: 'New York Mets vs Atlanta Braves',
    date: '2026-05-30', time: '19:10:00',
    venue: { name: 'Citi Field', city: 'New York', state: 'NY', address: '41 Seaver Way' },
    image_url: null, price_range: { min: 40, max: 200, currency: 'USD' },
    purchase_url: '#', genre: 'Baseball', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_mlb_005',
  },

  // ---------------------------------------------------------------------------
  // NHL (5)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_nhl_001', name: 'New York Rangers vs New Jersey Devils',
    date: '2026-01-30', time: '19:00:00',
    venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY', address: '4 Pennsylvania Plaza' },
    image_url: null, price_range: { min: 85, max: 420, currency: 'USD' },
    purchase_url: '#', genre: 'Hockey', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nhl_001',
  },
  {
    id: 'mock_nhl_002', name: 'Boston Bruins vs Montreal Canadiens',
    date: '2026-02-05', time: '19:00:00',
    venue: { name: 'TD Garden', city: 'Boston', state: 'MA', address: '100 Legends Way' },
    image_url: null, price_range: { min: 90, max: 380, currency: 'USD' },
    purchase_url: '#', genre: 'Hockey', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nhl_002',
  },
  {
    id: 'mock_nhl_003', name: 'Chicago Blackhawks vs St. Louis Blues',
    date: '2026-02-12', time: '19:30:00',
    venue: { name: 'United Center', city: 'Chicago', state: 'IL', address: '1901 W Madison St' },
    image_url: null, price_range: { min: 55, max: 260, currency: 'USD' },
    purchase_url: '#', genre: 'Hockey', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nhl_003',
  },
  {
    id: 'mock_nhl_004', name: 'Pittsburgh Penguins vs Washington Capitals',
    date: '2026-02-20', time: '19:00:00',
    venue: { name: 'PPG Paints Arena', city: 'Pittsburgh', state: 'PA', address: '1001 Fifth Ave' },
    image_url: null, price_range: { min: 70, max: 320, currency: 'USD' },
    purchase_url: '#', genre: 'Hockey', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nhl_004',
  },
  {
    id: 'mock_nhl_005', name: 'Los Angeles Kings vs Anaheim Ducks',
    date: '2026-03-05', time: '19:30:00',
    venue: { name: 'Crypto.com Arena', city: 'Los Angeles', state: 'CA', address: '1111 S Figueroa St' },
    image_url: null, price_range: { min: 60, max: 250, currency: 'USD' },
    purchase_url: '#', genre: 'Hockey', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_nhl_005',
  },

  // ---------------------------------------------------------------------------
  // Soccer (5)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_soccer_001', name: 'LA Galaxy vs Seattle Sounders FC',
    date: '2026-04-04', time: '19:30:00',
    venue: { name: 'Dignity Health Sports Park', city: 'Carson', state: 'CA', address: '18400 S Avalon Blvd' },
    image_url: null, price_range: { min: 45, max: 220, currency: 'USD' },
    purchase_url: '#', genre: 'Soccer', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_soccer_001',
  },
  {
    id: 'mock_soccer_002', name: 'LAFC vs Austin FC',
    date: '2026-04-18', time: '19:30:00',
    venue: { name: 'BMO Stadium', city: 'Los Angeles', state: 'CA', address: '3939 S Figueroa St' },
    image_url: null, price_range: { min: 50, max: 250, currency: 'USD' },
    purchase_url: '#', genre: 'Soccer', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_soccer_002',
  },
  {
    id: 'mock_soccer_003', name: 'Inter Miami CF vs New York City FC',
    date: '2026-05-02', time: '19:30:00',
    venue: { name: 'Chase Stadium', city: 'Fort Lauderdale', state: 'FL', address: '1350 NW 55th St' },
    image_url: null, price_range: { min: 65, max: 350, currency: 'USD' },
    purchase_url: '#', genre: 'Soccer', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_soccer_003',
  },
  {
    id: 'mock_soccer_004', name: 'Atlanta United FC vs Nashville SC',
    date: '2026-05-16', time: '19:30:00',
    venue: { name: 'Mercedes-Benz Stadium', city: 'Atlanta', state: 'GA', address: '1 AMB Dr NW' },
    image_url: null, price_range: { min: 35, max: 180, currency: 'USD' },
    purchase_url: '#', genre: 'Soccer', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_soccer_004',
  },
  {
    id: 'mock_soccer_005', name: 'Portland Timbers vs Vancouver Whitecaps',
    date: '2026-06-06', time: '19:30:00',
    venue: { name: 'Providence Park', city: 'Portland', state: 'OR', address: '1844 SW Morrison St' },
    image_url: null, price_range: { min: 30, max: 150, currency: 'USD' },
    purchase_url: '#', genre: 'Soccer', segment: 'Sports', status: 'onsale',
    provider: 'mock', provider_id: 'mock_soccer_005',
  },

  // ---------------------------------------------------------------------------
  // Concerts (12)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_concert_001', name: 'Bad Bunny — Most Wanted Tour',
    date: '2026-03-21', time: '20:00:00',
    venue: { name: 'Kaseya Center', city: 'Miami', state: 'FL', address: '601 Biscayne Blvd' },
    image_url: null, price_range: { min: 120, max: 550, currency: 'USD' },
    purchase_url: '#', genre: 'Latin', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_001',
  },
  {
    id: 'mock_concert_002', name: 'Taylor Swift — The Eras Tour (Extended)',
    date: '2026-07-18', time: '19:30:00',
    venue: { name: 'Soldier Field', city: 'Chicago', state: 'IL', address: '1410 Special Olympics Dr' },
    image_url: null, price_range: { min: 180, max: 900, currency: 'USD' },
    purchase_url: '#', genre: 'Pop', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_002',
  },
  {
    id: 'mock_concert_003', name: 'Drake — For All The Dogs Tour',
    date: '2026-04-12', time: '20:30:00',
    venue: { name: 'Barclays Center', city: 'Brooklyn', state: 'NY', address: '620 Atlantic Ave' },
    image_url: null, price_range: { min: 95, max: 480, currency: 'USD' },
    purchase_url: '#', genre: 'Hip-Hop/Rap', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_003',
  },
  {
    id: 'mock_concert_004', name: 'Beyoncé — Renaissance World Tour II',
    date: '2026-06-28', time: '20:00:00',
    venue: { name: 'SoFi Stadium', city: 'Inglewood', state: 'CA', address: '1001 Stadium Dr' },
    image_url: null, price_range: { min: 200, max: 1200, currency: 'USD' },
    purchase_url: '#', genre: 'R&B', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_004',
  },
  {
    id: 'mock_concert_005', name: 'Kendrick Lamar — Grand National Tour',
    date: '2026-05-10', time: '20:00:00',
    venue: { name: 'The Forum', city: 'Inglewood', state: 'CA', address: '3900 W Manchester Blvd' },
    image_url: null, price_range: { min: 110, max: 520, currency: 'USD' },
    purchase_url: '#', genre: 'Hip-Hop/Rap', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_005',
  },
  {
    id: 'mock_concert_006', name: 'Billie Eilish — Hit Me Hard and Soft Tour',
    date: '2026-08-02', time: '19:30:00',
    venue: { name: 'Climate Pledge Arena', city: 'Seattle', state: 'WA', address: '334 1st Ave N' },
    image_url: null, price_range: { min: 85, max: 400, currency: 'USD' },
    purchase_url: '#', genre: 'Alternative', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_006',
  },
  {
    id: 'mock_concert_007', name: 'The Weeknd — After Hours Til Dawn',
    date: '2026-09-14', time: '20:30:00',
    venue: { name: 'MetLife Stadium', city: 'East Rutherford', state: 'NJ', address: '1 MetLife Stadium Dr' },
    image_url: null, price_range: { min: 130, max: 600, currency: 'USD' },
    purchase_url: '#', genre: 'R&B', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_007',
  },
  {
    id: 'mock_concert_008', name: 'Dua Lipa — Radical Optimism Tour',
    date: '2026-04-25', time: '20:00:00',
    venue: { name: 'TD Garden', city: 'Boston', state: 'MA', address: '100 Legends Way' },
    image_url: null, price_range: { min: 90, max: 420, currency: 'USD' },
    purchase_url: '#', genre: 'Pop', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_008',
  },
  {
    id: 'mock_concert_009', name: 'SZA — SOS North American Tour',
    date: '2026-03-08', time: '20:00:00',
    venue: { name: 'State Farm Arena', city: 'Atlanta', state: 'GA', address: '1 State Farm Dr' },
    image_url: null, price_range: { min: 75, max: 350, currency: 'USD' },
    purchase_url: '#', genre: 'R&B', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_009',
  },
  {
    id: 'mock_concert_010', name: 'Morgan Wallen — One Night At A Time',
    date: '2026-06-14', time: '19:00:00',
    venue: { name: 'Nissan Stadium', city: 'Nashville', state: 'TN', address: '1 Titans Way' },
    image_url: null, price_range: { min: 70, max: 380, currency: 'USD' },
    purchase_url: '#', genre: 'Country', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_010',
  },
  {
    id: 'mock_concert_011', name: 'Olivia Rodrigo — GUTS World Tour',
    date: '2026-05-22', time: '19:30:00',
    venue: { name: 'United Center', city: 'Chicago', state: 'IL', address: '1901 W Madison St' },
    image_url: null, price_range: { min: 80, max: 360, currency: 'USD' },
    purchase_url: '#', genre: 'Pop', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_011',
  },
  {
    id: 'mock_concert_012', name: 'Sabrina Carpenter — Short n\' Sweet Tour',
    date: '2026-08-20', time: '20:00:00',
    venue: { name: 'Madison Square Garden', city: 'New York', state: 'NY', address: '4 Pennsylvania Plaza' },
    image_url: null, price_range: { min: 85, max: 400, currency: 'USD' },
    purchase_url: '#', genre: 'Pop', segment: 'Music', status: 'onsale',
    provider: 'mock', provider_id: 'mock_concert_012',
  },

  // ---------------------------------------------------------------------------
  // Theater (6)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_theater_001', name: 'Hamilton',
    date: '2026-02-06', time: '19:00:00',
    venue: { name: 'Richard Rodgers Theatre', city: 'New York', state: 'NY', address: '226 W 46th St' },
    image_url: null, price_range: { min: 145, max: 420, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_001',
  },
  {
    id: 'mock_theater_002', name: 'Wicked',
    date: '2026-02-10', time: '19:00:00',
    venue: { name: 'Gershwin Theatre', city: 'New York', state: 'NY', address: '222 W 51st St' },
    image_url: null, price_range: { min: 120, max: 380, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_002',
  },
  {
    id: 'mock_theater_003', name: 'The Lion King',
    date: '2026-02-15', time: '14:00:00',
    venue: { name: 'Minskoff Theatre', city: 'New York', state: 'NY', address: '200 W 45th St' },
    image_url: null, price_range: { min: 100, max: 340, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_003',
  },
  {
    id: 'mock_theater_004', name: 'Hadestown',
    date: '2026-03-07', time: '20:00:00',
    venue: { name: 'Walter Kerr Theatre', city: 'New York', state: 'NY', address: '219 W 48th St' },
    image_url: null, price_range: { min: 80, max: 280, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_004',
  },
  {
    id: 'mock_theater_005', name: 'Chicago — The Musical',
    date: '2026-03-14', time: '19:00:00',
    venue: { name: 'Ambassador Theatre', city: 'New York', state: 'NY', address: '219 W 49th St' },
    image_url: null, price_range: { min: 70, max: 220, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_005',
  },
  {
    id: 'mock_theater_006', name: 'Dear Evan Hansen',
    date: '2026-04-01', time: '19:30:00',
    venue: { name: 'Ahmanson Theatre', city: 'Los Angeles', state: 'CA', address: '135 N Grand Ave' },
    image_url: null, price_range: { min: 60, max: 240, currency: 'USD' },
    purchase_url: '#', genre: 'Theatre', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_theater_006',
  },

  // ---------------------------------------------------------------------------
  // Comedy (5)
  // ---------------------------------------------------------------------------
  {
    id: 'mock_comedy_001', name: 'Dave Chappelle — Live',
    date: '2026-02-28', time: '21:00:00',
    venue: { name: 'Radio City Music Hall', city: 'New York', state: 'NY', address: '1260 6th Ave' },
    image_url: null, price_range: { min: 95, max: 350, currency: 'USD' },
    purchase_url: '#', genre: 'Comedy', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_comedy_001',
  },
  {
    id: 'mock_comedy_002', name: 'John Mulaney — Everybody\'s in L.A. Again',
    date: '2026-03-20', time: '20:00:00',
    venue: { name: 'The Forum', city: 'Inglewood', state: 'CA', address: '3900 W Manchester Blvd' },
    image_url: null, price_range: { min: 80, max: 280, currency: 'USD' },
    purchase_url: '#', genre: 'Comedy', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_comedy_002',
  },
  {
    id: 'mock_comedy_003', name: 'Ali Wong — In Living Color Tour',
    date: '2026-04-10', time: '20:00:00',
    venue: { name: 'The Masonic', city: 'San Francisco', state: 'CA', address: '1111 California St' },
    image_url: null, price_range: { min: 65, max: 220, currency: 'USD' },
    purchase_url: '#', genre: 'Comedy', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_comedy_003',
  },
  {
    id: 'mock_comedy_004', name: 'Nate Bargatze — The Big Dumb Tour',
    date: '2026-05-08', time: '20:00:00',
    venue: { name: 'Moody Theater', city: 'Austin', state: 'TX', address: '310 W Willie Nelson Blvd' },
    image_url: null, price_range: { min: 55, max: 180, currency: 'USD' },
    purchase_url: '#', genre: 'Comedy', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_comedy_004',
  },
  {
    id: 'mock_comedy_005', name: 'Trevor Noah — Off the Record Tour',
    date: '2026-06-20', time: '20:00:00',
    venue: { name: 'DAR Constitution Hall', city: 'Washington', state: 'DC', address: '1776 D St NW' },
    image_url: null, price_range: { min: 70, max: 250, currency: 'USD' },
    purchase_url: '#', genre: 'Comedy', segment: 'Arts & Theatre', status: 'onsale',
    provider: 'mock', provider_id: 'mock_comedy_005',
  },
]

// Enrich mock events with images and showtimes
MOCK_EVENTS.forEach((event, i) => {
  event.image_url = getImageForEvent(event.genre, i)
  event.showtimes = generateShowtimes(event.id, event.date, event.time ?? '19:00:00')
})

// =============================================================================
// Client-side filtering (mirrors API behavior)
// =============================================================================

export function filterMockEvents(params: EventSearchParams): EventSearchResult {
  let filtered = MOCK_EVENTS

  // Filter by segment
  if (params.segment) {
    filtered = filtered.filter(e => e.segment === params.segment)
  }

  // Filter by genre
  if (params.genre) {
    filtered = filtered.filter(e => e.genre === params.genre)
  }

  // Filter by keyword (match name, venue name, city)
  if (params.q) {
    const q = params.q.toLowerCase()
    filtered = filtered.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.venue?.name.toLowerCase().includes(q) ||
      e.venue?.city?.toLowerCase().includes(q)
    )
  }

  // Filter by city
  if (params.city) {
    const city = params.city.toLowerCase()
    filtered = filtered.filter(e =>
      e.venue?.city?.toLowerCase().includes(city) ||
      e.venue?.state?.toLowerCase().includes(city)
    )
  }

  // Filter by date range
  if (params.dateFrom) {
    filtered = filtered.filter(e => e.date >= params.dateFrom!)
  }
  if (params.dateTo) {
    filtered = filtered.filter(e => e.date <= params.dateTo!)
  }

  // Sort by date
  filtered.sort((a, b) => a.date.localeCompare(b.date))

  // Paginate
  const size = params.size || 20
  const page = params.page || 0
  const start = page * size
  const paged = filtered.slice(start, start + size)

  return {
    events: paged,
    totalCount: filtered.length,
    page,
    pageSize: size,
    totalPages: Math.ceil(filtered.length / size),
  }
}
