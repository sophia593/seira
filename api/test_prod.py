#!/usr/bin/env python3
"""Test the production chat endpoint."""

import asyncio
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dmNkdHdwa3hvcHJvZXJlY2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDU5NDksImV4cCI6MjA3ODcyMTk0OX0.-E6nbMkaweaOnGrFxL39yfXc_Vm5BLOeaMdV-MzO0WM"

# Production API
API_URL = "https://seira-production.up.railway.app"

# Test user
TEST_EMAIL = "testuser@seira.app"
TEST_PASSWORD = "TestPassword123!"


async def get_token():
    """Sign in and get token."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Content-Type": "application/json",
            },
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
            },
        )

        if resp.status_code == 200:
            data = resp.json()
            return data["access_token"]
        else:
            print(f"Sign in failed: {resp.status_code}")
            print(resp.text)
            return None


async def test_chat(token: str):
    """Test the production chat endpoint."""
    print("\n" + "="*60)
    print(f"Testing production: {API_URL}/api/v1/chat")
    print("="*60)
    print("\nSending: 'Hello! What can you help me with?'\n")

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            f"{API_URL}/api/v1/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            json={"message": "Hello! What can you help me with?"},
        ) as response:
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                text = await response.aread()
                print(text.decode())
                return False

            print("Streaming response:\n")
            buffer = ""
            event_count = 0

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
                        event_count += 1
                        try:
                            data = json.loads(event_data)
                        except:
                            data = {"raw": event_data}

                        if event_type == "start":
                            print(f"[START] conversation_id: {data.get('conversation_id')}")
                            print("-" * 40)
                        elif event_type == "text":
                            print(data.get("text", ""), end="", flush=True)
                        elif event_type == "tool_start":
                            print(f"\n\n[TOOL] {data.get('name')}")
                        elif event_type == "tool_result":
                            print(f"[TOOL RESULT] OK")
                        elif event_type == "done":
                            print(f"\n\n[DONE] stop_reason: {data.get('stop_reason')}")
                        elif event_type == "error":
                            print(f"\n[ERROR] {data.get('message')}")
                            return False

            print(f"\n\nTotal events received: {event_count}")
            return event_count > 0


async def main():
    print("="*60)
    print("Seira Production Chat Test")
    print("="*60 + "\n")

    print("Getting auth token...")
    token = await get_token()

    if not token:
        print("Failed to get token.")
        return

    print(f"Token: {token[:30]}...\n")

    success = await test_chat(token)

    print("\n" + "="*60)
    if success:
        print("✓ Production streaming test PASSED")
    else:
        print("✗ Production streaming test FAILED")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(main())
