"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerGuestAction } from "@/lib/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SiteHeader } from "@/components/layout/site-header";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const res = await registerGuestAction(formData);
    if (res.error) {
      setError(res.error);
      return;
    }
    router.push("/login");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="container mx-auto flex min-h-[70vh] items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Create member account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>First name</Label>
                  <Input name="firstName" />
                </div>
                <div className="space-y-2">
                  <Label>Last name</Label>
                  <Input name="lastName" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" type="email" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input name="password" type="password" required minLength={8} />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full">Register</Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
