'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { DemoPrompt, DemoCategory } from './types'

// =============================================================================
// Constants
// =============================================================================

const ANIMATION_DURATION = 0.3

// =============================================================================
// Extended Prompt Data
// =============================================================================

/**
 * Comprehensive prompt examples organized by category
 * These are realistic, specific queries users might actually type
 */
export const EXTENDED_PROMPTS: ExtendedPrompt[] = [
  // ---------------------------------------------------------------------------
  // Sports - NBA
  // ---------------------------------------------------------------------------
  {
    id: 'lakers-warriors-christmas',
    exampleId: 'lakers-celtics',
    label: 'lakers vs warriors',
    fullQuery: 'Lakers vs Warriors Christmas Day game, flying from Phoenix with my dad',
    category: 'sports',
    subcategory: 'nba',
    tags: ['nba', 'rivalry', 'holiday'],
    featured: true,
  },
  {
    id: 'celtics-playoffs',
    exampleId: 'lakers-celtics',
    label: 'celtics playoffs',
    fullQuery: 'Boston Celtics playoff tickets, any round, flying from Atlanta',
    category: 'sports',
    subcategory: 'nba',
    tags: ['nba', 'playoffs'],
  },
  {
    id: 'knicks-msg',
    exampleId: 'lakers-celtics',
    label: 'knicks at MSG',
    fullQuery: 'New York Knicks game at Madison Square Garden, weekend in March, coming from DC',
    category: 'sports',
    subcategory: 'nba',
    tags: ['nba', 'iconic venue'],
  },
  {
    id: 'nba-finals',
    exampleId: 'lakers-celtics',
    label: 'NBA finals',
    fullQuery: 'NBA Finals Game 7 if it happens, budget up to $3000 per person',
    category: 'sports',
    subcategory: 'nba',
    tags: ['nba', 'championship', 'premium'],
  },

  // ---------------------------------------------------------------------------
  // Sports - NFL
  // ---------------------------------------------------------------------------
  {
    id: 'super-bowl-2026',
    exampleId: 'super-bowl',
    label: 'super bowl 2026',
    fullQuery: 'Super Bowl 2026 in New Orleans, 4 people flying from Los Angeles, need 3 nights',
    category: 'sports',
    subcategory: 'nfl',
    tags: ['nfl', 'championship'],
    featured: true,
  },
  {
    id: 'cowboys-thanksgiving',
    exampleId: 'super-bowl',
    label: 'cowboys thanksgiving',
    fullQuery: 'Dallas Cowboys Thanksgiving game, family of 4 from Chicago',
    category: 'sports',
    subcategory: 'nfl',
    tags: ['nfl', 'holiday', 'tradition'],
  },
  {
    id: 'packers-lambeau',
    exampleId: 'super-bowl',
    label: 'packers at lambeau',
    fullQuery: 'Green Bay Packers game at Lambeau Field, cold weather experience, from San Diego',
    category: 'sports',
    subcategory: 'nfl',
    tags: ['nfl', 'iconic venue', 'bucket list'],
  },
  {
    id: 'chiefs-arrowhead',
    exampleId: 'super-bowl',
    label: 'chiefs game',
    fullQuery: 'Kansas City Chiefs home game at Arrowhead, want to experience the tailgate culture',
    category: 'sports',
    subcategory: 'nfl',
    tags: ['nfl', 'experience'],
  },

  // ---------------------------------------------------------------------------
  // Sports - Soccer
  // ---------------------------------------------------------------------------
  {
    id: 'el-clasico-madrid',
    exampleId: 'el-clasico',
    label: 'el clásico',
    fullQuery: 'El Clásico Real Madrid vs Barcelona at the Bernabéu, flying from New York',
    category: 'sports',
    subcategory: 'soccer',
    tags: ['soccer', 'rivalry', 'international'],
    featured: true,
  },
  {
    id: 'premier-league-manchester',
    exampleId: 'el-clasico',
    label: 'manchester derby',
    fullQuery: 'Manchester United vs Manchester City derby match, 3 nights in Manchester from Boston',
    category: 'sports',
    subcategory: 'soccer',
    tags: ['soccer', 'premier league', 'derby'],
  },
  {
    id: 'champions-league-final',
    exampleId: 'champions-league-final',
    label: 'UCL final',
    fullQuery: 'UEFA Champions League Final 2026, wherever it is, premium seats',
    category: 'sports',
    subcategory: 'soccer',
    tags: ['soccer', 'championship', 'premium'],
  },
  {
    id: 'world-cup-2026',
    exampleId: 'el-clasico',
    label: 'world cup 2026',
    fullQuery: 'FIFA World Cup 2026 USA matches, preferably in LA or New York',
    category: 'sports',
    subcategory: 'soccer',
    tags: ['soccer', 'world cup', 'historic'],
  },

  // ---------------------------------------------------------------------------
  // Sports - MLB
  // ---------------------------------------------------------------------------
  {
    id: 'yankees-red-sox',
    exampleId: 'world-series',
    label: 'yankees vs red sox',
    fullQuery: 'Yankees vs Red Sox rivalry game at Fenway Park, summer weekend',
    category: 'sports',
    subcategory: 'mlb',
    tags: ['mlb', 'rivalry', 'classic'],
  },
  {
    id: 'world-series',
    exampleId: 'world-series',
    label: 'world series',
    fullQuery: 'World Series tickets, any game, flexible on team and location',
    category: 'sports',
    subcategory: 'mlb',
    tags: ['mlb', 'championship'],
  },
  {
    id: 'cubs-wrigley',
    exampleId: 'world-series',
    label: 'cubs at wrigley',
    fullQuery: 'Chicago Cubs day game at Wrigley Field, rooftop seats if possible, July',
    category: 'sports',
    subcategory: 'mlb',
    tags: ['mlb', 'iconic venue', 'experience'],
  },

  // ---------------------------------------------------------------------------
  // Sports - UFC/Boxing
  // ---------------------------------------------------------------------------
  {
    id: 'ufc-vegas',
    exampleId: 'super-bowl',
    label: 'UFC in vegas',
    fullQuery: 'UFC fight night in Las Vegas, preferably a championship card, 2 nights',
    category: 'sports',
    subcategory: 'combat',
    tags: ['ufc', 'vegas', 'nightlife'],
    featured: true,
  },
  {
    id: 'boxing-heavyweight',
    exampleId: 'super-bowl',
    label: 'heavyweight boxing',
    fullQuery: 'Next big heavyweight boxing match, anywhere in the world, VIP experience',
    category: 'sports',
    subcategory: 'combat',
    tags: ['boxing', 'premium'],
  },

  // ---------------------------------------------------------------------------
  // Concerts - Pop/Top 40
  // ---------------------------------------------------------------------------
  {
    id: 'taylor-swift-eras',
    exampleId: 'taylor-swift',
    label: 'taylor swift',
    fullQuery: 'Taylor Swift Eras Tour, any date on the West Coast, floor seats preferred',
    category: 'concerts',
    subcategory: 'pop',
    tags: ['pop', 'stadium', 'trending'],
    featured: true,
  },
  {
    id: 'beyonce-renaissance',
    exampleId: 'beyonce',
    label: 'beyoncé',
    fullQuery: 'Beyoncé concert, anywhere in the US, want good seats not nosebleeds',
    category: 'concerts',
    subcategory: 'pop',
    tags: ['pop', 'stadium', 'premium'],
  },
  {
    id: 'drake-tour',
    exampleId: 'taylor-swift',
    label: 'drake',
    fullQuery: 'Drake concert in Toronto, want to see him in his hometown',
    category: 'concerts',
    subcategory: 'hiphop',
    tags: ['hiphop', 'hometown'],
  },
  {
    id: 'weeknd-tour',
    exampleId: 'taylor-swift',
    label: 'the weeknd',
    fullQuery: 'The Weeknd After Hours tour, LA or Vegas show, 2 tickets',
    category: 'concerts',
    subcategory: 'pop',
    tags: ['pop', 'r&b'],
  },
  {
    id: 'billie-eilish',
    exampleId: 'taylor-swift',
    label: 'billie eilish',
    fullQuery: 'Billie Eilish concert, somewhere in California, October or November',
    category: 'concerts',
    subcategory: 'pop',
    tags: ['pop', 'alternative'],
  },

  // ---------------------------------------------------------------------------
  // Concerts - Rock/Alternative
  // ---------------------------------------------------------------------------
  {
    id: 'coldplay-spheres',
    exampleId: 'coldplay',
    label: 'coldplay',
    fullQuery: 'Coldplay Music of the Spheres tour, stadium show with the light-up wristbands',
    category: 'concerts',
    subcategory: 'rock',
    tags: ['rock', 'stadium', 'experience'],
  },
  {
    id: 'foo-fighters',
    exampleId: 'coldplay',
    label: 'foo fighters',
    fullQuery: 'Foo Fighters concert, anywhere they\'re playing, GA pit if possible',
    category: 'concerts',
    subcategory: 'rock',
    tags: ['rock', 'legendary'],
  },
  {
    id: 'red-hot-chili-peppers',
    exampleId: 'coldplay',
    label: 'red hot chili peppers',
    fullQuery: 'Red Hot Chili Peppers show, stadium tour, coming from Denver',
    category: 'concerts',
    subcategory: 'rock',
    tags: ['rock', 'stadium'],
  },

  // ---------------------------------------------------------------------------
  // Concerts - Hip Hop/R&B
  // ---------------------------------------------------------------------------
  {
    id: 'bad-bunny-tour',
    exampleId: 'beyonce',
    label: 'bad bunny',
    fullQuery: 'Bad Bunny concert in Miami or Puerto Rico, want the full experience',
    category: 'concerts',
    subcategory: 'latin',
    tags: ['latin', 'reggaeton', 'party'],
    featured: true,
  },
  {
    id: 'kendrick-lamar',
    exampleId: 'beyonce',
    label: 'kendrick lamar',
    fullQuery: 'Kendrick Lamar concert, next tour, West Coast dates',
    category: 'concerts',
    subcategory: 'hiphop',
    tags: ['hiphop', 'lyrical'],
  },
  {
    id: 'sza-tour',
    exampleId: 'beyonce',
    label: 'SZA',
    fullQuery: 'SZA SOS tour, any remaining dates, floor or lower bowl',
    category: 'concerts',
    subcategory: 'rnb',
    tags: ['r&b', 'trending'],
  },

  // ---------------------------------------------------------------------------
  // Concerts - Festivals
  // ---------------------------------------------------------------------------
  {
    id: 'coachella-weekend1',
    exampleId: 'coachella',
    label: 'coachella',
    fullQuery: 'Coachella 2026 Weekend 1, GA passes for 2, need hotel near Palm Springs',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'california', 'experience'],
    featured: true,
  },
  {
    id: 'lollapalooza',
    exampleId: 'coachella',
    label: 'lollapalooza',
    fullQuery: 'Lollapalooza Chicago 4-day pass, 2 people flying from Austin',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'chicago'],
  },
  {
    id: 'rolling-loud',
    exampleId: 'coachella',
    label: 'rolling loud',
    fullQuery: 'Rolling Loud Miami, VIP tickets, group of 4 from New York',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'hiphop', 'miami'],
  },
  {
    id: 'edc-vegas',
    exampleId: 'coachella',
    label: 'EDC vegas',
    fullQuery: 'Electric Daisy Carnival Las Vegas, GA+ pass, first time going',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'edm', 'vegas'],
  },
  {
    id: 'tomorrowland',
    exampleId: 'coachella',
    label: 'tomorrowland',
    fullQuery: 'Tomorrowland Belgium 2026, full madness pass, flying from Chicago',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'edm', 'international', 'bucket list'],
  },
  {
    id: 'glastonbury',
    exampleId: 'coachella',
    label: 'glastonbury',
    fullQuery: 'Glastonbury Festival UK, general admission, need help with UK travel',
    category: 'concerts',
    subcategory: 'festival',
    tags: ['festival', 'uk', 'legendary'],
  },

  // ---------------------------------------------------------------------------
  // Racing - F1
  // ---------------------------------------------------------------------------
  {
    id: 'f1-monaco',
    exampleId: 'f1-monaco',
    label: 'F1 monaco',
    fullQuery: 'Monaco Grand Prix F1, grandstand seats with harbor view, flying from London',
    category: 'racing',
    subcategory: 'f1',
    tags: ['f1', 'monaco', 'luxury'],
    featured: true,
  },
  {
    id: 'f1-austin',
    exampleId: 'f1-monaco',
    label: 'F1 austin',
    fullQuery: 'F1 US Grand Prix at COTA Austin, 3-day pass, turn 1 grandstand',
    category: 'racing',
    subcategory: 'f1',
    tags: ['f1', 'usa', 'experience'],
  },
  {
    id: 'f1-miami',
    exampleId: 'f1-monaco',
    label: 'F1 miami',
    fullQuery: 'Miami Grand Prix F1, beach club access if possible, coming from NYC',
    category: 'racing',
    subcategory: 'f1',
    tags: ['f1', 'miami', 'premium'],
  },
  {
    id: 'f1-vegas',
    exampleId: 'f1-monaco',
    label: 'F1 las vegas',
    fullQuery: 'Las Vegas Grand Prix F1 night race, want the full Vegas experience',
    category: 'racing',
    subcategory: 'f1',
    tags: ['f1', 'vegas', 'nightlife'],
  },
  {
    id: 'f1-singapore',
    exampleId: 'f1-monaco',
    label: 'F1 singapore',
    fullQuery: 'Singapore Grand Prix night race, paddock club or premium seats',
    category: 'racing',
    subcategory: 'f1',
    tags: ['f1', 'international', 'night race'],
  },

  // ---------------------------------------------------------------------------
  // Racing - NASCAR/IndyCar
  // ---------------------------------------------------------------------------
  {
    id: 'daytona-500',
    exampleId: 'f1-monaco',
    label: 'daytona 500',
    fullQuery: 'Daytona 500 NASCAR, pit road access, flying from Chicago',
    category: 'racing',
    subcategory: 'nascar',
    tags: ['nascar', 'classic', 'season opener'],
  },
  {
    id: 'indy-500',
    exampleId: 'f1-monaco',
    label: 'indy 500',
    fullQuery: 'Indianapolis 500, Pagoda seats or Snake Pit, Memorial Day weekend trip',
    category: 'racing',
    subcategory: 'indycar',
    tags: ['indycar', 'historic', 'bucket list'],
    featured: true,
  },
  {
    id: 'talladega',
    exampleId: 'f1-monaco',
    label: 'talladega',
    fullQuery: 'Talladega NASCAR race, infield camping experience, group of 6',
    category: 'racing',
    subcategory: 'nascar',
    tags: ['nascar', 'experience', 'camping'],
  },

  // ---------------------------------------------------------------------------
  // Theater - Broadway
  // ---------------------------------------------------------------------------
  {
    id: 'hamilton-broadway',
    exampleId: 'hamilton-broadway',
    label: 'hamilton',
    fullQuery: 'Hamilton on Broadway NYC, orchestra seats, weekend trip from Boston',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'musical', 'iconic'],
    featured: true,
  },
  {
    id: 'wicked-broadway',
    exampleId: 'hamilton-broadway',
    label: 'wicked',
    fullQuery: 'Wicked on Broadway before it closes for the movie release hype',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'musical', 'classic'],
  },
  {
    id: 'lion-king-broadway',
    exampleId: 'hamilton-broadway',
    label: 'lion king',
    fullQuery: 'Lion King on Broadway, family of 4 including kids, mezzanine or orchestra',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'family', 'classic'],
  },
  {
    id: 'phantom-broadway',
    exampleId: 'hamilton-broadway',
    label: 'phantom of the opera',
    fullQuery: 'Phantom of the Opera, any production still running, classic theater experience',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'classic', 'romantic'],
  },
  {
    id: 'moulin-rouge-broadway',
    exampleId: 'hamilton-broadway',
    label: 'moulin rouge',
    fullQuery: 'Moulin Rouge musical Broadway, want the immersive front orchestra experience',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'musical', 'immersive'],
  },
  {
    id: 'book-of-mormon',
    exampleId: 'hamilton-broadway',
    label: 'book of mormon',
    fullQuery: 'Book of Mormon Broadway, date night trip from Philadelphia',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'comedy'],
  },
  {
    id: 'six-broadway',
    exampleId: 'hamilton-broadway',
    label: 'six the musical',
    fullQuery: 'Six the Musical on Broadway, girls trip, 4 tickets',
    category: 'theater',
    subcategory: 'broadway',
    tags: ['broadway', 'musical', 'trending'],
  },

  // ---------------------------------------------------------------------------
  // Theater - West End
  // ---------------------------------------------------------------------------
  {
    id: 'les-mis-west-end',
    exampleId: 'hamilton-broadway',
    label: 'les misérables london',
    fullQuery: 'Les Misérables West End London, stalls seats, flying from New York',
    category: 'theater',
    subcategory: 'west-end',
    tags: ['west end', 'musical', 'classic'],
  },
  {
    id: 'harry-potter-london',
    exampleId: 'hamilton-broadway',
    label: 'cursed child london',
    fullQuery: 'Harry Potter and the Cursed Child London, both parts, plus Warner Bros studio tour',
    category: 'theater',
    subcategory: 'west-end',
    tags: ['west end', 'experience', 'harry potter'],
    featured: true,
  },
  {
    id: 'matilda-west-end',
    exampleId: 'hamilton-broadway',
    label: 'matilda london',
    fullQuery: 'Matilda the Musical West End, family trip with 2 kids, 3 nights in London',
    category: 'theater',
    subcategory: 'west-end',
    tags: ['west end', 'family', 'musical'],
  },

  // ---------------------------------------------------------------------------
  // Special Events
  // ---------------------------------------------------------------------------
  {
    id: 'new-years-nyc',
    exampleId: 'coachella',
    label: 'new years NYC',
    fullQuery: 'New Year\'s Eve in Times Square NYC, want a good view of the ball drop',
    category: 'concerts',
    subcategory: 'special',
    tags: ['holiday', 'nyc', 'bucket list'],
  },
  {
    id: 'mardi-gras',
    exampleId: 'coachella',
    label: 'mardi gras',
    fullQuery: 'Mardi Gras New Orleans 2026, parade route balcony access, 4 nights',
    category: 'concerts',
    subcategory: 'special',
    tags: ['holiday', 'new orleans', 'experience'],
  },
  {
    id: 'oktoberfest',
    exampleId: 'coachella',
    label: 'oktoberfest munich',
    fullQuery: 'Oktoberfest Munich Germany, tent reservations, flying from Denver',
    category: 'concerts',
    subcategory: 'special',
    tags: ['international', 'festival', 'bucket list'],
  },
  {
    id: 'rio-carnival',
    exampleId: 'coachella',
    label: 'rio carnival',
    fullQuery: 'Rio Carnival Brazil 2026, sambadrome parade tickets plus beach hotel',
    category: 'concerts',
    subcategory: 'special',
    tags: ['international', 'festival', 'bucket list'],
  },
  {
    id: 'running-of-bulls',
    exampleId: 'el-clasico',
    label: 'san fermín',
    fullQuery: 'Running of the Bulls San Fermín Spain, balcony viewing not participating lol',
    category: 'sports',
    subcategory: 'special',
    tags: ['international', 'spain', 'bucket list'],
  },

  // ---------------------------------------------------------------------------
  // Award Shows
  // ---------------------------------------------------------------------------
  {
    id: 'grammys',
    exampleId: 'taylor-swift',
    label: 'grammy awards',
    fullQuery: 'Grammy Awards tickets, any section, plus after-parties if possible',
    category: 'concerts',
    subcategory: 'awards',
    tags: ['awards', 'celebrity', 'la'],
  },
  {
    id: 'oscars',
    exampleId: 'hamilton-broadway',
    label: 'oscars',
    fullQuery: 'Academy Awards viewing experience in LA, red carpet adjacent',
    category: 'theater',
    subcategory: 'awards',
    tags: ['awards', 'celebrity', 'la'],
  },
  {
    id: 'met-gala',
    exampleId: 'taylor-swift',
    label: 'met gala adjacent',
    fullQuery: 'Met Gala night in NYC, rooftop bar with views, fashion week vibes',
    category: 'concerts',
    subcategory: 'awards',
    tags: ['nyc', 'fashion', 'exclusive'],
  },
]

