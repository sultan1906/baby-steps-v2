"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Search, Loader2, UserX } from "lucide-react";
import { UserAvatar } from "./user-avatar";
import { FollowButton } from "./follow-button";
import { searchUsers } from "@/actions/social";
import type { UserSearchResult } from "@/types";

export function UserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const requestIdRef = useRef(0);

  const doSearch = useCallback(async (q: string) => {
    const id = ++requestIdRef.current;
    if (q.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await searchUsers(q);
      if (id !== requestIdRef.current) return;
      setResults(data);
      setSearched(true);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(query), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  return (
    <div>
      {/* Search input */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-300 text-sm"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
        )}
      </div>

      {/* Results */}
      {searched && results.length === 0 && !loading && (
        <div className="flex flex-col items-center py-8 text-stone-400">
          <UserX className="w-10 h-10 mb-2" />
          <p className="text-sm font-medium">No users found</p>
          <p className="text-xs">Try a different name or email</p>
        </div>
      )}

      <div className="divide-y divide-stone-100">
        {results.map((user) => (
          <div key={user.id} className="flex items-center gap-3 py-3">
            <UserAvatar name={user.name} image={user.image} size={44} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-stone-800 truncate">{user.name}</p>
            </div>
            <FollowButton userId={user.id} initialStatus={user.followStatus} />
          </div>
        ))}
      </div>
    </div>
  );
}
