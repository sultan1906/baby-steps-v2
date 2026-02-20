"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { createSavedLocation, getSavedLocations } from "@/actions/locations";
import type { SavedLocation } from "@/types";
import type { PlaceSuggestion } from "@/types";

interface MapPickerDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (locationId: string, nickname: string) => void;
}

export function MapPickerDialog({ open, onClose, onSelect }: MapPickerDialogProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>([]);
  const [pendingPlace, setPendingPlace] = useState<PlaceSuggestion | null>(null);
  const [nickname, setNickname] = useState("");

  // Load saved locations
  useEffect(() => {
    if (open) {
      getSavedLocations().then(setSavedLocations);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch("/api/places/autocomplete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: query }),
        });
        const data = await res.json();
        const items: PlaceSuggestion[] =
          data.suggestions?.map(
            (s: {
              placePrediction?: {
                placeId?: string;
                text?: { text?: string };
                structuredFormat?: {
                  mainText?: { text?: string };
                  secondaryText?: { text?: string };
                };
              };
            }) => ({
              placeId: s.placePrediction?.placeId ?? "",
              mainText:
                s.placePrediction?.structuredFormat?.mainText?.text ??
                s.placePrediction?.text?.text ??
                "",
              secondaryText: s.placePrediction?.structuredFormat?.secondaryText?.text ?? "",
            })
          ) ?? [];
        setSuggestions(items);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSuggestionSelect = (place: PlaceSuggestion) => {
    setPendingPlace(place);
    setNickname(place.mainText);
    setSuggestions([]);
    setQuery("");
  };

  const handleSaveLocation = async () => {
    if (!pendingPlace || !nickname.trim()) return;

    const loc = await createSavedLocation({
      nickname: nickname.trim(),
      address: pendingPlace.secondaryText || pendingPlace.mainText,
      fullName: `${pendingPlace.mainText}, ${pendingPlace.secondaryText}`,
    });

    onSelect(loc.id, loc.nickname);
    setPendingPlace(null);
    setNickname("");
  };

  const handleSavedSelect = (loc: SavedLocation) => {
    onSelect(loc.id, loc.nickname);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-[2.5rem] p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-stone-800">Choose Location</DialogTitle>
        </DialogHeader>

        {/* Search input */}
        <div className="relative mt-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search places..."
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-stone-50 border border-stone-200 text-stone-700 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 animate-spin" />
          )}
        </div>

        {/* Search results */}
        {suggestions.length > 0 && (
          <div className="mt-2 max-h-[200px] overflow-y-auto rounded-2xl border border-stone-100 bg-white">
            {suggestions.map((s) => (
              <button
                key={s.placeId}
                onClick={() => handleSuggestionSelect(s)}
                className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-stone-50 border-b border-stone-50 last:border-0 transition-colors"
              >
                <MapPin className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-sm font-medium text-stone-700">{s.mainText}</div>
                  <div className="text-xs text-stone-400">{s.secondaryText}</div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Nickname input (when place selected) */}
        {pendingPlace && (
          <div className="mt-3 bg-rose-50/50 rounded-2xl p-4 border border-rose-100">
            <p className="text-xs text-stone-500 mb-2 font-medium">Give it a nickname</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="e.g. Home, Park, Grandma's"
                className="flex-1 px-3 py-2 rounded-xl bg-white border border-stone-200 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-rose-300"
                autoFocus
              />
              <button
                onClick={handleSaveLocation}
                disabled={!nickname.trim()}
                className="gradient-bg-vibrant text-white text-sm font-bold px-4 py-2 rounded-xl disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setPendingPlace(null)}
                className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Saved locations */}
        {savedLocations.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-stone-400 font-medium uppercase tracking-wide mb-2">
              Saved Locations
            </p>
            <div className="grid grid-cols-2 gap-2">
              {savedLocations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => handleSavedSelect(loc)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-stone-50 border border-stone-200 hover:border-rose-300 transition-colors text-sm text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="truncate text-stone-700 font-medium">{loc.nickname}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
