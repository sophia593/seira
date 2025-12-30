#!/usr/bin/env python3
"""Test Lakers query through chat endpoint."""

import asyncio
import json
import httpx
from dotenv import load_dotenv
import os

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


async def test_lakers():
    print("=" * 60)
    print("Testing: 'Lakers games in February'")
    print("=" * 60 + "\n")

    token = await get_token()
    if not token:
        print("Failed to get auth token")
        return

    print(f"Token: {token[:20]}...\n")

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{API_URL}/api/v1/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            json={"message": "Lakers games in February"},
        ) as response:
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                text = await response.aread()
                print(text.decode())
                return

            print("Streaming response:\n" + "-" * 40)

            buffer = ""
            tool_results = []

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

                        if event_type == "start":
                            print(f"[CONV] {data.get('conversation_id', 'N/A')[:8]}...")
                        elif event_type == "text":
                            print(data.get("text", ""), end="", flush=True)
                        elif event_type == "tool_start":
                            print(f"\n\n🔧 TOOL: {data.get('name')}")
                        elif event_type == "tool_input":
                            print(f"   Input: {json.dumps(data.get('input', {}))}")
                        elif event_type == "tool_result":
                            result = data.get("result", {})
                            tool_results.append(result)
                            count = result.get("count", 0)
                            events = result.get("events", [])
                            print(f"   Result: Found {count} events")
                            if events:
                                print("\n   Sample events:")
                                for e in events[:3]:
                                    print(f"   • {e.get('date')} - {e.get('name')}")
                                    print(f"     {e.get('venue')}, {e.get('city')}")
                                    if e.get('ticket_url'):
                                        print(f"     🎟️  {e.get('ticket_url')[:50]}...")
                        elif event_type == "done":
                            print(f"\n\n[DONE] {data.get('stop_reason')}")
                        elif event_type == "error":
                            print(f"\n[ERROR] {data.get('message')}")

    print("\n" + "=" * 60)
    print("Test complete!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_lakers())
