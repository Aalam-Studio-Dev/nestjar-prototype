import {
  BookOpen,
  Landmark,
  PiggyBank,
  ReceiptText,
  Settings,
  type LucideIcon,
} from 'lucide-react';

export interface NavDestination {
  readonly to: string;
  readonly label: string;
  /** For the bottom tab bar, where five labels share a 320px screen. */
  readonly shortLabel?: string;
  readonly icon: LucideIcon;
  /** Locked items are visible, reachable, and explain they are outside the demo. */
  readonly locked: boolean;
}

export const NAV_ITEMS: readonly NavDestination[] = [
  { to: '/budget', label: 'Budget', icon: PiggyBank, locked: false },
  { to: '/activity', label: 'Activity', icon: ReceiptText, locked: false },
  { to: '/accounts', label: 'Accounts', icon: Landmark, locked: true },
  { to: '/settings', label: 'Settings', icon: Settings, locked: true },
  // Beside the story rather than part of it, so it sits last.
  { to: '/system', label: 'Design notes', shortLabel: 'Notes', icon: BookOpen, locked: false },
];
