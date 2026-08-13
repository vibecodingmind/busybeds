import { test, expect } from "vitest";
import { calculateSavings } from "@/lib/rates/discount";

test("busybeds savings display at 25% threshold", () => {
  const at25 = calculateSavings(160, 120);
  expect(at25.discountPercent).toBe(25);
  expect(at25.requiresAdminApproval).toBe(false);

  const above25 = calculateSavings(200, 120);
  expect(above25.requiresAdminApproval).toBe(true);
});
