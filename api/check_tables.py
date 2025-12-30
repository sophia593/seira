#!/usr/bin/env python3
"""Check what tables exist in Supabase and create missing ones."""

import httpx
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def check_tables():
    """Check if tables exist via PostgREST schema endpoint."""
    # Get the OpenAPI schema from PostgREST
    resp = httpx.get(
        f"{SUPABASE_URL}/rest/v1/",
        headers={
            "apikey": SUPABASE_SERVICE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        },
    )

    if resp.status_code == 200:
        # Get table names from schema
        data = resp.json()
        if "definitions" in data:
            tables = list(data["definitions"].keys())
            print("Tables found in schema cache:")
            for t in sorted(tables):
                print(f"  - {t}")
            return tables

    print(f"Error: {resp.status_code}")
    print(resp.text)
    return []


if __name__ == "__main__":
    tables = check_tables()

    required = ["users", "user_preferences", "conversations", "messages"]
    missing = [t for t in required if t not in tables]

    if missing:
        print(f"\nMissing tables: {missing}")
        print("\nPlease run the following SQL in the Supabase SQL Editor:")
        print("=" * 60)
    else:
        print("\nAll required tables exist!")
