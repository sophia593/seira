-- Add missing chat tables to Supabase
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)

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

-- RLS Policies for user_preferences
create policy "Users can view own preferences" on public.user_preferences
    for select using (auth.uid() = user_id);

create policy "Users can upsert own preferences" on public.user_preferences
    for all using (auth.uid() = user_id);

-- RLS Policies for conversations
create policy "Users can view own conversations" on public.conversations
    for select using (auth.uid() = user_id);

create policy "Users can manage own conversations" on public.conversations
    for all using (auth.uid() = user_id);

-- RLS Policies for messages
create policy "Users can view messages in own conversations" on public.messages
    for select using (
        exists (
            select 1 from public.conversations c
            where c.id = messages.conversation_id
            and c.user_id = auth.uid()
        )
    );

create policy "Users can insert messages in own conversations" on public.messages
    for insert with check (
        exists (
            select 1 from public.conversations c
            where c.id = messages.conversation_id
            and c.user_id = auth.uid()
        )
    );

-- Trigger function to update conversation on new message
create or replace function update_conversation_on_message()
returns trigger as $$
begin
    update public.conversations
    set
        updated_at = now(),
        message_count = message_count + 1
    where id = new.conversation_id;
    return new;
end;
$$ language plpgsql;

-- Trigger for message inserts
drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
    after insert on public.messages
    for each row
    execute function update_conversation_on_message();

-- Reload PostgREST schema cache
notify pgrst, 'reload schema';
