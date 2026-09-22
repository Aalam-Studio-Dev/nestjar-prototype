import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { Minor } from '@/domain/money';
import { expectAccessible } from '@/test/axe';
import { MoneyField } from './MoneyField/MoneyField';

describe('MoneyField', () => {
  function Harness({ onValue }: { onValue: (v: Minor | null) => void }) {
    const [value, setValue] = useState<Minor | null>(6420);
    return (
      <MoneyField
        label="Amount"
        currency="GBP"
        value={value}
        onValueChange={(next) => {
          setValue(next);
          onValue(next);
        }}
        hint="Counts in full."
        error={value === null ? 'Enter an amount above zero.' : undefined}
      />
    );
  }

  it('reports minor units and wires hint and error to the input', async () => {
    const user = userEvent.setup();
    const onValue = vi.fn();
    const { container } = render(<Harness onValue={onValue} />);
    const input = screen.getByLabelText('Amount');
    expect(input).toHaveValue('64.20');
    expect(input).toHaveAccessibleDescription('Counts in full.');

    await user.clear(input);
    expect(onValue).toHaveBeenLastCalledWith(null);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription(/Enter an amount above zero\./);

    await user.type(input, '12.5');
    expect(onValue).toHaveBeenLastCalledWith(1250);
    await user.tab();
    expect(input).toHaveValue('12.50');
    await expectAccessible(container);
  });
});
