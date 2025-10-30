import { ReactNode } from 'react';

export default function BentoGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {children}
    </div>
  );
}
