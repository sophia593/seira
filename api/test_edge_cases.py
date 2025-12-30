#!/usr/bin/env python3
"""Test edge cases for chat endpoint."""

import asyncio
import json
import httpx
from dotenv import load_dotenv
import os
import sys

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dmNkdHdwa3hvcHJvZXJlY2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDU5NDksImV4cCI6MjA3ODcyMTk0OX0.-E6nbMkaweaOnGrFxL39yfXc_Vm5BLOeaMdV-MzO0WM"
API_URL = "http://localhost:8000"

TEST_EMAIL = "testuser@seira.app"
TEST_PASSWORD = "TestPassword123!"


async def get_token():
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={"apikey": SUPABASE_ANON_KEY, "Content-Type": "application/json"},
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD},
        )
        if resp.status_code == 200:
            return resp.json()["access_token"]
        return None


async def test_query(query: str):
    """Test a single query and return results summary."""
    print(f"\n{'='*60}")
    print(f"Testing: '{query}'")
    print(f"{'='*60}\n")

    token = await get_token()
    if not token:
        print("Failed to get auth token")
        return {"success": False, "error": "auth_failed"}

    results = {
        "query": query,
        "success": False,
        "tool_used": None,
        "event_count": 0,
        "sample_events": [],
        "response_snippet": "",
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{API_URL}/api/v1/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            json={"message": query},
        ) as response:
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                text = await response.aread()
                print(text.decode())
                return results

            buffer = ""
            response_text = ""

            async for chunk in response.aiter_text():
                buffer += chunk

                while "\n\n" in buffer:
                    event_str, buffer = buffer.split("\n\n", 1)
                    if not event_str.strip():
                        continue

                    event_type = None
                    event_data = None
                    for line in event_str.split("\n"):
                        if line.startswith("event:"):
                            event_type = line[6:].strip()
                        elif line.startswith("data:"):
                            event_data = line[5:].strip()

                    if event_type and event_data:
                        try:
                            data = json.loads(event_data)
                        except:
                            data = {"raw": event_data}

                        if event_type == "text":
                            text_chunk = data.get("text", "")
                            response_text += text_chunk
                            print(text_chunk, end="", flush=True)
                        elif event_type == "tool_start":
                            tool_name = data.get("name")
                            results["tool_used"] = tool_name
                            print(f"\n\n🔧 TOOL: {tool_name}")
                        elif event_type == "tool_input":
                            print(f"   Input: {json.dumps(data.get('input', {}))}")
                        elif event_type == "tool_result":
                            result = data.get("result", {})
                            count = result.get("count", 0)
                            events = result.get("events", [])
                            results["event_count"] = count
                            results["sample_events"] = events[:3]
                            print(f"   Result: Found {count} events")
                            if events:
                                print("   Sample events:")
                                for e in events[:2]:
                                    print(f"   • {e.get('date')} - {e.get('name')}")
                        elif event_type == "done":
                            results["success"] = True
                            results["response_snippet"] = response_text[:200]
                        elif event_type == "error":
                            print(f"\n[ERROR] {data.get('message')}")

    print(f"\n\n{'='*60}")
    return results


async def main():
    """Run all edge case tests."""
    queries = [
        "Taylor Swift concerts in Los Angeles",
        "NBA games in Chicago",
        "xyzzy blargfoob nonsense event",  # Should return no results
    ]

    all_results = []
    for query in queries:
        result = await test_query(query)
        all_results.append(result)

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for r in all_results:
        status = "✅" if r["success"] else "❌"
        print(f"{status} '{r['query'][:40]}...' - {r['event_count']} events found")


if __name__ == "__main__":
    asyncio.run(main())