// =============================================================================
// Types
// =============================================================================

interface ExtendedPrompt {
  id: string
  label: string
  exampleId: string
  fullQuery: string
  category: DemoCategory
  subcategory: string
  tags: string[]
  featured?: boolean
}

type PromptFilter = 'all' | DemoCategory

// =============================================================================
// Icon Components
// =============================================================================

interface IconProps {
  className?: string
}

function SearchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SparklesIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

function MusicIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  )
}

function TrophyIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}

function TheaterIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 10s3-3 10-3 10 3 10 3" />
      <path d="M12 21c-4 0-7-3-7-3s3-3 7-3 7 3 7 3-3 3-7 3z" />
      <circle cx="12" cy="13" r="2" />
    </svg>
  )
}

function FlagIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  )
}

function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

// =============================================================================
// Category Config
// =============================================================================

const CATEGORY_CONFIG: Record<PromptFilter, { label: string; icon: React.ReactNode }> = {
  all: { label: 'All', icon: <SparklesIcon /> },
  concerts: { label: 'Concerts', icon: <MusicIcon /> },
  sports: { label: 'Sports', icon: <TrophyIcon /> },
  theater: { label: 'Theater', icon: <TheaterIcon /> },
  racing: { label: 'Racing', icon: <FlagIcon /> },
}

