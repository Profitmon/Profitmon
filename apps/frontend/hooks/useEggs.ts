'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Egg } from '@/lib/types';

export const useEggs = () => {
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEggs = async () => {
      const data = await api.get('/eggs');
      setEggs(data);
      setLoading(false);
    };
    fetchEggs();
  }, []);

  return { eggs, loading };
};
