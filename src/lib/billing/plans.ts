export type PlanId = "free" | "pro" | "enterprise";
export type OrgStatus = "active" | "trial" | "past_due" | "canceled";
export type MemberRole = "owner" | "admin" | "member";

export const PLANS: Record<
  PlanId,
  {
    id: PlanId;
    label: string;
    maxSeats: number;
    maxFlows: number;
    priceLabel: string;
    features: string[];
  }
> = {
  free: {
    id: "free",
    label: "Gratuit",
    maxSeats: 1,
    maxFlows: 3,
    priceLabel: "0 €",
    features: ["3 flux", "1 utilisateur", "Rapport PDF"],
  },
  pro: {
    id: "pro",
    label: "Pro",
    maxSeats: 5,
    maxFlows: 50,
    priceLabel: "49 € / mois",
    features: ["50 flux", "5 utilisateurs", "Yamazumi + MOS", "Support email"],
  },
  enterprise: {
    id: "enterprise",
    label: "Entreprise",
    maxSeats: 200,
    maxFlows: 10_000,
    priceLabel: "Sur devis",
    features: [
      "Flux illimités",
      "Sièges illimités",
      "Admins entreprise",
      "SSO (bientôt)",
      "Support dédié",
    ],
  },
};

export function planOf(id: string | null | undefined) {
  if (id === "pro" || id === "enterprise" || id === "free") return PLANS[id];
  return PLANS.free;
}

export function isPaidPlan(id: string | null | undefined) {
  return id === "pro" || id === "enterprise";
}

export function canManageMembers(role: MemberRole | string) {
  return role === "owner" || role === "admin";
}
