import { ButtonLink } from "@/components/ui/button-link";

export const metadata = {
  title: "Member App",
};

export default function GuestAppPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold text-primary">Member dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Search hotels, request stays (min. 3 nights), and manage your coupon wallet.
      </p>
      <ButtonLink href="/" className="mt-6" variant="outline">
        Home
      </ButtonLink>
    </div>
  );
}
