'use client';

import Link from 'next/link';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { WalletInfo } from '../WalletInfo';

export default function Navbar() {
  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-[var(--card)] border-b border-[var(--border)] shadow-md">
      {/* Logo */}
      <Link href="/" className="text-2xl font-bold text-[var(--primary)] hover:opacity-90 transition">
        Pokkie Battle
      </Link>

      {/* Navigation Links + Wallet */}
      <div className="flex items-center gap-6">
        {/* Links */}
        <div className="flex gap-4">
        <Link href="/" className="text-[var(--foreground)] hover:text-[var(--accent)] transition">
            Arena
          </Link>
          <Link href="/dashboard" className="text-[var(--foreground)] hover:text-[var(--accent)] transition">
            Dashboard
          </Link>
          <Link href="/hatch" className="text-[var(--foreground)] hover:text-[var(--accent)] transition">
            Hatch
          </Link>
          <Link href="/admin" className="text-[var(--foreground)] hover:text-[var(--accent)] transition">
            Admin
          </Link>
        </div>

        {/* Wallet Info & Button */}
        <div className="flex items-center gap-2">
          <WalletInfo />
          <WalletMultiButton className="bg-[var(--primary)] text-white rounded-full px-4 py-2 hover:opacity-90 transition" />
        </div>
      </div>
    </nav>
  );
}
