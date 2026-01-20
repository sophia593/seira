"""
Query Normalizer

Fixes typos and normalizes user queries before searching.

Handles:
- Common misspellings of artists, teams, events
- "tickts" -> "tickets", "tix" -> "tickets"
- Fuzzy matching for obvious typos
- Gibberish detection (when to ask for clarification vs just search)

Philosophy:
- If it's 80% clear what they mean, just search for it
- Only ask for clarification when genuinely ambiguous
- Never confuse a typo for a different real thing (Ariana Grande ≠ Tirana, Albania)
"""

from __future__ import annotations

import re
from typing import Optional, Tuple, List
from difflib import SequenceMatcher


# -----------------------------------------------------------------------------
# Common Typo Patterns
# -----------------------------------------------------------------------------

# Words that should be stripped (not part of the search intent)
NOISE_WORDS = [
    "tickets", "tickts", "tix", "ticket", "tikets",
    "show", "shows", "concert", "concerts", "game", "games",
    "please", "find", "search", "get", "buy", "want",
    "me", "i", "the", "a", "an", "some", "for", "to",
]

# Common letter swaps / typos
LETTER_SWAPS = [
    ("dn", "nd"),  # gradne -> grande
    ("teh", "the"),
    ("hte", "the"),
    ("ti", "it"),
    ("ei", "ie"),
    ("ie", "ei"),
]


# -----------------------------------------------------------------------------
# Known Entities (lightweight - just for typo correction, not a full database)
# -----------------------------------------------------------------------------

# Top artists/performers (for fuzzy matching typos)
KNOWN_ARTISTS = [
    "ariana grande", "taylor swift", "beyonce", "drake", "bad bunny",
    "the weeknd", "ed sheeran", "harry styles", "dua lipa", "billie eilish",
    "post malone", "travis scott", "kendrick lamar", "sza", "morgan wallen",
    "luke combs", "chris stapleton", "zach bryan", "bruno mars", "lady gaga",
    "coldplay", "foo fighters", "metallica", "radiohead", "pearl jam",
    "bruce springsteen", "elton john", "billy joel", "adele", "rihanna",
    "justin bieber", "the rolling stones", "u2", "paul mccartney",
    "red hot chili peppers", "green day", "blink 182", "fall out boy",
    "panic at the disco", "twenty one pilots", "imagine dragons",
    "maroon 5", "onerepublic", "john mayer", "dave matthews band",
    "phish", "dead and company", "widespread panic", "oasis", "blur",
    "olivia rodrigo", "sabrina carpenter", "chappell roan", "noah kahan",
]

# Top sports teams
KNOWN_TEAMS = [
    "lakers", "celtics", "warriors", "bulls", "heat", "knicks", "nets",
    "76ers", "sixers", "mavericks", "mavs", "spurs", "rockets", "clippers",
    "suns", "nuggets", "bucks", "cavaliers", "cavs", "pistons", "pacers",
    "cowboys", "eagles", "giants", "commanders", "packers", "bears",
    "vikings", "lions", "49ers", "niners", "seahawks", "rams", "chiefs",
    "raiders", "broncos", "chargers", "patriots", "jets", "dolphins",
    "bills", "steelers", "ravens", "browns", "bengals", "titans", "colts",
    "texans", "jaguars", "saints", "falcons", "panthers", "buccaneers", "bucs",
    "yankees", "red sox", "dodgers", "giants", "cubs", "cardinals", "mets",
    "phillies", "braves", "astros", "rangers", "padres", "angels", "athletics",
    "rangers", "islanders", "devils", "flyers", "penguins", "capitals", "caps",
    "bruins", "canadiens", "habs", "maple leafs", "leafs", "blackhawks", "hawks",
    "red wings", "avalanche", "avs", "blues", "wild", "predators", "preds",
    "lightning", "bolts", "panthers", "hurricanes", "canes", "kraken",
    "golden knights", "knights", "oilers", "flames", "canucks", "sharks", "ducks", "kings",
]

# Top shows/events
KNOWN_SHOWS = [
    "hamilton", "wicked", "lion king", "phantom of the opera", "chicago",
    "book of mormon", "hadestown", "mousetrap", "les miserables", "les mis",
    "dear evan hansen", "beetlejuice", "aladdin", "frozen", "mean girls",
    "six", "come from away", "harry potter", "cursed child",
    "coachella", "lollapalooza", "bonnaroo", "acl", "austin city limits",
    "governors ball", "outside lands", "electric daisy carnival", "edc",
    "ultra", "tomorrowland", "burning man", "sxsw", "south by southwest",
    "super bowl", "world series", "nba finals", "stanley cup",
    "us open", "wimbledon", "french open", "australian open",
    "masters", "kentucky derby", "indy 500", "daytona 500",
    "comic con", "comic-con", "san diego comic con",
    "wrestlemania", "ufc", "boxing",
]

