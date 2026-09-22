import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectAccessible } from '@/test/axe';
import { Button } from './Button/Button';
import { ProgressTrack } from './ProgressTrack/ProgressTrack';
import { SegmentedControl } from './SegmentedControl/SegmentedControl';
import { Sheet } from './Sheet/Sheet';
import { ToastProvider, useToast, type ToastInput } from './Toast/ToastProvider';

describe('Button', () => {
  it('names an icon-only button from its label and reports presses', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { container } = render(
      <Button iconOnly label="Add a jar" icon={<Plus aria-hidden="true" />} onClick={onClick} />,
    );
    await user.click(screen.getByRole('button', { name: 'Add a jar' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    await expectAccessible(container);
  });

  it('becomes a real link when given an href', () => {
    render(
      <MemoryRouter>
        <Button href="/budget" label="Back to budget" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Back to budget' })).toHaveAttribute('href', '/budget');
  });

  it('stays focusable and swallows presses while loading', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button label="Seed jar" loading loadingLabel="Seeding" onClick={onClick} />);
    const button = screen.getByRole('button', { name: 'Seeding' });
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeEnabled();
    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ProgressTrack', () => {
  it('is decoration unless it is given a label', () => {
    const { container, rerender } = render(
      <ProgressTrack layers={[{ ratio: 0.5, tone: 'moss' }]} />,
    );
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    rerender(<ProgressTrack layers={[{ ratio: 0.5, tone: 'moss' }]} label="Half seeded" />);
    expect(screen.getByRole('img', { name: 'Half seeded' })).toBeInTheDocument();
  });
});

describe('Toast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function Trigger({ toast }: { readonly toast: ToastInput }) {
    const { show } = useToast();
    return <button onClick={() => show(toast)}>Show</button>;
  }

  function showToast(toast: ToastInput) {
    render(
      <ToastProvider>
        <Trigger toast={toast} />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Show' }));
  }

  it('closes a transient toast after three seconds', () => {
    vi.useFakeTimers();
    showToast({ message: 'Seeded £520.' });
    expect(screen.getByRole('status')).toHaveTextContent('Seeded £520.');
    act(() => vi.advanceTimersByTime(2900));
    expect(screen.getByText('Seeded £520.')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByText('Seeded £520.')).not.toBeInTheDocument();
  });

  it('keeps a persistent toast until it is dismissed', () => {
    vi.useFakeTimers();
    showToast({ message: 'Rates are a day old.', persistent: true });
    act(() => vi.advanceTimersByTime(60_000));
    expect(screen.getByText('Rates are a day old.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByText('Rates are a day old.')).not.toBeInTheDocument();
  });

  it('announces errors assertively', () => {
    showToast({
      message: 'That did not save.',
      tone: 'error',
      persistent: true,
    });
    expect(screen.getByRole('alert')).toHaveTextContent('That did not save.');
  });
});

describe('SegmentedControl', () => {
  function Currency() {
    const [value, setValue] = useState<'GBP' | 'USD'>('GBP');
    return (
      <SegmentedControl
        legend="Show amounts in"
        value={value}
        onChange={setValue}
        segments={[
          { value: 'GBP', label: 'GBP', accessibleLabel: 'British pounds' },
          { value: 'USD', label: 'USD', accessibleLabel: 'US dollars' },
        ]}
      />
    );
  }

  it('is a labelled radio group that arrow keys operate', async () => {
    const user = userEvent.setup();
    const { container } = render(<Currency />);
    expect(screen.getByRole('group', { name: 'Show amounts in' })).toBeInTheDocument();

    await user.tab();
    expect(screen.getByRole('radio', { name: 'British pounds' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'US dollars' })).toBeChecked();
    await expectAccessible(container);
  });
});

describe('Sheet', () => {
  it('names itself from its title and closes on Escape', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Sheet open onClose={onClose} title="Seed Groceries" description="£58.00 left">
        <label htmlFor="x">Amount</label>
        <input id="x" />
      </Sheet>,
    );
    const dialog = screen.getByRole('dialog', { name: 'Seed Groceries' });
    expect(dialog).toHaveAccessibleDescription('£58.00 left');
    expect(screen.getByLabelText('Amount')).toHaveFocus();

    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
