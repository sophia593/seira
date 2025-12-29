#!/usr/bin/env python3
"""Test script for the chat endpoint."""

import asyncio
import os
import json
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4dmNkdHdwa3hvcHJvZXJlY2xwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDU5NDksImV4cCI6MjA3ODcyMTk0OX0.-E6nbMkaweaOnGrFxL39yfXc_Vm5BLOeaMdV-MzO0WM"
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
API_URL = "http://localhost:8000"

# Test user
TEST_EMAIL = "testuser@seira.app"
TEST_PASSWORD = "TestPassword123!"


async def ensure_test_user():
    """Create test user if doesn't exist, or sign in."""
    async with httpx.AsyncClient() as client:
        # First try to sign in
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
            print(f"Signed in as existing user: {TEST_EMAIL}")
            return data["access_token"], data["user"]["id"]

        # If sign in failed, create user via admin API
        print("Creating test user...")
        resp = await client.post(
            f"{SUPABASE_URL}/auth/v1/admin/users",
            headers={
                "apikey": SUPABASE_SERVICE_KEY,
                "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD,
                "email_confirm": True,
                "user_metadata": {"name": "Test User"},
            },
        )

        if resp.status_code in (200, 201):
            user_data = resp.json()
            user_id = user_data["id"]
            print(f"Created user: {user_id}")

            # Now sign in
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
                return data["access_token"], data["user"]["id"]

        print(f"Failed to create/sign in user: {resp.status_code}")
        print(resp.text)
        return None, None


async def test_chat(token: str):
    """Test the chat endpoint with streaming."""
    print("\n" + "="*60)
    print("Testing chat endpoint...")
    print("="*60)
    print("\nSending: 'What concerts are happening in Los Angeles next month?'\n")

    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            f"{API_URL}/api/v1/chat",
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
            },
            json={"message": "What concerts are happening in Los Angeles next month?"},
        ) as response:
            if response.status_code != 200:
                print(f"Error: {response.status_code}")
                text = await response.aread()
                print(text.decode())
                return

            print("Streaming response:\n")
            buffer = ""
            async for chunk in response.aiter_text():
                buffer += chunk

                # Process complete SSE events
                while "\n\n" in buffer:
                    event_str, buffer = buffer.split("\n\n", 1)
                    if not event_str.strip():
                        continue

                    # Parse SSE
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

                        # Print based on event type
                        if event_type == "start":
                            print(f"[START] conversation_id: {data.get('conversation_id')}")
                            print("-" * 40)
                        elif event_type == "text":
                            print(data.get("text", ""), end="", flush=True)
                        elif event_type == "tool_start":
                            print(f"\n\n[TOOL] Starting: {data.get('name')}")
                        elif event_type == "tool_input":
                            print(f"[TOOL] Input: {json.dumps(data.get('input', {}), indent=2)}")
                        elif event_type == "tool_result":
                            result = data.get("result", {})
                            is_error = data.get("is_error", False)
                            status = "ERROR" if is_error else "OK"
                            print(f"[TOOL] Result ({status}): {json.dumps(result, indent=2)[:200]}...")
                        elif event_type == "done":
                            print(f"\n\n[DONE] stop_reason: {data.get('stop_reason')}")
                        elif event_type == "error":
                            print(f"\n[ERROR] {data.get('message')}")

    print("\n" + "="*60)
    print("Test complete!")
    print("="*60)


async def main():
    print("="*60)
    print("Seira Chat API Test")
    print("="*60 + "\n")

    print("Getting auth token...")
    token, user_id = await ensure_test_user()

    if not token:
        print("Failed to get token.")
        return

    print(f"User ID: {user_id}")
    print(f"Token: {token[:30]}...")

    await test_chat(token)


if __name__ == "__main__":
    asyncio.run(main())
