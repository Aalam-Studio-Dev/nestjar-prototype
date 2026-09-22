import { Navigate, Outlet, type RouteObject } from 'react-router-dom';
import { BlueprintFlow } from '@/features/blueprint/BlueprintFlow';
import { BudgetPage } from '@/features/budget/BudgetPage';
import { LockedPage } from '@/features/locked/LockedPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { SetupPage } from '@/features/onboarding/SetupPage';
import { WelcomePage } from '@/features/onboarding/WelcomePage';
import { MonthReviewPage } from '@/features/review/MonthReviewPage';
import { DesignSystemPage } from '@/features/system/DesignSystemPage';
import { NotesPage } from '@/features/system/NotesPage';
import { ActivityPage } from '@/features/transactions/ActivityPage';
import { AppShell } from './AppShell/AppShell';
import { DesignNotesShell } from './DesignNotesShell';
import { StageGate, StartRedirect } from './journey';
import { RouteFocus } from './RouteFocus';

function Root() {
  return (
    <>
      <RouteFocus />
      <Outlet />
    </>
  );
}

/**
 * The route table is the map of the happy path. Each branch is wrapped in a
 * StageGate, so a screen can only be reached at the point in the story where
 * it makes sense.
 */
export const routes: RouteObject[] = [
  {
    element: <Root />,
    children: [
      { index: true, element: <StartRedirect /> },
      {
        path: 'welcome',
        element: (
          <StageGate allow={['create']}>
            <WelcomePage />
          </StageGate>
        ),
      },
      {
        path: 'setup',
        element: (
          <StageGate allow={['create', 'invite']}>
            <SetupPage />
          </StageGate>
        ),
      },
      {
        path: 'plan',
        element: (
          <StageGate allow={['plan']}>
            <Outlet />
          </StageGate>
        ),
        children: [
          { index: true, element: <Navigate to="income" replace /> },
          // One route for every step keeps the flow mounted, so the draft
          // survives moving between steps and the Back button works.
          { path: ':step', element: <BlueprintFlow /> },
        ],
      },
      {
        element: (
          <StageGate allow={['budget']}>
            <AppShell />
          </StageGate>
        ),
        children: [
          { path: 'budget', element: <BudgetPage /> },
          { path: 'budget/review', element: <MonthReviewPage /> },
          { path: 'activity', element: <ActivityPage /> },
          {
            path: 'accounts',
            element: (
              <LockedPage
                title="Accounts"
                summary="In the full product, Accounts reconciles each bank balance against what the budget expects, and models transfers between your accounts."
              />
            ),
          },
          {
            path: 'settings',
            element: (
              <LockedPage
                title="Settings"
                summary="In the full product, Settings manages members, jar groups, recurring bills and the fixed exchange rate you agree on each month."
              />
            ),
          },
        ],
      },
      {
        // Open at every stage: a panel of the app once the month is running,
        // and a page beside the story before that.
        path: 'system',
        element: (
          <StageGate allow={['create', 'invite', 'plan', 'budget']}>
            <DesignNotesShell />
          </StageGate>
        ),
        children: [
          { index: true, element: <DesignSystemPage /> },
          { path: 'notes', element: <NotesPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
];
