import Link from "next/link";
import { ButtonLink } from "@/components/ui/button-link";

export function SiteHeader() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          BusyBeds
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/hotels" className="text-muted-foreground hover:text-foreground">
            Hotels
          </Link>
          <Link href="/plans" className="text-muted-foreground hover:text-foreground">
            Membership
          </Link>
          <Link href="/for-hotels" className="text-muted-foreground hover:text-foreground">
            For Hotels
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <ButtonLink href="/login" variant="ghost">
            Log in
          </ButtonLink>
          <ButtonLink
            href="/register"
            className="bg-[#E8A838] text-[#084A43] hover:bg-[#d99732]"
          >
            Join BusyBeds
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
