'use client'

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useEggs } from '@/hooks/useEggs'
import BentoGrid from '@/components/layouts/BantoGrid'
import EggCard from '@/components/EggCard'
import { Sparkles } from 'lucide-react'

export default function DashboardPage() {
  const { eggs, loading } = useEggs()

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-[var(--accent)]" />
          Your Eggs
        </h1>
        <Button className="bg-[var(--accent)] text-[var(--accent-foreground)] hover:opacity-90 transition-all">
          + Buy New Egg
        </Button>
      </div>

      {loading ? (
        <BentoGrid>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full rounded-lg" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </BentoGrid>
      ) : eggs.length > 0 ? (
        <BentoGrid>
          {eggs.map((egg) => (
            <EggCard key={egg.id} egg={egg} />
          ))}
        </BentoGrid>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
          <img
            src="/empty-eggs.svg"
            alt="No eggs"
            className="h-40 w-40 mb-6 opacity-80"
          />
          <h2 className="text-xl font-medium">No eggs found</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-4">
            You haven’t bought or received any eggs yet.
          </p>
          <Button className="bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-all">
            Get Your First Egg
          </Button>
        </div>
      )}
    </div>
  )
}
