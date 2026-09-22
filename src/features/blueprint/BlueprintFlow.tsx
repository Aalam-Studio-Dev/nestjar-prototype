import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useMemo, useReducer, useState, type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useActiveMonth, useBudgetMonth, type BudgetMonthData } from '@/data/budget';
import { useBlueprintDraft, useCompleteBlueprint } from '@/data/month';
import {
  BLUEPRINT_STEPS,
  blueprintTotals,
  validateBalancesStep,
  validateIncomeStep,
  validatePlanStep,
  type BlueprintDraft,
  type BlueprintStep,
  type BlueprintTotals,
  type FieldIssues,
} from '@/domain/blueprint';
import { monthName } from '@/domain/month';
import { errorMessage } from '@/lib/errorMessages';
import { Button, ErrorState, LoadingState, Steps, useToast } from '@/ui';
import { OnboardingLayout } from '../onboarding/OnboardingLayout';
import { BlueprintContext, type BlueprintContextValue } from './context';
import { draftReducer, fieldId } from './draftReducer';
import { BalancesStep } from './steps/BalancesStep';
import { IncomeStep } from './steps/IncomeStep';
import { PlanStep } from './steps/PlanStep';
import { ReviewStep } from './steps/ReviewStep';
import styles from './Blueprint.module.css';

const STEP_COMPONENTS: Record<BlueprintStep, () => ReactNode> = {
  income: IncomeStep,
  balances: BalancesStep,
  plan: PlanStep,
  review: ReviewStep,
};

const STEP_LABELS: Record<BlueprintStep, string> = {
  income: 'Income',
  balances: 'Balances',
  plan: 'Jars',
  review: 'Review',
};

function issuesFor(step: BlueprintStep, draft: BlueprintDraft): FieldIssues {
  if (step === 'income') return validateIncomeStep(draft);
  if (step === 'balances') return validateBalancesStep(draft);
  return {};
}

function isStepValid(step: BlueprintStep, draft: BlueprintDraft, totals: BlueprintTotals): boolean {
  if (step === 'plan') return validatePlanStep(totals) === null;
  return Object.keys(issuesFor(step, draft)).length === 0;
}

function Editor({
  data,
  initial,
}: {
  readonly data: BudgetMonthData;
  readonly initial: BlueprintDraft;
}) {
  const params = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, dispatch] = useReducer(draftReducer, initial);
  const [attempted, setAttempted] = useState<ReadonlySet<BlueprintStep>>(new Set());
  const month = monthName(data.month);
  const complete = useCompleteBlueprint(data.budget.id, {
    onCompleted: () => {
      toast.show({
        message: `${month} is planned. Now pour your income into its jars.`,
      });
      navigate('/budget');
    },
  });

  const totals = useMemo(
    () => blueprintTotals(draft, data.budget.baseCurrency, data.rates),
    [draft, data.budget.baseCurrency, data.rates],
  );

  const step = BLUEPRINT_STEPS.find((s) => s === params.step);
  if (!step) return <Navigate to="/plan/income" replace />;

  // Deep links cannot skip ahead of an incomplete step.
  const index = BLUEPRINT_STEPS.indexOf(step);
  const blocking = BLUEPRINT_STEPS.slice(0, index).find((s) => !isStepValid(s, draft, totals));
  if (blocking) return <Navigate to={`/plan/${blocking}`} replace />;

  const issues = issuesFor(step, draft);
  const planIssue = step === 'plan' ? validatePlanStep(totals) : null;
  const previous = BLUEPRINT_STEPS[index - 1];
  const next = BLUEPRINT_STEPS[index + 1];

  const goNext = () => {
    if (!isStepValid(step, draft, totals)) {
      setAttempted((current) => new Set(current).add(step));
      // Focus the first field that needs attention; its error is in its description.
      const firstKey = Object.keys(issues)[0];
      // Wait a frame so the error text is rendered and wired to the field first.
      window.requestAnimationFrame(() => {
        const target = firstKey
          ? document.getElementById(fieldId(firstKey))
          : document.getElementById('plan-summary');
        target?.focus();
      });
      return;
    }
    if (next) navigate(`/plan/${next}`);
  };

  const finish = () => complete.mutate(draft);

  const StepComponent = STEP_COMPONENTS[step];
  const context: BlueprintContextValue = {
    data,
    draft,
    dispatch,
    totals,
    issues,
    planIssue,
    showIssues: attempted.has(step),
  };

  return (
    <div className={styles.flow}>
      <Steps
        label={`Plan ${month}`}
        steps={BLUEPRINT_STEPS.map((s) => STEP_LABELS[s])}
        current={index}
      />
      <BlueprintContext.Provider value={context}>
        <StepComponent />
      </BlueprintContext.Provider>
      {complete.isError && (
        <p role="alert" className={styles.formError}>
          {errorMessage(complete.error)}
        </p>
      )}
      <div className={styles.actionBar} data-action-bar>
        {previous ? (
          <Button
            href={`/plan/${previous}`}
            variant="secondary"
            label="Back"
            icon={<ArrowLeft size={18} aria-hidden="true" />}
          />
        ) : (
          <span />
        )}
        {next ? (
          <Button
            onClick={goNext}
            label="Continue"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            iconPosition="end"
          />
        ) : (
          <Button
            onClick={finish}
            loading={complete.isPending}
            loadingLabel={`Starting ${month}`}
            label={`Start ${month}`}
            icon={<Check size={18} aria-hidden="true" />}
          />
        )}
      </div>
    </div>
  );
}

function FlowFrame({ children }: { readonly children: ReactNode }) {
  return <OnboardingLayout>{children}</OnboardingLayout>;
}

/** Loads the month and a suggested draft, then hands both to the editor. */
export function BlueprintFlow() {
  const state = useBudgetMonth();
  const budgetId = state.status === 'ready' ? state.data.budget.id : undefined;
  const month = useActiveMonth();
  const draftQuery = useBlueprintDraft(budgetId, month);

  if (state.status === 'error') {
    return (
      <FlowFrame>
        <ErrorState onRetry={state.retry}>{errorMessage(state.error)}</ErrorState>
      </FlowFrame>
    );
  }
  if (draftQuery.isError) {
    return (
      <FlowFrame>
        <ErrorState onRetry={() => void draftQuery.refetch()}>
          {errorMessage(draftQuery.error)}
        </ErrorState>
      </FlowFrame>
    );
  }
  if (state.status !== 'ready' || !draftQuery.data) {
    return (
      <FlowFrame>
        <LoadingState label="Preparing your plan" />
      </FlowFrame>
    );
  }
  return (
    <FlowFrame>
      <Editor data={state.data} initial={draftQuery.data} />
    </FlowFrame>
  );
}
