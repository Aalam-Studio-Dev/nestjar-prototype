import { useDisplayCurrency } from '@/data/displayCurrency';
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from '@/domain/money';
import { SegmentedControl } from '@/ui';

export function CurrencyToggle({ baseCurrency }: { readonly baseCurrency: CurrencyCode }) {
  const { currency, setCurrency } = useDisplayCurrency(baseCurrency);
  return (
    <SegmentedControl
      legend="Show amounts in"
      hideLegend
      size="sm"
      value={currency}
      onChange={setCurrency}
      segments={CURRENCY_CODES.map((code) => ({
        value: code,
        label: code,
        accessibleLabel: `${CURRENCIES[code].name}s`,
      }))}
    />
  );
}
