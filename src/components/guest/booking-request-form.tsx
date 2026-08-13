"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createStayRequestAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MIN_STAY_NIGHTS } from "@/lib/constants";

export function BookingRequestForm({
  hotelId,
  roomTypeId,
  defaultCheckIn,
}: {
  hotelId: string;
  roomTypeId: string;
  defaultCheckIn: string;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData();
    fd.set("hotelId", hotelId);
    fd.set("roomTypeId", roomTypeId);
    fd.set("checkIn", checkIn);
    fd.set("checkOut", checkOut);
    const res = await createStayRequestAction(fd);
    setLoading(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/app/wallet");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <p className="text-xs text-muted-foreground">Minimum stay: {MIN_STAY_NIGHTS} nights</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label>Check-in</Label>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} required />
        </div>
        <div>
          <Label>Check-out</Label>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} required />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        Request stay (availability check)
      </Button>
    </form>
  );
}
