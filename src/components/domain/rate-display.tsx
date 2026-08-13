import { calculateSavings } from "@/lib/rates/discount";
import { SavingsBadge } from "@/components/domain/savings-badge";

export function RateDisplay({
  rackAmount,
  stoAmount,
  currency = "USD",
  perNightLabel = "/night",
}: {
  rackAmount: number;
  stoAmount: number;
  currency?: string;
  perNightLabel?: string;
}) {
  const { savingAmount, discountPercent } = calculateSavings(
    rackAmount,
    stoAmount,
  );

  const format = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);

  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted-foreground">Normal Rate</span>
        <span className="text-muted-foreground line-through tabular-nums">
          {format(rackAmount)}{perNightLabel}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-primary">BusyBeds Member Rate</span>
        <span className="text-2xl font-bold tabular-nums text-primary">
          {format(stoAmount)}{perNightLabel}
        </span>
      </div>
      {savingAmount > 0 && (
        <div className="pt-1">
          <SavingsBadge
            savingAmount={savingAmount}
            discountPercent={discountPercent}
            currency={currency}
          />
        </div>
      )}
    </div>
  );
}
