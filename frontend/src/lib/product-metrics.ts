import type { DescriptionStatus, Product } from "@/types/pim";

export function descriptionStatus(p: Product): DescriptionStatus {
  const len = p.description.trim().length;
  if (len === 0) return "missing";
  if (len < 80) return "short";
  return "complete";
}

export function missingAttributes(p: Product): string[] {
  return p.requiredAttributes.filter((k) => !p.attributes[k]);
}

export function completeness(p: Product): number {
  if (!p.requiredAttributes.length) return 100;
  const filled = p.requiredAttributes.length - missingAttributes(p).length;
  return Math.round((filled / p.requiredAttributes.length) * 100);
}

export function isIncomplete(p: Product): boolean {
  return descriptionStatus(p) !== "complete" || missingAttributes(p).length > 0;
}

export const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
