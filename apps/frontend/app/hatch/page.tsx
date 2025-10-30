'use client'

import { useState, useEffect } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import HatchEgg from '@/components/HatchEgg'
import { eggService } from '../../../backend/src/services/eggService'
import { UserEgg } from '@repo/sharedtypes/types'

export default function HatchPage() {
  const { publicKey, connect, connected } = useWallet()
  const [walletAddress, setWalletAddress] = useState<string>("")
  const [eggs, setEggs] = useState<UserEgg[]>() // list of eggIds
  const [selectedEgg, setSelectedEgg] = useState<string | null>(null)

  useEffect(() => {
    if (connected && publicKey) {
      setWalletAddress(publicKey.toBase58())
    }
  }, [connected, publicKey])

  useEffect(() => {
    if (walletAddress) {
      fetchUnhatchedEggs(walletAddress)
    }
  }, [walletAddress])

  const fetchUnhatchedEggs = async (wallet: string) => {
    try {
      const eggsFromDB = await eggService.getAvailableEggs(wallet)

      console.log("eggFromDB : ",eggsFromDB)
      
      const mappedEggs = eggsFromDB.map(egg => ({
        id: egg.id,
        userId: egg.userId || wallet,
        type: egg.type,
        isHatched: egg.isHatched,
        createdAt: egg.createdAt.getTime()
      }))
      setEggs(mappedEggs)

    } catch (err) {
      console.error(err)
    }
  }

  const handleConnect = async () => {
    if (!connected) await connect()
  }

  const handleSelectEgg = (eggId: string) => {
    setSelectedEgg(eggId)
  }

  return (
    <div>
      <h1>Hatch Your Egg</h1>

      {!walletAddress && (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}

      {walletAddress && !selectedEgg && eggs && eggs.length > 0 && (
        <div>
          <h3>Your Unhatched Eggs:</h3>
          <ul>
            {eggs.map((egg) => (
              <li key={egg.id}>
                {egg.type} Egg - {egg.id}{' '}
                <button onClick={() => handleSelectEgg(egg.id)}>
                  Hatch This Egg
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selectedEgg && (
        <HatchEgg wallet={walletAddress} eggId={selectedEgg} />
      )}
    </div>
  )
}
