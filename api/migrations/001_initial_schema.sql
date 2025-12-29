-- Seira Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    name text,
    avatar_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- User preferences
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

-- RLS Policies
alter table public.users enable row level security;
alter table public.user_preferences enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- Users can only see/edit their own data
create policy "Users can view own profile" on public.users
    for select using (auth.uid() = id);

create policy "Users can update own profile" on public.users
    for update using (auth.uid() = id);

create policy "Users can view own preferences" on public.user_preferences
    for select using (auth.uid() = user_id);

create policy "Users can upsert own preferences" on public.user_preferences
    for all using (auth.uid() = user_id);

create policy "Users can view own conversations" on public.conversations
    for select using (auth.uid() = user_id);

create policy "Users can manage own conversations" on public.conversations
    for all using (auth.uid() = user_id);

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

-- Function to update conversation updated_at and message_count
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

-- Function to create user record on signup
create or replace function handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for new auth users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function handle_new_user();
