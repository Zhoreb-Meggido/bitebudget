/**
 * useDatabase Hook
 *
 * Initialiseert de database bij het mounten van de app
 * en geeft toegang tot de database instance
 */

import { useEffect, useState } from 'react';
import { databaseService, db } from '@/services';
import type { VoedseljournaalDB } from '@/services';

export function useDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initDatabase() {
      try {
        await databaseService.init();
        if (mounted) {
          setIsInitialized(true);
          console.log('✅ Database hook: initialized');
        }
      } catch (err) {
        console.error('❌ Database hook: initialization failed', err);
        if (mounted) {
          setError(err as Error);
        }
      }
    }

    initDatabase();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    db,
    isInitialized,
    error,
  };
}

export default useDatabase;