// =============================================================================
// Animation Variants
// =============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
}

const tagVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: ANIMATION_DURATION,
      ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: -8,
    transition: {
      duration: 0.2,
    },
  },
}

// =============================================================================
// Filter Tabs
// =============================================================================

interface FilterTabsProps {
  activeFilter: PromptFilter
  onFilterChange: (filter: PromptFilter) => void
  counts: Record<PromptFilter, number>
}

function FilterTabs({ activeFilter, onFilterChange, counts }: FilterTabsProps) {
  const filters: PromptFilter[] = ['all', 'concerts', 'sports', 'theater', 'racing']

  return (
    <div className="flex items-center justify-center gap-1 mb-5">
      {filters.map((filter) => {
        const config = CATEGORY_CONFIG[filter]
        const isActive = activeFilter === filter
        const count = counts[filter]

        return (
          <button
            key={filter}
            onClick={() => onFilterChange(filter)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium',
              'transition-all duration-200',
              isActive
                ? 'bg-white/[0.08] text-[#e8e4de]'
                : 'text-[#6b6560] hover:text-[#9a958e] hover:bg-white/[0.03]'
            )}
          >
            <span className={cn(isActive ? 'text-[#cfa872]' : 'text-[#5a5550]')}>
              {config.icon}
            </span>
            <span>{config.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-white/[0.08] text-[#9a958e]' : 'text-[#4a4744]'
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// =============================================================================
// Featured Prompts Section
// =============================================================================

interface FeaturedPromptsProps {
  prompts: ExtendedPrompt[]
  onSelect: (prompt: ExtendedPrompt) => void
}

function FeaturedPrompts({ prompts, onSelect }: FeaturedPromptsProps) {
  if (prompts.length === 0) return null

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="text-[#cfa872]" />
        <span className="text-[11px] font-medium text-[#6b6560] uppercase tracking-wider">
          Popular searches
        </span>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {prompts.map((prompt) => (
          <motion.button
            key={prompt.id}
            variants={tagVariants}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(prompt)}
            className={cn(
              'group relative text-[13px] font-medium',
              'bg-gradient-to-r from-[#cfa872]/10 to-[#cfa872]/5',
              'text-[#b5a48a] hover:text-[#e8dcc8]',
              'px-4 py-2.5 rounded-xl',
              'border border-[#cfa872]/20 hover:border-[#cfa872]/30',
              'transition-all duration-200',
              'shadow-sm hover:shadow-md hover:shadow-[#cfa872]/5'
            )}
          >
            <span className="relative z-10">{prompt.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// Prompt Tag
// =============================================================================

interface PromptTagProps {
  prompt: ExtendedPrompt
  onSelect: (prompt: ExtendedPrompt) => void
  showCategory?: boolean
}

function PromptTag({ prompt, onSelect, showCategory = false }: PromptTagProps) {
  const categoryConfig = CATEGORY_CONFIG[prompt.category]

  return (
    <motion.button
      variants={tagVariants}
      layout
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(prompt)}
      className={cn(
        'group flex items-center gap-2',
        'text-[13px] text-[#7a756e] hover:text-[#b5b0a8]',
        'bg-white/[0.03] hover:bg-white/[0.06]',
        'px-4 py-2.5 rounded-xl',
        'border border-white/[0.05] hover:border-white/[0.10]',
        'transition-all duration-200'
      )}
      title={prompt.fullQuery}
    >
      {showCategory && (
        <span className="text-[#5a5550] group-hover:text-[#7a756e] transition-colors">
          {categoryConfig.icon}
        </span>
      )}
      <span>{prompt.label}</span>
    </motion.button>
  )
}

// =============================================================================
// Show More Button
// =============================================================================

interface ShowMoreButtonProps {
  isExpanded: boolean
  onToggle: () => void
  hiddenCount: number
}

function ShowMoreButton({ isExpanded, onToggle, hiddenCount }: ShowMoreButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={onToggle}
      className={cn(
        'flex items-center gap-1.5 mx-auto mt-4',
        'text-xs text-[#5a5550] hover:text-[#7a756e]',
        'px-3 py-1.5 rounded-lg',
        'hover:bg-white/[0.03] transition-colors duration-200'
      )}
    >
      <span>{isExpanded ? 'Show less' : `Show ${hiddenCount} more`}</span>
      <ChevronDownIcon
        className={cn('transition-transform duration-200', isExpanded && 'rotate-180')}
      />
    </motion.button>
  )
}

// =============================================================================
// Main Component
// =============================================================================

interface DemoPromptsProps {
  prompts: DemoPrompt[]
  onSelect: (exampleId: string) => void
  className?: string
  showFilters?: boolean
  showFeatured?: boolean
  initialLimit?: number
}

export default function DemoPrompts({
  prompts,
  onSelect,
  className,
  showFilters = true,
  showFeatured = true,
  initialLimit = 12,
}: DemoPromptsProps) {
  // State
  const [activeFilter, setActiveFilter] = useState<PromptFilter>('all')
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Use extended prompts or fall back to basic prompts
  const allPrompts = useMemo(() => {
    if (EXTENDED_PROMPTS.length > 0) {
      return EXTENDED_PROMPTS
    }
    // Convert basic prompts to extended format
    return prompts.map((p): ExtendedPrompt => ({
      ...p,
      id: p.exampleId,
      fullQuery: p.label,
      category: 'concerts' as DemoCategory,
      subcategory: 'general',
      tags: [],
      featured: false,
    }))
  }, [prompts])

  // Get featured prompts
  const featuredPrompts = useMemo(
    () => allPrompts.filter((p) => p.featured),
    [allPrompts]
  )

  // Filter prompts
  const filteredPrompts = useMemo(() => {
    let filtered = allPrompts

    // Category filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === activeFilter)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.label.toLowerCase().includes(query) ||
          p.fullQuery.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query))
      )
    }

    // Remove featured from main list if showing featured section
    if (showFeatured && activeFilter === 'all') {
      filtered = filtered.filter((p) => !p.featured)
    }

    return filtered
  }, [allPrompts, activeFilter, searchQuery, showFeatured])

  // Counts for filter tabs
  const counts = useMemo(() => {
    return {
      all: allPrompts.length,
      concerts: allPrompts.filter((p) => p.category === 'concerts').length,
      sports: allPrompts.filter((p) => p.category === 'sports').length,
      theater: allPrompts.filter((p) => p.category === 'theater').length,
      racing: allPrompts.filter((p) => p.category === 'racing').length,
    }
  }, [allPrompts])

  // Visible prompts (with limit)
  const visiblePrompts = useMemo(() => {
    if (isExpanded) return filteredPrompts
    return filteredPrompts.slice(0, initialLimit)
  }, [filteredPrompts, isExpanded, initialLimit])

  const hiddenCount = filteredPrompts.length - initialLimit

  // Handlers
  const handleSelect = useCallback(
    (prompt: ExtendedPrompt) => {
      onSelect(prompt.exampleId)
    },
    [onSelect]
  )

  const handleFilterChange = useCallback((filter: PromptFilter) => {
    setActiveFilter(filter)
    setIsExpanded(false)
  }, [])

  return (
    <div className={cn('mt-10', className)}>
      {/* Header */}
      <div className="text-center mb-5">
        <p className="text-xs text-[#4a4744] mb-1">or try one of these</p>
      </div>

      {/* Filter tabs */}
      {showFilters && (
        <FilterTabs
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={counts}
        />
      )}

      {/* Featured prompts */}
      {showFeatured && activeFilter === 'all' && (
        <FeaturedPrompts prompts={featuredPrompts} onSelect={handleSelect} />
      )}

      {/* Prompt tags */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-wrap justify-center gap-2"
      >
        <AnimatePresence mode="popLayout">
          {visiblePrompts.map((prompt) => (
            <PromptTag
              key={prompt.id}
              prompt={prompt}
              onSelect={handleSelect}
              showCategory={activeFilter === 'all'}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Show more button */}
      {hiddenCount > 0 && (
        <ShowMoreButton
          isExpanded={isExpanded}
          onToggle={() => setIsExpanded(!isExpanded)}
          hiddenCount={hiddenCount}
        />
      )}

      {/* Empty state */}
      {filteredPrompts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#5a5550]">No prompts found</p>
          <button
            onClick={() => {
              setActiveFilter('all')
              setSearchQuery('')
            }}
            className="mt-2 text-xs text-[#7a756e] hover:text-[#9a958e] underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Hint text */}
      <p className="text-center text-[10px] text-[#3a3530] mt-6">
        Click any prompt to see how Seira would plan that trip
      </p>
    </div>
  )
}
