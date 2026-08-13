import { Badge } from "@/components/ui/badge";

export function SavingsBadge({
  savingAmount,
  discountPercent,
  currency = "USD",
}: {
  savingAmount: number;
  discountPercent: number;
  currency?: string;
}) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(savingAmount);

  return (
    <Badge
      className="bg-[#E8A838] text-[#084A43] hover:bg-[#E8A838] text-sm font-semibold"
    >
      You save {formatted} ({discountPercent}% OFF)
    </Badge>
  );
}
