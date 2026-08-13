import { SiteHeader } from "@/components/layout/site-header";
import { RateDisplay } from "@/components/domain/rate-display";
import { ButtonLink } from "@/components/ui/button-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="outline" className="mb-4 border-primary text-primary">
              Africa&apos;s hotel membership network
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Exclusive hotel rates for{" "}
              <span className="text-primary">members</span>
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              BusyBeds connects travelers with verified partner hotels through
              negotiated STO rates — not an OTA. Hotels control availability;
              you pay the hotel directly.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <ButtonLink
                href="/register"
                size="lg"
                className="bg-[#E8A838] text-[#084A43] hover:bg-[#d99732]"
              >
                Join BusyBeds
              </ButtonLink>
              <ButtonLink href="/hotels" variant="outline" size="lg">
                Browse hotels
              </ButtonLink>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-16">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>How member pricing works</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  Example: Zanzibar Beach Resort — Deluxe Ocean Room
                </p>
                <RateDisplay rackAmount={200} stoAmount={120} currency="USD" />
                <p className="mt-4 text-xs text-muted-foreground">
                  QR codes are issued only after availability is confirmed. Full
                  deposit to the hotel within 3 hours.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>The BusyBeds flow</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>1. Subscribe to BusyBeds membership</p>
                <p>2. Search partner hotels (min. 3-night stays)</p>
                <p>3. Request stay — we confirm availability with the hotel</p>
                <p>4. Receive QR + pay deposit directly to hotel (3 hours)</p>
                <p>5. Present QR at check-in — hotel verifies & redeems</p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        BusyBeds — membership & negotiated rates, not room booking payments.
      </footer>
    </div>
  );
}
