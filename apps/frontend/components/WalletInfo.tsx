'use client';

import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export function WalletInfo() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      if (publicKey) {
        const balanceLamports = await connection.getBalance(publicKey);
        setBalance(balanceLamports / LAMPORTS_PER_SOL);
      }
    };
    fetchBalance();
  }, [publicKey, connection]);

  if (!connected) {
    return <p className="text-sm text-muted-foreground">Wallet not connected</p>;
  }

  return (
    <div className="flex items-center gap-4 bg-card px-4 py-2 rounded-xl border border-border">
      <div>
        <p className="text-sm font-semibold truncate max-w-[120px]">
        <p className="text-sm font-semibold truncate max-w-[120px]">
            {publicKey?.toBase58().slice(0, 4)}...
            {publicKey?.toBase58().slice(-4) || '----'}
        </p>

        </p>
        {balance !== null && (
          <p className="text-xs text-muted-foreground">{balance.toFixed(2)} SOL</p>
        )}
      </div>
      <Button size="sm" variant="outline" onClick={disconnect}>
        Disconnect
      </Button>
    </div>
  );
}
