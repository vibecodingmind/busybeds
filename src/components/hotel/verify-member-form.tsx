"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyCouponAction, redeemCouponAction } from "@/lib/actions/app-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyMemberForm({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    booking: { id: string; couponCode: string | null; stoSnapshot: unknown; rackSnapshot: unknown };
    member: { firstName: string | null; lastName: string | null; email: string };
  } | null>(null);

  async function handleVerify() {
    setError("");
    const res = await verifyCouponAction(code, hotelId);
    if (res.error) {
      setError(res.error);
      setResult(null);
      return;
    }
    if (res.success && res.booking && res.member) {
      setResult({ booking: res.booking, member: res.member });
      router.refresh();
    }
  }

  async function handleRedeem() {
    if (!result) return;
    await redeemCouponAction(result.booking.id);
    setResult(null);
    setCode("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-primary">Verify BusyBeds Member</h1>
      <Card>
        <CardHeader>
          <CardTitle>Scan or enter code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Coupon code</Label>
            <Input
              id="code"
              placeholder="BB-XXXXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button onClick={handleVerify} className="w-full">Verify member</Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">MEMBER VERIFIED ✓</CardTitle>
            <p className="text-sm">
              {result.member.firstName} {result.member.lastName} ({result.member.email})
            </p>
            <p className="text-sm">
              Member rate: ${Number(result.booking.stoSnapshot)} · Normal: ${Number(result.booking.rackSnapshot)}
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRedeem} className="w-full">Complete redemption</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
