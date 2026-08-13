import { ButtonLink } from "@/components/ui/button-link";

export const metadata = {
  title: "Verify Member",
};

export default function HotelVerifyPage() {
  return (
    <div className="container mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-bold text-primary">Verify BusyBeds Member</h1>
      <p className="mt-2 text-muted-foreground">
        Scan QR or enter coupon code. Requires deposit-confirmed status.
      </p>
      <ButtonLink href="/" className="mt-6" variant="outline">
        Home
      </ButtonLink>
    </div>
  );
}
