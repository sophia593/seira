"""
Gemini client with Search Grounding for real-time web research.

Uses Google's Gemini API with the Search Grounding feature to get
up-to-date information with source citations.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Any

from app.core.config import get_settings
from app.core.redis import cache_get, cache_set

logger = logging.getLogger(__name__)

# Cache TTL for Gemini search results (5 minutes)
GEMINI_CACHE_TTL = 5 * 60


# -----------------------------------------------------------------------------
# Search query types and prompts
# -----------------------------------------------------------------------------

class SearchType(Enum):
    """Types of searches Seira performs, each with tailored prompts."""
    VENUE_INFO = "venue_info"
    RESTAURANT = "restaurant"
    EVENT_DETAILS = "event_details"
    TICKETS = "tickets"
    TRAVEL_TIPS = "travel_tips"
    ACCOMMODATION = "accommodation"
    NIGHTLIFE = "nightlife"
    GENERAL = "general"


# Base context that applies to all searches
def get_base_context() -> str:
    """Get base context with current date for time-aware searches."""
    from datetime import date
    today = date.today()
    today_str = today.strftime("%B %d, %Y")  # e.g., "January 07, 2026"

    return f"""You are researching information for a travel assistant that helps people attend live events (concerts, sports, theater).

Today's date is {today_str}. Use this for any time-relative queries (tonight, this weekend, next month, etc.).

Your job is to find accurate, actionable information. Prioritize:
1. Official venue/team/artist sources over blogs
2. Current information over outdated posts
3. Specific details (prices, times, policies) over vague descriptions
4. Include URLs to official sites when available

Be concise but complete. If information conflicts between sources, note it."""


# Type-specific prompts that guide what details to extract
SEARCH_PROMPTS: dict[SearchType, str] = {
    SearchType.VENUE_INFO: """Find practical venue information. Include if available:
- Official policies (bags, cameras, re-entry, age restrictions)
- Parking options and typical prices
- Public transit access
- Food/drink policies (outside food? cashless?)
- Accessibility features
- Tips for first-time visitors (best entrance, when to arrive)

Focus on official venue sources and recent visitor experiences.""",

    SearchType.RESTAURANT: """Find restaurant recommendations. For each option include:
- Name and proximity to the venue/area
- Cuisine type and price range ($ to $$$$)
- Why it's good for pre/post-event dining (speed, vibe, reservations needed?)
- Any standout dishes or features
- Current hours if available (note these may change)

Prioritize places with good reviews that work well for event-goers (timing, location, noise level).""",

    SearchType.EVENT_DETAILS: """Find current event information. Include if available:
- Date, time, and venue
- Ticket price ranges (face value and resale if relevant)
- Special notes (opener, set times, themed nights, giveaways)
- Any recent news or changes
- What to expect (duration, intermission, etc.)

Prioritize official team/artist/venue announcements.""",

    SearchType.TICKETS: """Find ticket and pricing information. Include if available:
- Price ranges by section/tier
- Where to buy (official box office, Ticketmaster, verified resale)
- Any fees or gotchas to know about
- Tips for getting good seats/prices
- Availability status if known

Focus on official ticketing sources and verified resale platforms.""",

    SearchType.TRAVEL_TIPS: """Find travel tips for this destination/event. Include if available:
- Best areas to stay near the venue
- Transportation from airport to venue area
- Local tips (neighborhood vibe, safety, getting around)
- Weather considerations for the time of year
- Any city-specific advice for visitors

Prioritize recent travel guides and local knowledge.""",

    SearchType.ACCOMMODATION: """Find hotel and accommodation options. Include if available:
- Hotel names with proximity to venue/area
- Price ranges per night (budget, mid-range, luxury)
- Key amenities (parking, breakfast, pool, etc.)
- Booking sites or direct links
- Neighborhood/area descriptions
- Any event-specific tips (book early, surge pricing, etc.)

Prioritize well-reviewed options convenient for event-goers.""",

    SearchType.NIGHTLIFE: """Find nightlife and entertainment venues. Include if available:
