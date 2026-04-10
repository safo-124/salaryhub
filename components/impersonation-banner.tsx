"use client";

import { useSession, signOut } from "next-auth/react";
import { AlertTriangle } from "lucide-react";

export function ImpersonationBanner() {
    const { data: session } = useSession();

    if (!session?.user?.impersonating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-amber-950 px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-3">
            <AlertTriangle className="size-4" />
            <span>
                You are impersonating <strong>{session.user.name}</strong> ({session.user.email})
            </span>
            <button
                onClick={() => signOut({ callbackUrl: "/admin" })}
                className="ml-2 rounded bg-amber-700 px-3 py-0.5 text-xs font-semibold text-white hover:bg-amber-800 transition-colors"
            >
                Exit Impersonation
            </button>
        </div>
    );
}
