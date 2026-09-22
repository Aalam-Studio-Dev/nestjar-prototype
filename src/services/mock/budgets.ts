import type { Budget, Member } from '@/domain/types';
import type { BudgetService, CreateBudgetInput, InvitePartnerInput } from '../contracts';
import { ServiceError } from '../errors';
import { monthToDate, toBudget, toMember } from '../mappers';
import type { ReadonlyTables, Tables } from '../rows';
import type { MockContext } from './context';
import { ACCOUNTS, DEMO_MONTH, GROUPS } from './fixtures/demoHousehold';
import { buildStructure } from './queries';
import { createId, required, slug } from './support';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Deterministic ids let the blueprint suggestions find template rows again. */
export const templateIds = {
  account: (budgetId: string, key: string) => `${budgetId}.acc.${key}`,
  group: (budgetId: string, name: string) => `${budgetId}.grp.${slug(name)}`,
  category: (budgetId: string, name: string) => `${budgetId}.cat.${slug(name)}`,
};

function readBudget(tables: ReadonlyTables, budgetId: string): Budget {
  const row = required(
    tables.budgets.find((b) => b.id === budgetId),
    'Budget',
  );
  const members: Member[] = tables.budget_members
    .filter((m) => m.budget_id === budgetId)
    .map((m) =>
      toMember(
        m,
        required(
          tables.user_profiles.find((p) => p.id === m.user_id),
          'Member profile',
        ),
      ),
    );
  return toBudget(row, members);
}

/** New budgets start from a starter set of accounts and jars, as real apps do. */
function applyStarterTemplate(draft: Tables, budgetId: string, ownerId: string): void {
  ACCOUNTS.forEach((account, index) => {
    draft.accounts.push({
      id: templateIds.account(budgetId, account.key),
      budget_id: budgetId,
      name: account.name,
      institution: account.institution,
      // Partner-owned accounts are claimed when the partner joins.
      owner_id: account.owner === 'viewer' ? ownerId : null,
      native_currency: account.currency,
      sort_order: index,
    });
  });

  GROUPS.forEach((group, groupIndex) => {
    const groupId = templateIds.group(budgetId, group.name);
    draft.category_groups.push({
      id: groupId,
      budget_id: budgetId,
      name: group.name,
      sort_order: groupIndex,
    });
    group.categories.forEach((category, categoryIndex) => {
      draft.categories.push({
        id: templateIds.category(budgetId, category.name),
        budget_id: budgetId,
        group_id: groupId,
        name: category.name,
        sort_order: categoryIndex,
        archived: false,
      });
    });
  });

  draft.budget_months.push({
    budget_id: budgetId,
    month: monthToDate(DEMO_MONTH),
    status: 'draft',
    completed_at: null,
  });
}

export function createBudgetService(ctx: MockContext): BudgetService {
  return {
    async getCurrentBudget() {
      await ctx.latency();
      return ctx.db.read((tables) => {
        const membership = tables.budget_members.find((m) => m.user_id === ctx.viewerId);
        return membership ? readBudget(tables, membership.budget_id) : null;
      });
    },

    async createBudget(input: CreateBudgetInput) {
      await ctx.latency();
      const name = input.name.trim();
      if (name === '') throw new ServiceError('invalid-input', 'A budget needs a name');

      return ctx.db.transaction((draft) => {
        if (draft.budget_members.some((m) => m.user_id === ctx.viewerId)) {
          throw new ServiceError('already-exists', 'You already belong to a budget');
        }
        const budgetId = createId('bud');
        draft.budgets.push({
          id: budgetId,
          name,
          base_currency: input.baseCurrency,
          created_by: ctx.viewerId,
          created_at: new Date().toISOString(),
        });
        draft.budget_members.push({
          id: createId('mem'),
          budget_id: budgetId,
          user_id: ctx.viewerId,
          role: 'owner',
          status: 'active',
        });
        applyStarterTemplate(draft, budgetId, ctx.viewerId);
        return readBudget(draft, budgetId);
      });
    },

    async invitePartner(input: InvitePartnerInput) {
      await ctx.latency();
      const displayName = input.displayName.trim();
      const email = input.email.trim().toLowerCase();
      if (displayName === '' || !EMAIL_PATTERN.test(email)) {
        throw new ServiceError('invalid-input', 'A partner needs a name and a valid email');
      }

      return ctx.db.transaction((draft) => {
        required(
          draft.budgets.find((b) => b.id === input.budgetId),
          'Budget',
        );
        const hasPartner = draft.budget_members.some(
          (m) => m.budget_id === input.budgetId && m.role === 'partner',
        );
        if (hasPartner)
          throw new ServiceError('already-exists', 'This budget already has a partner');

        let profile = draft.user_profiles.find((p) => p.email === email);
        if (!profile) {
          profile = { id: createId('user'), display_name: displayName, email };
          draft.user_profiles.push(profile);
        }

        // The demo has no inbox, so the invite is accepted on the partner's behalf.
        const member = {
          id: createId('mem'),
          budget_id: input.budgetId,
          user_id: profile.id,
          role: 'partner' as const,
          status: 'active' as const,
        };
        draft.budget_members.push(member);

        for (const template of ACCOUNTS.filter((a) => a.owner === 'partner')) {
          const accountId = templateIds.account(input.budgetId, template.key);
          const account = draft.accounts.find((a) => a.id === accountId);
          if (account) account.owner_id = profile.id;
        }

        return toMember(member, profile);
      });
    },

    async getStructure(budgetId: string) {
      await ctx.latency();
      return ctx.db.read((tables) => buildStructure(tables, budgetId));
    },
  };
}
