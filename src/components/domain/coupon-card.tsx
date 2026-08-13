"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RateDisplay } from "@/components/domain/rate-display";
import { DEPOSIT_WINDOW_HOURS } from "@/lib/constants";

export function CouponCard({
  code,
  hotelName,
  roomName,
  rackAmount,
  stoAmount,
  currency,
  status,
  depositDeadline,
  nights,
  checkIn,
  checkOut,
  qrDataUrl,
}: {
  code: string;
  hotelName: string;
  roomName: string;
  rackAmount: number;
  stoAmount: number;
  currency: string;
  status: string;
  depositDeadline?: Date | null;
  nights: number;
  checkIn: string;
  checkOut: string;
  qrDataUrl?: string | null;
}) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!depositDeadline || status !== "DEPOSIT_PENDING") return;
    const tick = () => {
      const ms = new Date(depositDeadline).getTime() - Date.now();
      if (ms <= 0) {
        setRemaining("Expired");
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [depositDeadline, status]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{hotelName}</CardTitle>
          <Badge>{status.replace(/_/g, " ")}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{roomName}</p>
        <p className="text-xs text-muted-foreground">
          {checkIn} → {checkOut} ({nights} nights)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <RateDisplay rackAmount={rackAmount} stoAmount={stoAmount} currency={currency} />
        <p className="font-mono text-lg font-bold">{code}</p>
        {status === "DEPOSIT_PENDING" && depositDeadline && (
          <p className="text-sm font-medium text-amber-700">
            Pay full deposit to hotel within: {remaining || `${DEPOSIT_WINDOW_HOURS}h window`}
          </p>
        )}
        {qrDataUrl && (
          <img src={qrDataUrl} alt="QR code" className="mx-auto rounded border" />
        )}
      </CardContent>
    </Card>
  );
}
