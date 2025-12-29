#!/usr/bin/env python3
"""Apply database migrations to Supabase."""

import os
import httpx
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Extract project ref from URL
PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0]


def run_sql(sql: str) -> dict:
    """Execute SQL via Supabase SQL API."""
    # Use the Supabase Management API SQL endpoint
    url = f"https://{PROJECT_REF}.supabase.co/rest/v1/rpc/exec_sql"

    # Alternative: use direct postgres connection via pooler
    # For now, let's create tables one by one using the REST API

    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    # We can't run arbitrary SQL via REST, so let's just print instructions
    return {"status": "manual"}


def main():
    """Run migrations."""
    print("=" * 60)
    print("Seira Database Migration")
    print("=" * 60)
    print()

    # Read migration SQL
    with open("migrations/001_initial_schema.sql", "r") as f:
        sql = f.read()

    print("Migration file: migrations/001_initial_schema.sql")
    print()
    print("To apply this migration, run the SQL in your Supabase dashboard:")
    print(f"  1. Go to: {SUPABASE_URL.replace('.co', '.co/dashboard')}/project/{PROJECT_REF}/sql")
    print("  2. Paste the contents of migrations/001_initial_schema.sql")
    print("  3. Click 'Run'")
    print()
    print("Or copy and run this SQL:")
    print("-" * 60)
    print(sql[:2000] + "..." if len(sql) > 2000 else sql)
    print("-" * 60)


if __name__ == "__main__":
    main()
