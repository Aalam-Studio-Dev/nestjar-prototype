import { CURRENCIES } from '@/domain/money';
import type { Account, Budget } from '@/domain/types';

export function firstName(fullName: string): string {
  return fullName.split(/\s+/)[0] ?? fullName;
}

/** "Chase checking" style label: institution first, as people say it aloud. */
export function accountName(account: Account): string {
  return `${account.institution} ${account.name.toLowerCase()}`;
}

export function accountOwner(account: Account, budget: Budget): string {
  if (account.ownerId === null) return 'Joint';
  const owner = budget.members.find((m) => m.id === account.ownerId);
  return owner ? firstName(owner.displayName) : 'Joint';
}

export function accountDetail(account: Account, budget: Budget): string {
  return `${accountOwner(account, budget)} · ${CURRENCIES[account.currency].name}s`;
}
