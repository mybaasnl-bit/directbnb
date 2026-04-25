'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from './use-auth';

/**
 * Controls whether the onboarding popup should be shown for a given page key.
 *
 * Anti-flash guarantee:
 *   - showPopup is false while user data is loading (prevents a flash on cached sessions)
 *   - Optimistic dismiss: popup closes immediately on "Ik begrijp het" without waiting for the API
 *   - The API call persists the step in the background; on success the React Query cache is updated
 *     so the popup never re-appears for this user/browser
 *
 * @param pageKey  e.g. 'dashboard' | 'bookings' | 'agenda' | 'rooms' | 'emails' | 'payouts' | 'settings'
 */
export function useOnboarding(pageKey: string) {
  const { user, isLoading } = useAuth();
  const qc = useQueryClient();

  // Optimistic local flag — set to true immediately when the user clicks "Ik begrijp het"
  // so the popup vanishes without waiting for the network round-trip.
  const [optimisticDismissed, setOptimisticDismissed] = useState(false);

  const completedSteps: string[] = user?.completedOnboardingSteps ?? [];
  const alreadySeen = completedSteps.includes(pageKey);

  // Only show when: user data is ready, step not yet completed, not optimistically dismissed
  const showPopup = !isLoading && !!user && !alreadySeen && !optimisticDismissed;

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/users/me/onboarding/${pageKey}`).then(
        (r) => r.data.data as string[],
      ),
    onMutate: () => {
      // Dismiss immediately — don't make the user wait for the network
      setOptimisticDismissed(true);
    },
    onSuccess: (updatedSteps) => {
      // Persist the new completedOnboardingSteps in the cached user object
      qc.setQueryData(['me'], (old: any) =>
        old ? { ...old, completedOnboardingSteps: updatedSteps } : old,
      );
    },
    // onError: intentionally left empty — the popup stays dismissed even if the API fails.
    // The step will re-appear on next login (fresh cache), which is acceptable behaviour.
  });

  return {
    showPopup,
    markComplete: () => mutation.mutate(),
    isPending: mutation.isPending,
  };
}
