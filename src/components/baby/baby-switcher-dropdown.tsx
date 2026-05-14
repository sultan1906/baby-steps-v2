"use client";

import { useRouter } from "next/navigation";
import { Check, Plus, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BabyAvatar } from "./baby-avatar";
import { switchBaby } from "@/actions/baby";
import { useBaby } from "./baby-provider";

export function BabySwitcherDropdown() {
  const { push, refresh } = useRouter();
  const { baby, babies } = useBaby();

  const handleSwitch = async (babyId: string) => {
    await switchBaby(babyId);
    refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        suppressHydrationWarning
        className="flex items-center gap-2 focus:outline-none group"
      >
        <BabyAvatar name={baby.name} photoUrl={baby.photoUrl} size={48} />
        <ChevronDown className="size-3 text-stone-400 group-hover:text-stone-600 transition-colors" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-2xl p-1">
        {babies.map((b) => (
          <DropdownMenuItem
            key={b.id}
            onClick={() => handleSwitch(b.id)}
            className="flex items-center gap-3 rounded-xl p-2 cursor-pointer"
          >
            <BabyAvatar name={b.name} photoUrl={b.photoUrl} size={32} />
            <span className="flex-1 font-medium text-stone-800">{b.name}</span>
            {b.id === baby.id && <Check className="size-4 text-rose-500" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => push("/onboarding")}
          className="flex items-center gap-2 rounded-xl p-2 cursor-pointer text-rose-500 font-medium"
        >
          <div className="size-8 rounded-xl border-2 border-dashed border-rose-200 flex items-center justify-center">
            <Plus className="size-4" />
          </div>
          Add another baby
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
