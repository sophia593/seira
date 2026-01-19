// =============================================================================
// Soccer / Football Team Colors - European Leagues
// =============================================================================
// Premier League, La Liga, Bundesliga, Serie A, Ligue 1
// =============================================================================

// -----------------------------------------------------------------------------
// Premier League Teams (20)
// -----------------------------------------------------------------------------
export const premierLeague = {
  'arsenal': '#EF0107',
  'aston-villa': '#95BFE5',
  'bournemouth': '#DA291C',
  'brentford': '#E30613',
  'brighton': '#0057B8',
  'burnley': '#6C1D45',
  'chelsea': '#034694',
  'crystal-palace': '#1B458F',
  'everton': '#003399',
  'fulham': '#000000',
  'liverpool': '#C8102E',
  'luton-town': '#F78F1E',
  'manchester-city': '#6CABDD',
  'manchester-united': '#DA291C',
  'newcastle': '#241F20',
  'nottingham-forest': '#DD0000',
  'sheffield-united': '#EE2737',
  'tottenham': '#132257',
  'west-ham': '#7A263A',
  'wolves': '#FDB913',
} as const;

// -----------------------------------------------------------------------------
// La Liga Teams (Top 20)
// -----------------------------------------------------------------------------
export const laLiga = {
  'real-madrid': '#FEBE10',
  'barcelona': '#A50044',
  'atletico-madrid': '#CE3524',
  'sevilla': '#F43333',
  'real-betis': '#00954C',
  'real-sociedad': '#143C8B',
  'villarreal': '#FFE114',
  'athletic-bilbao': '#EE2523',
  'valencia': '#EE3524',
  'osasuna': '#0A346F',
  'celta-vigo': '#8AC3EE',
  'espanyol': '#007FC8',
  'getafe': '#005999',
  'rayo-vallecano': '#E53027',
  'mallorca': '#E20613',
  'girona': '#CD2534',
  'almeria': '#E30613',
  'cadiz': '#FFE400',
  'las-palmas': '#FFE400',
  'alaves': '#003DA5',
} as const;

// -----------------------------------------------------------------------------
// Bundesliga Teams (18)
// -----------------------------------------------------------------------------
export const bundesliga = {
  'bayern-munich': '#DC052D',
  'borussia-dortmund': '#FDE100',
  'rb-leipzig': '#DD0741',
  'bayer-leverkusen': '#E32221',
  'eintracht-frankfurt': '#E1000F',
  'wolfsburg': '#65B32E',
  'borussia-monchengladbach': '#000000',
  'hoffenheim': '#1961B5',
  'freiburg': '#000000',
  'union-berlin': '#EB1923',
  'mainz': '#C3141E',
  'koln': '#ED1C24',
  'augsburg': '#BA3733',
  'werder-bremen': '#1D9053',
  'bochum': '#005BA5',
  'stuttgart': '#E32219',
  'heidenheim': '#004A99',
  'darmstadt': '#004B93',
} as const;

// -----------------------------------------------------------------------------
// Serie A Teams (20)
// -----------------------------------------------------------------------------
export const serieA = {
  'juventus': '#000000',
  'inter-milan': '#0068A8',
  'ac-milan': '#FB090B',
  'napoli': '#12A0D7',
  'roma': '#8E1F2F',
  'lazio': '#87D8F7',
  'atalanta': '#1E71B8',
  'fiorentina': '#482E92',
  'torino': '#8B0000',
  'bologna': '#1A2F48',
  'monza': '#EE3124',
  'udinese': '#000000',
  'sassuolo': '#00A651',
  'empoli': '#005BA9',
  'salernitana': '#8B0000',
  'lecce': '#FFE600',
  'verona': '#003DA5',
  'cagliari': '#9D2235',
  'genoa': '#A50034',
  'frosinone': '#FFE600',
} as const;

// -----------------------------------------------------------------------------
// Ligue 1 Teams (Top 10)
// -----------------------------------------------------------------------------
export const ligue1 = {
  'paris-saint-germain': '#004170',
  'marseille': '#2FAEE0',
  'monaco': '#E30613',
  'lyon': '#004170',
  'lille': '#E30613',
  'nice': '#000000',
  'lens': '#FFE600',
  'rennes': '#E30613',
  'nantes': '#FCDD09',
  'strasbourg': '#009FE3',
} as const;

// -----------------------------------------------------------------------------
// Champions League / Europa League
// -----------------------------------------------------------------------------
export const euroCompetitions = {
  'champions-league': '#1B3B6F',
  'europa-league': '#F68E1F',
  'conference-league': '#00A14E',
} as const;

// -----------------------------------------------------------------------------
// International Teams (World Cup / Euros)
// -----------------------------------------------------------------------------
export const international = {
  'england': '#FFFFFF',
  'france': '#002654',
  'germany': '#000000',
  'spain': '#AA151B',
  'italy': '#009246',
  'brazil': '#009C3B',
  'argentina': '#74ACDF',
  'portugal': '#006600',
  'netherlands': '#FF6600',
  'belgium': '#ED2939',
  'mexico': '#006847',
  'usa': '#002868',
} as const;

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------
export type PremierLeagueTeam = keyof typeof premierLeague;
export type LaLigaTeam = keyof typeof laLiga;
export type BundesligaTeam = keyof typeof bundesliga;
export type SerieATeam = keyof typeof serieA;
export type Ligue1Team = keyof typeof ligue1;
export type InternationalTeam = keyof typeof international;
