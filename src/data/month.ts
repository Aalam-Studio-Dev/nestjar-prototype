import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BlueprintDraft } from '@/domain/blueprint';
import type { MonthKey } from '@/domain/month';
import type { CategorySeed, MonthSnapshot } from '@/domain/types';
import type { LogTransactionInput, SeedManyInput } from '@/services/contracts';
import { queryKeys } from './queryKeys';
import { useServices } from './ServicesProvider';

export function useBlueprintDraft(budgetId: string | undefined, month: MonthKey) {
  const services = useServices();
  return useQuery({
    queryKey: queryKeys.blueprintDraft(budgetId ?? '', month),
    queryFn: () => services.months.getBlueprintDraft(budgetId ?? '', month),
    enabled: budgetId !== undefined,
    // The draft seeds local form state once; refetching would clobber edits.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

/**
 * Success work that must survive the wizard unmounting goes in `onCompleted`.
 * Flipping the month to active makes the route guard leave the wizard, and
 * TanStack Query skips per-call `mutate(…, { onSuccess })` callbacks once the
 * calling component has unmounted. `onCompleted` runs in the same tick as the
 * cache write, so its navigation and the guard see the same state.
 */
export function useCompleteBlueprint(
  budgetId: string,
  { onCompleted }: { readonly onCompleted?: (snapshot: MonthSnapshot) => void } = {},
) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (draft: BlueprintDraft) => services.months.completeBlueprint(budgetId, draft),
    onSuccess: (snapshot) => {
      queryClient.setQueryData(queryKeys.month(budgetId, snapshot.month), snapshot);
      queryClient.removeQueries({
        queryKey: queryKeys.blueprintDraft(budgetId, snapshot.month),
      });
      onCompleted?.(snapshot);
    },
  });
}

function applySeeds(snapshot: MonthSnapshot, additions: readonly CategorySeed[]): MonthSnapshot {
  const seeded = new Map(snapshot.seeds.map((s) => [s.categoryId, s.seeded]));
  for (const addition of additions) {
    seeded.set(addition.categoryId, (seeded.get(addition.categoryId) ?? 0) + addition.seeded);
  }
  return {
    ...snapshot,
    seeds: [...seeded].map(([categoryId, amount]) => ({
      categoryId,
      seeded: amount,
    })),
  };
}

/**
 * Seeding updates the cache optimistically so the central jar drains the
 * moment the person confirms. If the write fails the previous snapshot is
 * restored and the error surfaces in the sheet that triggered it.
 */
export function useSeed(budgetId: string, month: MonthKey) {
  const services = useServices();
  const queryClient = useQueryClient();
  const key = queryKeys.month(budgetId, month);

  return useMutation({
    mutationFn: (instructions: SeedManyInput['instructions']) =>
      instructions.length === 1 && instructions[0]
        ? services.months
            .seedCategory({ budgetId, month, ...instructions[0] })
            .then((seed) => [seed])
        : services.months.seedMany({ budgetId, month, instructions }),
    onMutate: async (instructions) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MonthSnapshot>(key);
      if (previous) {
        queryClient.setQueryData(
          key,
          applySeeds(
            previous,
            instructions.map((i) => ({
              categoryId: i.categoryId,
              seeded: i.amount,
            })),
          ),
        );
      }
      return { previous };
    },
    onError: (_error, _instructions, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}

export function useLogTransaction(budgetId: string, month: MonthKey) {
  const services = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Omit<LogTransactionInput, 'budgetId' | 'month'>) =>
      services.transactions.logTransaction({ ...input, budgetId, month }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: queryKeys.month(budgetId, month),
      }),
  });
}
