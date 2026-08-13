import { describe, expect, it } from "vitest";
import {
  calculateSavings,
  minimumRackForSto,
  validateMinStay,
} from "@/lib/rates/discount";

describe("calculateSavings", () => {
  it("computes savings and discount percent", () => {
    const result = calculateSavings(200, 120);
    expect(result.savingAmount).toBe(80);
    expect(result.discountPercent).toBe(40);
    expect(result.requiresAdminApproval).toBe(true);
  });

  it("flags discounts above 25% for admin approval", () => {
    const result = calculateSavings(160, 120);
    expect(result.discountPercent).toBe(25);
    expect(result.requiresAdminApproval).toBe(false);
  });
});

describe("minimumRackForSto", () => {
  it("returns minimum rack for 25% max discount", () => {
    expect(minimumRackForSto(120)).toBe(160);
  });
});

describe("validateMinStay", () => {
  it("requires at least 3 nights", () => {
    expect(validateMinStay(3, 3)).toBe(true);
    expect(validateMinStay(2, 3)).toBe(false);
  });
});
