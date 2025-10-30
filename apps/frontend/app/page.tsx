'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--background)] p-6">
      
      <Card className="w-full max-w-md border-[var(--border)] bg-[var(--card)] shadow-lg">
        <CardHeader className="text-center">
          <h1 className="text-4xl font-bold text-[var(--primary)]">
            Battle Arena
          </h1>
          <p className="text-[var(--foreground)] mt-2">
            Ready your eggs and start the battle! Click below to challenge opponents.
          </p>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          {/* Arena Illustration */}
          <div className="relative w-64 h-64">
            <Image
              src="/arena.png" // replace with your arena image
              alt="Battle Arena"
              fill
              className="object-contain"
            />
          </div>

          {/* Start Battle Button */}
          <Button className="bg-[var(--accent)] text-white px-6 py-3 rounded-full text-lg hover:opacity-90 transition">
            Start Battle
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
