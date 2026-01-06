"""
Gemini client with Search Grounding for real-time web research.

Uses Google's Gemini API with the Search Grounding feature to get
up-to-date information with source citations.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class GroundedSource:
    """A source citation from grounded search."""
    title: str
    url: str
    snippet: str | None = None


@dataclass
class SearchResult:
    """Result from a grounded search query."""
    answer: str
    sources: list[GroundedSource]
    query: str
    model: str


class GeminiResearcher:
    """
    Gemini client with Search Grounding for real-time research.

    Uses Gemini's built-in Google Search grounding to get current
    information with source citations. Ideal for:
    - Price lookups
    - Event details
    - Flight information
    - Venue details
    - Current news/updates

    Usage:
        researcher = GeminiResearcher()
        result = await researcher.search("Lakers vs Celtics ticket prices February 2025")
        print(result.answer)
        for source in result.sources:
            print(f"  - {source.title}: {source.url}")
    """

    def __init__(self, model: str = "gemini-2.0-flash"):
        """
        Initialize the Gemini researcher.

        Args:
            model: Gemini model to use. Defaults to gemini-2.0-flash.
                   Options: gemini-2.0-flash, gemini-1.5-pro, gemini-1.5-flash
        """
        self.model = model
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

    async def search(
        self,
        query: str,
        context: str | None = None,
        max_tokens: int = 1024,
    ) -> SearchResult:
        """
        Perform a grounded search query using Gemini.

        Args:
            query: The search query or question to research
            context: Optional context to help focus the search
            max_tokens: Maximum tokens in the response

        Returns:
            SearchResult with answer text and source citations
        """
        from google.genai import types

        client = self._get_client()

        # Build the prompt
        if context:
            prompt = f"{context}\n\nQuestion: {query}"
        else:
            prompt = query

        logger.info(f"Gemini grounded search: {query[:100]}...")

        try:
            # Use Google Search grounding
            response = await client.aio.models.generate_content(
                model=self.model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    tools=[types.Tool(google_search=types.GoogleSearch())],
                    max_output_tokens=max_tokens,
                ),
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
                f"Gemini search complete: {len(answer)} chars, {len(sources)} sources"
            )

            return SearchResult(
                answer=answer.strip(),
                sources=sources,
                query=query,
                model=self.model,
            )

        except Exception as e:
            logger.exception(f"Gemini search error: {e}")
            raise

    def _extract_sources(self, response) -> list[GroundedSource]:
        """Extract source citations from the grounding metadata."""
        sources = []

        try:
            # Check for grounding metadata in the response
            if not response.candidates:
                return sources

            candidate = response.candidates[0]

            # Grounding metadata location varies by response structure
            grounding_metadata = getattr(candidate, "grounding_metadata", None)

            if grounding_metadata:
                # Extract from grounding_chunks if available
                chunks = getattr(grounding_metadata, "grounding_chunks", [])
                for chunk in chunks:
                    web = getattr(chunk, "web", None)
                    if web:
                        sources.append(GroundedSource(
                            title=getattr(web, "title", ""),
                            url=getattr(web, "uri", ""),
                            snippet=None,
                        ))

                # Also check grounding_supports for additional context
                supports = getattr(grounding_metadata, "grounding_supports", [])
                for support in supports:
                    segment = getattr(support, "segment", None)
                    if segment:
                        snippet = getattr(segment, "text", None)
                        # Match to existing source if possible
                        for source in sources:
                            if source.snippet is None:
                                source.snippet = snippet
                                break

            # Dedupe sources by URL
            seen_urls = set()
            unique_sources = []
            for source in sources:
                if source.url and source.url not in seen_urls:
                    seen_urls.add(source.url)
                    unique_sources.append(source)

            return unique_sources

        except Exception as e:
            logger.warning(f"Failed to extract grounding sources: {e}")
            return sources

    async def search_with_retry(
        self,
        query: str,
        context: str | None = None,
        max_retries: int = 2,
    ) -> SearchResult:
        """
        Perform a grounded search with automatic retry on failure.

        Args:
            query: The search query
            context: Optional context
            max_retries: Number of retries on failure

        Returns:
            SearchResult
        """
        import asyncio

        last_error = None

        for attempt in range(max_retries + 1):
            try:
                return await self.search(query, context)
            except Exception as e:
                last_error = e
                if attempt < max_retries:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(
                        f"Gemini search failed (attempt {attempt + 1}), "
                        f"retrying in {wait_time}s: {e}"
                    )
                    await asyncio.sleep(wait_time)

        raise last_error
