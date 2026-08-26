import { useCallback, useSyncExternalStore } from "react";
import {
  canSell,
  getComplianceGaps,
  getSellerCompliance,
  getSellerComplianceVersion,
  subscribeSellerCompliance,
  updateSellerCompliance,
  setSellerPin,
  verifySellerPin,
  ensureSellerDraft,
  type SellerCompliance,
  type SellerComplianceInput,
} from "./sellerComplianceStore";

export function useSellerCompliance(userId: number | undefined | null, email = "") {
  useSyncExternalStore(subscribeSellerCompliance, getSellerComplianceVersion, getSellerComplianceVersion);
  const compliance = getSellerCompliance(userId);
  const gaps = getComplianceGaps(compliance);
  const allowed = canSell(userId);

  const save = useCallback(
    (patch: SellerComplianceInput) => {
      if (!userId) throw new Error("Nicht angemeldet");
      return updateSellerCompliance(userId, email, patch);
    },
    [userId, email]
  );

  const setPin = useCallback(
    async (pin: string) => {
      if (!userId) throw new Error("Nicht angemeldet");
      return setSellerPin(userId, email, pin);
    },
    [userId, email]
  );

  const checkPin = useCallback(
    async (pin: string) => verifySellerPin(userId, pin),
    [userId]
  );

  const ensureDraft = useCallback(() => {
    if (!userId) throw new Error("Nicht angemeldet");
    return ensureSellerDraft(userId, email);
  }, [userId, email]);

  return {
    compliance,
    gaps,
    canSell: allowed,
    save,
    setPin,
    checkPin,
    ensureDraft,
  } as {
    compliance: SellerCompliance | null;
    gaps: string[];
    canSell: boolean;
    save: typeof save;
    setPin: typeof setPin;
    checkPin: typeof checkPin;
    ensureDraft: typeof ensureDraft;
  };
}