ALL_KNOWN_ENTITIES = KNOWN_ARTISTS + KNOWN_TEAMS + KNOWN_SHOWS


# -----------------------------------------------------------------------------
# Similarity Functions
# -----------------------------------------------------------------------------

def _similarity(a: str, b: str) -> float:
    """Calculate similarity ratio between two strings (0-1)."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _find_best_match(query: str, candidates: List[str], threshold: float = 0.75) -> Optional[str]:
    """Find the best matching candidate above the threshold."""
    query_lower = query.lower().strip()

    best_match = None
    best_score = 0.0

    for candidate in candidates:
        score = _similarity(query_lower, candidate)
        if score > best_score and score >= threshold:
            best_score = score
            best_match = candidate

    return best_match


def _apply_letter_swaps(text: str) -> str:
    """Fix common letter transpositions."""
    result = text.lower()
    for wrong, right in LETTER_SWAPS:
        result = result.replace(wrong, right)
    return result


# -----------------------------------------------------------------------------
# Main Functions
# -----------------------------------------------------------------------------

def normalize_query(raw_query: str) -> Tuple[str, Optional[str], bool]:
    """
    Normalize a user query, fixing typos and extracting intent.

    Args:
        raw_query: The raw user input, e.g., "Tirana gradne tickts"

    Returns:
        Tuple of:
        - normalized_query: Cleaned up query to search with
        - matched_entity: If we matched a known entity, what it is
        - was_corrected: Whether we made corrections

    Example:
        normalize_query("Tirana gradne tickts")
        -> ("ariana grande", "ariana grande", True)

        normalize_query("lakers game")
        -> ("lakers", "lakers", False)
    """
    if not raw_query:
        return ("", None, False)

    original = raw_query.strip()
    query = original.lower()

    # Step 1: Remove noise words
    words = query.split()
    meaningful_words = [w for w in words if w not in NOISE_WORDS]

    if not meaningful_words:
        # Everything was noise, use original minus just "tickets/tix"
        meaningful_words = [w for w in words if w not in ["tickets", "tickts", "tix", "ticket"]]

    cleaned = " ".join(meaningful_words)

    # Step 2: Apply letter swap fixes
    swapped = _apply_letter_swaps(cleaned)

    # Step 3: Try to match against known entities
    # First try exact match
    for entity in ALL_KNOWN_ENTITIES:
        if entity in swapped:
            return (entity, entity, entity not in query)

    # Then try fuzzy match on the cleaned query
    best_match = _find_best_match(swapped, ALL_KNOWN_ENTITIES, threshold=0.70)
    if best_match:
        return (best_match, best_match, True)

    # Step 4: Try matching individual words
    for word in meaningful_words:
        word_swapped = _apply_letter_swaps(word)
        match = _find_best_match(word_swapped, ALL_KNOWN_ENTITIES, threshold=0.75)
        if match:
            # Replace the typo word with the match
            corrected = swapped.replace(word_swapped, match)
            return (corrected.strip(), match, True)

    # Step 5: No match found, return cleaned query
    was_corrected = cleaned != query
    return (cleaned if cleaned else original.lower(), None, was_corrected)


def is_gibberish(query: str) -> bool:
    """
    Check if a query is likely gibberish that needs clarification.

    Returns True only if we truly can't make sense of it.
    """
    if not query or len(query.strip()) < 2:
        return True

    normalized, matched, _ = normalize_query(query)

    # If we matched something, it's not gibberish
    if matched:
        return False

    # If it's very short and no match, might be gibberish
    if len(normalized) < 3:
        return True

    # Check for keyboard mashing (too many consonants in a row)
    consonant_run = re.search(r'[bcdfghjklmnpqrstvwxz]{5,}', normalized)
    if consonant_run:
        return True

    # Otherwise, give it a shot
    return False


def should_ask_clarification(query: str) -> Tuple[bool, Optional[str]]:
    """
    Determine if we should ask for clarification vs just search.

    Returns:
        Tuple of:
        - should_ask: True if we should ask, False if we should just search
        - reason: If should_ask is True, why we're asking

    Philosophy:
    - If we can reasonably guess what they mean, just search
    - Only ask if it's truly ambiguous or gibberish
    """
    if is_gibberish(query):
        return (True, "I couldn't understand that query. Could you rephrase?")

    normalized, matched, was_corrected = normalize_query(query)

    # If we matched something or corrected something, just search
    if matched or was_corrected:
        return (False, None)

    # If it's a reasonable query, just search
    if len(normalized) >= 3:
        return (False, None)

    return (True, "Could you tell me more about what you're looking for?")


def get_correction_message(original: str, corrected: str, matched_entity: str) -> Optional[str]:
    """
    Generate a friendly message if we corrected a query.

    Returns None if no correction was made.
    """
    if original.lower().strip() == corrected.lower().strip():
        return None

    if matched_entity:
        return f'Searching for "{matched_entity.title()}"...'

    return None
