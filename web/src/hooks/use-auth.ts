"use client";

import { useEffect, useState, useCallback } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // Fetch initial user
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    fetchUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      throw new Error(error.message);
    }

    setUser(data.user);
    return data.user;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setLoading(true);
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      throw new Error(error.message);
    }

    if (data.user && !data.user.confirmed_at) {
      return { user: data.user, needsConfirmation: true };
    }

    setUser(data.user);
    return { user: data.user, needsConfirmation: false };
  }, []);

  const signOut = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      throw new Error(error.message);
    }

    setUser(null);
  }, []);

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
