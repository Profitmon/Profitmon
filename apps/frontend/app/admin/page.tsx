'use client'

import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Sparkles } from 'lucide-react'

export default function AdminPage() {
  const [cardName, setCardName] = useState('')
  const [rarity, setRarity] = useState('COMMON')
  const [attack, setAttack] = useState('')
  const [defense, setDefense] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const createCard = async () => {
    if (!cardName || !rarity || !attack || !defense || !imageUrl) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all the fields before adding a card.',
        variant: 'destructive',
      })
      return
    }

    try {
      setLoading(true)
      await api.post('/admin/cards', {
        name: cardName,
        rarity,
        attack: parseInt(attack),
        defense: parseInt(defense),
        imageUrl,
      })

      toast({
        title: 'Card Added',
        description: `${cardName} (${rarity}) has been added successfully.`,
      })

      setCardName('')
      setAttack('')
      setDefense('')
      setImageUrl('')
      setRarity('COMMON')
    } catch (error) {
      console.error(error)
      toast({
        title: 'Error',
        description: 'Something went wrong while adding the card.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <h1 className="text-4xl font-bold tracking-tight text-[var(--primary)] flex items-center gap-2 mb-8">
        <Sparkles className="h-6 w-6 text-[var(--accent)]" />
        System Admin Panel
      </h1>

      <Card className="max-w-xl border border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold">Add New Pokémon Card</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Card Name</Label>
            <Input
              id="name"
              placeholder="Enter card name"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Rarity</Label>
            <Select value={rarity} onValueChange={setRarity}>
              <SelectTrigger>
                <SelectValue placeholder="Select rarity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COMMON">Common</SelectItem>
                <SelectItem value="UNCOMMON">Uncommon</SelectItem>
                <SelectItem value="RARE">Rare</SelectItem>
                <SelectItem value="ULTRA_RARE">Ultra Rare</SelectItem>
                <SelectItem value="DOUBLE_RARE">Double Rare</SelectItem>
                <SelectItem value="ILLUSTRATION_RARE">Illustration Rare</SelectItem>
                <SelectItem value="HYPER_RARE">Hyper Rare</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="attack">Attack</Label>
              <Input
                id="attack"
                type="number"
                placeholder="Attack value"
                value={attack}
                onChange={(e) => setAttack(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="defense">Defense</Label>
              <Input
                id="defense"
                type="number"
                placeholder="Defense value"
                value={defense}
                onChange={(e) => setDefense(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              type="url"
              placeholder="https://example.com/card.png"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>
        </CardContent>

        <CardFooter>
          <Button
            disabled={loading}
            onClick={createCard}
            className="w-full bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Adding Card...
              </>
            ) : (
              'Add Card'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
