// =============================================================================
// Motorsports, Combat Sports & Individual Sports Colors
// =============================================================================
// F1, NASCAR, IndyCar, UFC, Boxing, Tennis, Golf
// =============================================================================

// -----------------------------------------------------------------------------
// F1 Teams (10 + Default)
// -----------------------------------------------------------------------------
export const f1 = {
  // 2024 Grid
  'red-bull': '#3671C6',
  'mercedes': '#27F4D2',
  'ferrari': '#E8002D',
  'mclaren': '#FF8000',
  'aston-martin': '#229971',
  'alpine': '#FF87BC',
  'williams': '#64C4FF',
  'rb': '#6692FF', // formerly AlphaTauri
  'kick-sauber': '#52E252', // formerly Alfa Romeo
  'haas': '#B6BABD',

  // Generic F1 accent (for "F1" or "Formula 1" queries)
  'f1-default': '#E10600',
  'formula-1': '#E10600',

  // F1 Grand Prix circuits
  'monaco-gp': '#E10600',
  'silverstone': '#E10600',
  'monza': '#E10600',
  'spa': '#E10600',
  'cota': '#E10600', // Circuit of the Americas
  'miami-gp': '#E10600',
  'vegas-gp': '#E10600',
  'singapore-gp': '#E10600',
  'suzuka': '#E10600',
  'abu-dhabi-gp': '#E10600',
} as const;

// -----------------------------------------------------------------------------
// NASCAR
// -----------------------------------------------------------------------------
export const nascar = {
  'nascar-default': '#FECD00',
  'nascar-cup': '#FECD00',
  'daytona-500': '#FECD00',
  'daytona': '#FECD00',
  'talladega': '#FECD00',
  'bristol': '#FECD00',
  'charlotte': '#FECD00',

  // Top drivers (by team colors)
  'hendrick-motorsports': '#24348A',
  'joe-gibbs-racing': '#CC0000',
  'team-penske': '#0033A0',
  '23xi-racing': '#1A1A1A',
  'trackhouse-racing': '#00843D',
} as const;

// -----------------------------------------------------------------------------
// IndyCar
// -----------------------------------------------------------------------------
export const indycar = {
  'indycar-default': '#DA291C',
  'indy-500': '#002F6C',
  'indianapolis-500': '#002F6C',

  // Top teams
  'team-penske-indy': '#0033A0',
  'chip-ganassi': '#D50032',
  'andretti': '#002F6C',
  'arrow-mclaren': '#FF8000',
} as const;

// -----------------------------------------------------------------------------
// MotoGP
// -----------------------------------------------------------------------------
export const motogp = {
  'motogp-default': '#E10600',
  'ducati': '#E10600',
  'yamaha': '#0033A0',
  'honda-motogp': '#CC0000',
  'aprilia': '#000000',
  'ktm': '#FF6600',
} as const;

// -----------------------------------------------------------------------------
// UFC / MMA
// -----------------------------------------------------------------------------
export const ufc = {
  'ufc-default': '#D20A0A',
  'ufc': '#D20A0A',
  'bellator': '#00A5E3',
  'pfl': '#FFD200',
  'one-championship': '#D4AF37',
} as const;

// -----------------------------------------------------------------------------
// Boxing
// -----------------------------------------------------------------------------
export const boxing = {
  'boxing-default': '#8B0000',
  'wbc': '#00A551',
  'wba': '#8B4513',
  'ibf': '#E41B17',
  'wbo': '#000080',
  'matchroom': '#FFD700',
  'top-rank': '#000000',
  'pbc': '#C0C0C0',
} as const;

// -----------------------------------------------------------------------------
// WWE / Wrestling
// -----------------------------------------------------------------------------
export const wrestling = {
  'wwe': '#000000',
  'wwe-raw': '#E10600',
  'wwe-smackdown': '#003DA5',
  'nxt': '#FFD700',
  'aew': '#000000',
  'wrestlemania': '#FFD700',
  'royal-rumble': '#003DA5',
  'summerslam': '#FF4500',
} as const;

// -----------------------------------------------------------------------------
// Tennis
// -----------------------------------------------------------------------------
export const tennis = {
  'wimbledon': '#006633',
  'us-open': '#3C638E',
  'french-open': '#D35400',
  'roland-garros': '#D35400',
  'australian-open': '#0091D2',
  'atp-tour': '#00A4E4',
  'wta-tour': '#5B2D7A',
  'laver-cup': '#E31E24',
  'davis-cup': '#002A5C',
  'indian-wells': '#FF6B35',
  'miami-open': '#00A3AD',
} as const;

// -----------------------------------------------------------------------------
// Golf
// -----------------------------------------------------------------------------
export const golf = {
  'the-masters': '#006747',
  'masters': '#006747',
  'augusta': '#006747',
  'us-open-golf': '#003865',
  'pga-championship': '#00205B',
  'the-open': '#1E1656',
  'british-open': '#1E1656',
  'ryder-cup': '#00205B',
  'presidents-cup': '#002F6C',
  'pga-tour': '#00205B',
  'liv-golf': '#000000',
  'players-championship': '#003A70',
} as const;

// -----------------------------------------------------------------------------
// Olympics
// -----------------------------------------------------------------------------
export const olympics = {
  'olympics': '#0085C7',
  'summer-olympics': '#0085C7',
  'winter-olympics': '#0085C7',
  'paris-2024': '#7B2D8E',
  'la-2028': '#FFD700',
  'team-usa-olympics': '#002868',
} as const;

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------
export type F1Team = keyof typeof f1;
export type NascarTeam = keyof typeof nascar;
export type IndycarTeam = keyof typeof indycar;
export type UfcEvent = keyof typeof ufc;
export type BoxingOrg = keyof typeof boxing;
export type TennisEvent = keyof typeof tennis;
export type GolfEvent = keyof typeof golf;
