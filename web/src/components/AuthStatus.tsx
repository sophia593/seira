"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import LogoutButton from "./LogoutButton";

export default function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-sm text-gray-500">Loading...</div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50"
      >
        Log in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">{user.email}</span>
      <LogoutButton />
    </div>
  );
}
