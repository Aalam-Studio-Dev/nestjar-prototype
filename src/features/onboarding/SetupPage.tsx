import { ArrowRight, Send } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBudget, useCurrentBudget, useInvitePartner } from '@/data/budget';
import { useServices } from '@/data/ServicesProvider';
import { CURRENCIES, type CurrencyCode } from '@/domain/money';
import type { Budget } from '@/domain/types';
import { errorMessage } from '@/lib/errorMessages';
import { useFocusHeadingOnChange } from '@/lib/useFocusHeadingOnChange';
import { Button, Card, PageHeading, SegmentedControl, Steps, TextField, useToast } from '@/ui';
import { OnboardingLayout } from './OnboardingLayout';
import styles from './Onboarding.module.css';

const SETUP_STEPS = ['Name your budget', 'Invite your partner'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CreateBudgetStep() {
  const script = useServices().demo.getScript();
  const createBudget = useCreateBudget();
  const [name, setName] = useState(script?.budgetName ?? '');
  const [currency, setCurrency] = useState<CurrencyCode>(script?.baseCurrency ?? 'GBP');
  const [nameError, setNameError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (name.trim() === '') {
      setNameError('Give your budget a name, for example both your first names.');
      nameRef.current?.focus();
      return;
    }
    setNameError(null);
    createBudget.mutate({ name, baseCurrency: currency });
  };

  return (
    <>
      <PageHeading
        documentTitle="Name your budget"
        description="A shared space for the two of you."
      >
        Name your budget
      </PageHeading>
      <Card>
        <form className={styles.form} onSubmit={submit} noValidate>
          <TextField
            ref={nameRef}
            label="Budget name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={nameError}
            autoComplete="off"
            maxLength={60}
          />
          <SegmentedControl
            legend="Base currency"
            segments={(['GBP', 'USD'] as const).map((code) => ({
              value: code,
              label: code,
              accessibleLabel: CURRENCIES[code].name,
            }))}
            value={currency}
            onChange={setCurrency}
          />
          <p className={styles.fieldNote}>
            Totals are kept in this currency. You can view them in either at any time.
          </p>
          {createBudget.isError && (
            <p role="alert" className={styles.formError}>
              {errorMessage(createBudget.error)}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={createBudget.isPending}
            loadingLabel="Creating budget"
            label="Create budget"
            icon={<ArrowRight size={18} aria-hidden="true" />}
            iconPosition="end"
          />
        </form>
      </Card>
    </>
  );
}

function InvitePartnerStep({ budget }: { readonly budget: Budget }) {
  const script = useServices().demo.getScript();
  const navigate = useNavigate();
  const toast = useToast();
  const invite = useInvitePartner({
    onCompleted: (member) => {
      toast.show({ message: `${member.displayName} joined ${budget.name}.` });
      navigate('/plan');
    },
  });
  const [displayName, setDisplayName] = useState(script?.partner.displayName ?? '');
  const [email, setEmail] = useState(script?.partner.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next: { name?: string; email?: string } = {};
    if (displayName.trim() === '') next.name = 'Enter your partner’s name.';
    if (!EMAIL_PATTERN.test(email.trim()))
      next.email = 'Enter an email address like name@example.com.';
    setErrors(next);
    if (next.name) return nameRef.current?.focus();
    if (next.email) return emailRef.current?.focus();

    invite.mutate({ budgetId: budget.id, displayName, email });
  };

  return (
    <>
      <PageHeading
        documentTitle="Invite your partner"
        eyebrow={budget.name}
        description="Budgets work best when you plan them together. Your partner sees and edits everything you do."
      >
        Invite your partner
      </PageHeading>
      <Card>
        <form className={styles.form} onSubmit={submit} noValidate>
          <TextField
            ref={nameRef}
            label="Their name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={errors.name}
            autoComplete="off"
          />
          <TextField
            ref={emailRef}
            label="Their email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
            hint="In this demo the invite is accepted straight away."
            autoComplete="off"
          />
          {invite.isError && (
            <p role="alert" className={styles.formError}>
              {errorMessage(invite.error)}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={invite.isPending}
            loadingLabel="Sending invite"
            label="Send invite"
            icon={<Send size={18} aria-hidden="true" />}
          />
        </form>
      </Card>
    </>
  );
}

/** Two short steps, driven by server state: no budget yet, or no partner yet. */
export function SetupPage() {
  const budget = useCurrentBudget().data ?? null;
  const current = budget ? 1 : 0;
  useFocusHeadingOnChange(current);

  return (
    <OnboardingLayout>
      <div className={styles.stack}>
        <Steps label="Setup progress" steps={SETUP_STEPS} current={current} />
        {budget ? <InvitePartnerStep budget={budget} /> : <CreateBudgetStep />}
      </div>
    </OnboardingLayout>
  );
}
