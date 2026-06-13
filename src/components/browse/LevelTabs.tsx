"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LevelTabsProps {
  levels: number[];
  activeLevel: number;
}

export function LevelTabs({ levels, activeLevel }: LevelTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLevelChange = (level: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("level", level.toString());
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex gap-1 overflow-x-auto pb-1">
      {levels.map((level) => (
        <Button
          key={level}
          onClick={() => handleLevelChange(level)}
          className={cn(
            "relative rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-all duration-normal",
            activeLevel === level
              ? "bg-primary-600 text-white shadow-soft"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          {level} Level
        </Button>
      ))}
    </div>
  );
}
