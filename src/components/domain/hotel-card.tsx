import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RateDisplay } from "@/components/domain/rate-display";

export function HotelCard({
  slug,
  name,
  city,
  country,
  category,
  rackAmount,
  stoAmount,
  currency = "USD",
}: {
  slug: string;
  name: string;
  city: string;
  country: string;
  category?: string | null;
  rackAmount?: number;
  stoAmount?: number;
  currency?: string;
}) {
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg">
            <Link href={`/hotels/${slug}`} className="hover:text-primary">
              {name}
            </Link>
          </CardTitle>
          {category && <Badge variant="outline">{category}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{city}, {country}</p>
      </CardHeader>
      {rackAmount && stoAmount && (
        <CardContent>
          <RateDisplay
            rackAmount={rackAmount}
            stoAmount={stoAmount}
            currency={currency}
          />
        </CardContent>
      )}
    </Card>
  );
}
