#!/usr/bin/env python3
"""Test Ticketmaster API integration."""

import asyncio
from dotenv import load_dotenv

load_dotenv()

from app.integrations.ticketmaster import search_events


async def main():
    print("Testing Ticketmaster API...\n")

    results = await search_events(
        keyword="Lakers",
        city="Los Angeles",
        start_date="2025-01-01",
        end_date="2025-03-31",
        size=5,
    )

    print(f"Found {results.total_count} events (showing {len(results.events)})\n")

    for event in results.events:
        print(f"📅 {event.date} | {event.name}")
        if event.venue:
            print(f"   📍 {event.venue.name}, {event.venue.city}")
        if event.price_range:
            print(f"   💵 ${event.price_range.min} - ${event.price_range.max}")
        print(f"   🔗 {event.purchase_url[:60]}...")
        print()


if __name__ == "__main__":
    asyncio.run(main())
