"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import LogoutButton from "./LogoutButton";

export default function AuthStatus() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">loading...</div>
    );
  }

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">log in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">{user.email}</span>
      <LogoutButton />
    </div>
  );
}