- Venue names and type (bar, club, jazz club, speakeasy, etc.)
- Location and neighborhood
- Vibe/atmosphere description
- Cover charges or reservation requirements
- Hours of operation
- What they're known for (live music, cocktails, dancing, etc.)
- Any dress codes or age restrictions

Prioritize places with good reviews and authentic local atmosphere.""",

    SearchType.GENERAL: """Find accurate, current information to answer this question.
Be specific and cite your sources. If the information might be outdated or varies, note that.""",
}


# Keywords that help classify search type
SEARCH_TYPE_KEYWORDS: dict[SearchType, list[str]] = {
    SearchType.VENUE_INFO: [
        "arena", "stadium", "venue", "theater", "theatre", "amphitheater",
        "parking", "bag policy", "clear bag", "entry", "gates", "seating",
        "sections", "accessibility", "ada", "what to know", "first time",
    ],
    SearchType.RESTAURANT: [
        "restaurant", "eat", "food", "dining", "dinner", "lunch", "brunch",
        "bar", "drinks", "pregame", "pre-game", "postgame", "post-game",
        "near", "around", "close to", "walking distance",
    ],
    SearchType.EVENT_DETAILS: [
        "setlist", "set list", "opener", "opening act", "what time",
        "start time", "doors", "schedule", "lineup", "who's playing",
        "theme night", "giveaway", "bobblehead", "jersey",
    ],
    SearchType.TICKETS: [
        "ticket", "tickets", "price", "prices", "cost", "how much",
        "buy", "purchase", "resale", "stubhub", "seatgeek", "sold out",
        "availability", "face value", "fees",
    ],
    SearchType.TRAVEL_TIPS: [
        "getting to", "getting there", "airport", "transit",
        "uber", "lyft", "taxi", "train", "subway",
        "weather", "pack", "bring", "visiting", "first time",
    ],
    SearchType.ACCOMMODATION: [
        "hotel", "hotels", "stay", "staying", "airbnb", "motel",
        "lodging", "accommodation", "rooms", "book a room",
        "where to stay", "sleep", "overnight",
    ],
    SearchType.NIGHTLIFE: [
        "bar", "bars", "club", "clubs", "nightlife", "nightclub",
        "jazz club", "jazz bar", "speakeasy", "lounge", "pub",
        "live music", "dancing", "drinks", "cocktails", "late night",
        "after party", "going out",
    ],
}


def detect_search_type(query: str) -> SearchType:
    """
    Detect the type of search based on query keywords.

    Returns the most likely search type, or GENERAL if unclear.
    """
    query_lower = query.lower()

    # Score each type by keyword matches
    scores: dict[SearchType, int] = {t: 0 for t in SearchType}

    for search_type, keywords in SEARCH_TYPE_KEYWORDS.items():
        for keyword in keywords:
            if keyword in query_lower:
                scores[search_type] += 1
                # Boost for exact phrase matches
                if f" {keyword} " in f" {query_lower} ":
                    scores[search_type] += 1

    # Return highest scoring type, or GENERAL if no matches
    best_type = max(scores, key=scores.get)
    if scores[best_type] > 0:
        return best_type
    return SearchType.GENERAL


def enhance_query(query: str, search_type: SearchType) -> str:
    """
    Enhance the search query with type-specific terms for better results.

    Adds context signals that help Google Search return more relevant results.
    """
    from datetime import date
    current_year = date.today().year

    enhancements: dict[SearchType, list[str]] = {
        SearchType.VENUE_INFO: ["official site", "visitor guide", "policies"],
        SearchType.RESTAURANT: ["reviews", "reservations", "menu"],
        SearchType.EVENT_DETAILS: ["official", "schedule", str(current_year)],
        SearchType.TICKETS: ["buy tickets", "official", "prices"],
        SearchType.TRAVEL_TIPS: ["travel guide", "tips", "visitors"],
        SearchType.ACCOMMODATION: ["hotels", "book", str(current_year)],
        SearchType.NIGHTLIFE: ["best", "reviews", str(current_year)],
        SearchType.GENERAL: [],
    }

    # Don't over-stuff the query - just add one relevant term if missing
    query_lower = query.lower()
    for term in enhancements.get(search_type, []):
        if term.lower() not in query_lower:
            return f"{query} {term}"

    return query


# -----------------------------------------------------------------------------
# Data classes
# -----------------------------------------------------------------------------

@dataclass
class GroundedSource:
    """A source citation from grounded search."""
    title: str
    url: str
    snippet: str | None = None

    @property
    def domain(self) -> str:
        """Extract domain from URL for display."""
        try:
            from urllib.parse import urlparse
            return urlparse(self.url).netloc.replace("www.", "")
        except Exception:
            return self.url

    @property
    def is_official(self) -> bool:
        """Check if this is likely an official/authoritative source."""
        official_patterns = [
            # Government & education
            r"\.gov$", r"\.edu$", r"\.gov\.uk$", r"\.gc\.ca$",
            # Ticketing platforms
            r"ticketmaster\.", r"axs\.com", r"livenation\.",
            r"stubhub\.com", r"seatgeek\.com", r"vividseats\.com",
            r"viagogo\.com", r"eventbrite\.com",
            # US Sports leagues
            r"\.mlb\.com", r"\.nba\.com", r"\.nfl\.com", r"\.nhl\.com", r"\.mls\.com",
            # International sports
            r"premierleague\.com", r"laliga\.com", r"bundesliga\.com", r"seriea\.com",
            r"uefa\.com", r"fifa\.com", r"olympics\.com",
            r"\.afl\.com\.au", r"\.nrl\.com", r"\.icc-cricket\.com",
            # US Major venues
            r"msg\.com", r"thegarden\.", r"crypto\.com",
            r"chasecenter\.com", r"barclayscenter\.com",
            r"sofi.*stadium", r"climate.*pledge", r"tdgarden\.com",
            r"unitedcenter\.com", r"wellsfargocenter\.com",
            # International venues
            r"theo2\.co\.uk", r"o2world\.", r"accorhotelsarena\.",
            r"wembley.*stadium", r"emiratesstadium\.com", r"etihad.*stadium",
            r"allianz.*arena", r"bernabeu", r"campnou", r"santiagobernabeu",
            r"olympiastadion", r"parc.*princes", r"velodrome",
            r"mcg\.org\.au", r"scg\.nsw\.gov", r"edenpark\.co\.nz",
            r"tokyodome\.co\.jp", r"ajinomotostadium",
            # AEG venues
            r"aegworldwide\.", r"aegpresents\.",
            # Restaurant/booking platforms
            r"opentable\.com", r"resy\.com", r"yelp\.com",
            r"tripadvisor\.com", r"google\.com/maps",
            r"thefork\.com", r"zomato\.com",
            # Hotel booking
            r"booking\.com", r"hotels\.com", r"expedia\.com",
            r"marriott\.com", r"hilton\.com", r"hyatt\.com",
            r"ihg\.com", r"accor\.com", r"airbnb\.com",
            # Travel
            r"visitacity", r"timeout\.com", r"frommers\.com",
            r"lonelyplanet\.com", r"fodors\.com",
            r"visitlondon\.com", r"parisinfo\.com", r"nycgo\.com",
            r"australia\.com", r"japan\.travel",
        ]
        domain = self.domain.lower()
        return any(re.search(p, domain) for p in official_patterns)


@dataclass
class SearchResult:
    """Result from a grounded search query."""
    answer: str
    sources: list[GroundedSource]
    query: str
    enhanced_query: str  # The actual query sent to Gemini
    search_type: SearchType
    model: str

    @property
    def official_sources(self) -> list[GroundedSource]:
        """Return only official/authoritative sources."""
        return [s for s in self.sources if s.is_official]

    @property
    def has_official_sources(self) -> bool:
        """Check if any official sources were found."""
        return len(self.official_sources) > 0


# -----------------------------------------------------------------------------
# Main client
# -----------------------------------------------------------------------------

class GeminiResearcher:
    """
    Gemini client with Search Grounding for real-time research.

    Uses Gemini's built-in Google Search grounding to get current
    information with source citations. Optimized for:
    - Venue details and policies
    - Event information
    - Restaurant recommendations
    - Ticket pricing
    - Travel tips

    Usage:
        researcher = GeminiResearcher()
        result = await researcher.search("parking at Crypto.com Arena")
        print(result.answer)
        print(f"Search type detected: {result.search_type.value}")
        for source in result.official_sources:
            print(f"  - {source.title} ({source.domain})")
    """

    def __init__(self, model: str | None = None):
        """
        Initialize the Gemini researcher.

        Args:
            model: Gemini model to use. Defaults to config GEMINI_MODEL.
                   Using: gemini-3-flash-preview
        """
        settings = get_settings()
        self.model = model or settings.GEMINI_MODEL
        self._client = None

    def _get_client(self):
        """Lazy-load the Gemini client."""
        if self._client is None:
            try:
                from google import genai
            except ImportError:
                raise ImportError(
                    "google-genai package not installed. Run: pip install google-genai"
                )

            settings = get_settings()
            if not settings.GEMINI_API_KEY:
                raise ValueError(
                    "GEMINI_API_KEY is not set - please add it to environment variables"
                )

            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
            logger.info(f"Initialized Gemini client (model: {self.model})")

        return self._client

    def _build_prompt(
        self,
        query: str,
        search_type: SearchType,
        context: str | None = None,
    ) -> str:
        """
        Build the full prompt with base context, type-specific guidance, and query.
        """
        parts = [get_base_context()]

        # Add type-specific prompt
        type_prompt = SEARCH_PROMPTS.get(search_type, SEARCH_PROMPTS[SearchType.GENERAL])
        parts.append(type_prompt)

        # Add user-provided context if any
        if context:
            parts.append(f"Additional context: {context}")

        # Add the actual query
        parts.append(f"Question: {query}")

        return "\n\n".join(parts)

    def _make_cache_key(self, query: str, context: str | None, search_type: SearchType | None) -> str:
        """Generate a cache key for the search query."""
        key_data = {
            "q": query.lower().strip(),
            "c": (context or "")[:100],  # Truncate context for key
            "t": search_type.value if search_type else "auto",
        }
        key_str = json.dumps(key_data, sort_keys=True)
        hash_digest = hashlib.md5(key_str.encode()).hexdigest()[:12]
        return f"gemini:search:{hash_digest}"

    async def search(
        self,
        query: str,
        context: str | None = None,
        search_type: SearchType | None = None,
        should_enhance_query: bool = True,
        max_tokens: int | None = None,
        use_cache: bool = True,
    ) -> SearchResult:
        """
        Perform a grounded search query using Gemini.

        Args:
            query: The search query or question to research
            context: Optional context to help focus the search (e.g., "user is attending Lakers game on Feb 14")
            search_type: Override auto-detected search type
            should_enhance_query: Whether to add search-type-specific terms to query
            max_tokens: Maximum tokens in the response
            use_cache: Whether to use Redis cache (default True)

        Returns:
            SearchResult with answer text, source citations, and metadata
        """
        from google.genai import types

        settings = get_settings()

        if max_tokens is None:
            max_tokens = settings.GEMINI_MAX_TOKENS

        # Detect or use provided search type
        detected_type = search_type or detect_search_type(query)

        # Optionally enhance the query
        final_query = enhance_query(query, detected_type) if should_enhance_query else query

        # Check cache first
        cache_key = self._make_cache_key(query, context, detected_type)
        if use_cache:
            cached = await cache_get(cache_key)
            if cached:
                logger.debug(f"Gemini cache hit: {cache_key}")
                try:
                    if isinstance(cached, str):
                        cached = json.loads(cached)
                    # Reconstruct SearchResult from cached data
                    return SearchResult(
                        answer=cached["answer"],
                        sources=[GroundedSource(**s) for s in cached["sources"]],
                        query=cached["query"],
                        enhanced_query=cached["enhanced_query"],
                        search_type=SearchType(cached["search_type"]),
                        model=cached["model"],
                    )
                except Exception as e:
                    logger.warning(f"Failed to parse cached Gemini result: {e}")

        client = self._get_client()

        # Build the full prompt
        prompt = self._build_prompt(final_query, detected_type, context)

        logger.info(
            f"Gemini search [{detected_type.value}]: {query[:80]}... "
            f"(enhanced: {final_query[:80]}...)"
        )

        import asyncio

        # Get timeout from settings (default 10s for search)
        timeout_seconds = min(settings.GEMINI_TIMEOUT, 10)

        try:
            response = await asyncio.wait_for(
                client.aio.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        max_output_tokens=max_tokens,
                    ),
                ),
                timeout=timeout_seconds,
            )

            # Extract the answer text
            answer = ""
            if response.candidates and response.candidates[0].content:
                for part in response.candidates[0].content.parts:
                    if hasattr(part, "text") and part.text:
                        answer += part.text

            # Extract grounding sources
            sources = self._extract_sources(response)

            logger.info(
                f"Gemini search complete: {len(answer)} chars, "
                f"{len(sources)} sources ({len([s for s in sources if s.is_official])} official)"
            )

            result = SearchResult(
                answer=answer.strip(),
                sources=sources,
                query=query,
                enhanced_query=final_query,
                search_type=detected_type,
                model=self.model,
            )

            # Cache successful result
            if use_cache and sources:  # Only cache if we got actual sources
                try:
                    cache_data = {
                        "answer": result.answer,
                        "sources": [asdict(s) for s in result.sources],
                        "query": result.query,
                        "enhanced_query": result.enhanced_query,
                        "search_type": result.search_type.value,
                        "model": result.model,
                    }
                    await cache_set(cache_key, cache_data, ex=GEMINI_CACHE_TTL)
                    logger.debug(f"Cached Gemini result: {cache_key} (TTL: {GEMINI_CACHE_TTL}s)")
                except Exception as e:
                    logger.warning(f"Failed to cache Gemini result: {e}")

            return result

        except asyncio.TimeoutError:
            logger.warning(f"Gemini search timed out after {timeout_seconds}s: {query[:50]}...")
            return SearchResult(
                answer=f"I couldn't find information on that right now (search timed out). Please try again or search directly on Google.",
                sources=[],
                query=query,
                enhanced_query=final_query,
                search_type=detected_type,
                model=self.model,
            )

        except Exception as e:
            logger.exception(f"Gemini search error: {e}")
            # Return graceful error instead of crashing
            error_msg = str(e)
            if "quota" in error_msg.lower():
                friendly_msg = "I couldn't search for that right now (API limit reached). Please try again in a moment."
            elif "invalid" in error_msg.lower() or "api_key" in error_msg.lower():
                friendly_msg = "I couldn't search for that right now (configuration issue). Please try again later."
            else:
                friendly_msg = "I couldn't find information on that right now. Please try searching directly or rephrase your question."

            return SearchResult(
                answer=friendly_msg,
                sources=[],
                query=query,
                enhanced_query=final_query,
                search_type=detected_type,
                model=self.model,
            )

    def _extract_sources(self, response) -> list[GroundedSource]:
        """Extract source citations from the grounding metadata."""
        sources = []

        try:
            if not response.candidates:
                return sources

            candidate = response.candidates[0]
            grounding_metadata = getattr(candidate, "grounding_metadata", None)

            if grounding_metadata:
                # Extract from grounding_chunks
                chunks = getattr(grounding_metadata, "grounding_chunks", [])
                for chunk in chunks:
                    web = getattr(chunk, "web", None)
                    if web:
                        sources.append(GroundedSource(
                            title=getattr(web, "title", ""),
                            url=getattr(web, "uri", ""),
                            snippet=None,
                        ))

                # Extract snippets from grounding_supports
                supports = getattr(grounding_metadata, "grounding_supports", [])
                for support in supports:
                    segment = getattr(support, "segment", None)
                    if segment:
                        snippet = getattr(segment, "text", None)
                        for source in sources:
                            if source.snippet is None:
                                source.snippet = snippet
                                break

            # Dedupe by URL
            seen_urls = set()
            unique_sources = []
            for source in sources:
                if source.url and source.url not in seen_urls:
                    seen_urls.add(source.url)
                    unique_sources.append(source)

            # Sort: official sources first
            unique_sources.sort(key=lambda s: (not s.is_official, s.domain))

            return unique_sources

        except Exception as e:
            logger.warning(f"Failed to extract grounding sources: {e}")
            return sources

    async def search_with_retry(
        self,
        query: str,
        context: str | None = None,
        search_type: SearchType | None = None,
        max_retries: int = 2,
    ) -> SearchResult:
        """
        Perform a grounded search with automatic retry on failure.
        """
        import asyncio

        last_error = None

        for attempt in range(max_retries + 1):
            try:
                return await self.search(query, context, search_type)
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    wait_time = 2 ** attempt
                    logger.warning(
                        f"Gemini search failed (attempt {attempt + 1}), "
                        f"retrying in {wait_time}s: {e}"
                    )
                    await asyncio.sleep(wait_time)

        raise last_error

    async def search_venue(self, venue_name: str, specific_topic: str | None = None) -> SearchResult:
        """
        Convenience method for venue-specific searches.

        Args:
            venue_name: Name of the venue (e.g., "Crypto.com Arena", "Madison Square Garden")
            specific_topic: Optional specific topic (e.g., "parking", "bag policy", "food")

        Returns:
            SearchResult focused on venue information
        """
        if specific_topic:
            query = f"{venue_name} {specific_topic}"
        else:
            query = f"{venue_name} visitor guide tips"

        return await self.search(
            query=query,
            search_type=SearchType.VENUE_INFO,
            context=f"User is attending an event at {venue_name}",
        )

    async def search_restaurants(
        self,
        location: str,
        venue_name: str | None = None,
        meal_type: str = "dinner",
    ) -> SearchResult:
        """
        Convenience method for restaurant searches near venues.

        Args:
            location: City or neighborhood
            venue_name: Optional venue to search near
            meal_type: Type of meal (dinner, lunch, drinks, etc.)

        Returns:
            SearchResult with restaurant recommendations
        """
        if venue_name:
            query = f"best {meal_type} restaurants near {venue_name}"
            context = f"User is looking for {meal_type} before/after an event at {venue_name}"
        else:
            query = f"best {meal_type} restaurants {location}"
            context = f"User is visiting {location} for a live event"

        return await self.search(
            query=query,
            search_type=SearchType.RESTAURANT,
            context=context,
        )

    async def search_hotels(
        self,
        location: str,
        venue_name: str | None = None,
        event_date: str | None = None,
    ) -> SearchResult:
        """
        Convenience method for hotel/accommodation searches.

        Args:
            location: City or neighborhood
            venue_name: Optional venue to search near
            event_date: Optional event date for context

        Returns:
            SearchResult with hotel recommendations
        """
        if venue_name:
            query = f"best hotels near {venue_name}"
            context = f"User needs accommodation near {venue_name}"
        else:
            query = f"best hotels in {location}"
            context = f"User is visiting {location} for a live event"

        if event_date:
            context += f" on {event_date}"

        return await self.search(
            query=query,
            search_type=SearchType.ACCOMMODATION,
            context=context,
        )

    async def search_nightlife(
        self,
        location: str,
        venue_type: str | None = None,
    ) -> SearchResult:
        """
        Convenience method for nightlife venue searches.

        Args:
            location: City or neighborhood
            venue_type: Type of venue (jazz club, speakeasy, sports bar, etc.)

        Returns:
            SearchResult with nightlife recommendations
        """
        if venue_type:
            query = f"best {venue_type} in {location}"
        else:
            query = f"best bars and nightlife in {location}"

        return await self.search(
            query=query,
            search_type=SearchType.NIGHTLIFE,
            context=f"User is looking for nightlife options in {location}",
        )
