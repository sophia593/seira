#!/usr/bin/env python3
"""
Run migration directly against Supabase Postgres.
Uses the Transaction Pooler with supavisor.
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv

load_dotenv()

# Extract project ref from URL
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
PROJECT_REF = SUPABASE_URL.replace("https://", "").split(".")[0] if SUPABASE_URL else ""

# Try to get database password from env
DB_PASSWORD = os.getenv("SUPABASE_DB_PASSWORD")


def get_migration_sql():
    """Return the migration SQL for chat tables."""
    return """
    -- Enable UUID extension
    create extension if not exists "uuid-ossp";

    -- User preferences table
    create table if not exists public.user_preferences (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid unique references public.users(id) on delete cascade not null,
        home_airport text,
        cabin_class text default 'economy',
        seat_preference text,
        budget_default numeric,
        preferred_airlines text[],
        created_at timestamptz default now() not null,
        updated_at timestamptz default now() not null
    );

    -- Conversations table
    create table if not exists public.conversations (
        id uuid primary key default uuid_generate_v4(),
        user_id uuid references public.users(id) on delete cascade not null,
        title text,
        context jsonb default '{}',
        is_archived boolean default false,
        message_count integer default 0,
        created_at timestamptz default now() not null,
        updated_at timestamptz default now() not null
    );

    -- Messages table
    create table if not exists public.messages (
        id uuid primary key default uuid_generate_v4(),
        conversation_id uuid references public.conversations(id) on delete cascade not null,
        role text not null check (role in ('user', 'assistant', 'system', 'tool')),
        content text not null,
        tool_calls jsonb,
        tool_call_id text,
        tokens_used integer,
        model_version text,
        created_at timestamptz default now() not null
    );

    -- Indexes
    create index if not exists idx_conversations_user_id on public.conversations(user_id);
    create index if not exists idx_conversations_updated_at on public.conversations(updated_at desc);
    create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
    create index if not exists idx_messages_created_at on public.messages(created_at);

    -- Enable Row Level Security
    alter table public.user_preferences enable row level security;
    alter table public.conversations enable row level security;
    alter table public.messages enable row level security;
    """


def get_rls_policies_sql():
    """Return RLS policies SQL (run separately to avoid conflicts)."""
    return """
    -- RLS Policies for user_preferences
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can view own preferences') THEN
            CREATE POLICY "Users can view own preferences" ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_preferences' AND policyname = 'Users can upsert own preferences') THEN
            CREATE POLICY "Users can upsert own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
        END IF;
    END $$;

    -- RLS Policies for conversations
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can view own conversations') THEN
            CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversations' AND policyname = 'Users can manage own conversations') THEN
            CREATE POLICY "Users can manage own conversations" ON public.conversations FOR ALL USING (auth.uid() = user_id);
        END IF;
    END $$;

    -- RLS Policies for messages
    DO $$
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can view messages in own conversations') THEN
            CREATE POLICY "Users can view messages in own conversations" ON public.messages FOR SELECT USING (
                EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
            );
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'messages' AND policyname = 'Users can insert messages in own conversations') THEN
            CREATE POLICY "Users can insert messages in own conversations" ON public.messages FOR INSERT WITH CHECK (
                EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
            );
        END IF;
    END $$;

    -- Trigger function
    create or replace function update_conversation_on_message()
    returns trigger as $$
    begin
        update public.conversations
        set updated_at = now(), message_count = message_count + 1
        where id = new.conversation_id;
        return new;
    end;
    $$ language plpgsql;

    -- Trigger
    drop trigger if exists on_message_insert on public.messages;
    create trigger on_message_insert
        after insert on public.messages
        for each row
        execute function update_conversation_on_message();

    -- Reload schema cache
    notify pgrst, 'reload schema';
    """


def run_migration():
    """Run the migration SQL."""
    if not DB_PASSWORD:
        print("=" * 60)
        print("SUPABASE_DB_PASSWORD not found in .env")
        print()
        print("To get your database password:")
        print(f"1. Go to: https://supabase.com/dashboard/project/{PROJECT_REF}/settings/database")
        print("2. Scroll down to 'Connection string' section")
        print("3. Click 'Reveal' next to the password")
        print("4. Add to your .env file: SUPABASE_DB_PASSWORD=your_password_here")
        print()
        print("Or run migrations/003_add_chat_tables.sql in SQL Editor:")
        print(f"https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new")
        print("=" * 60)
        sys.exit(1)

    # Connection pooler URL
    DATABASE_URL = f"postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

    print("Connecting to Supabase Postgres...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        print("Running table creation migration...")
        cur.execute(get_migration_sql())
        print("Tables created.")

        print("Running RLS policies migration...")
        cur.execute(get_rls_policies_sql())
        print("RLS policies applied.")

        # Verify tables
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        tables = [row[0] for row in cur.fetchall()]
        print(f"\nTables in public schema: {tables}")

        cur.close()
        conn.close()
        print("\nMigration completed successfully!")

    except psycopg2.Error as e:
        print(f"Database error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    run_migration()
