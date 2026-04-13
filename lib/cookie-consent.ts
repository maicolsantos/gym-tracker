const CONSENT_KEY = "cookie-consent"

export type ConsentStatus = "accepted" | "declined" | null

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null
  return (localStorage.getItem(CONSENT_KEY) as ConsentStatus) ?? null
}

export function setConsentStatus(status: "accepted" | "declined") {
  localStorage.setItem(CONSENT_KEY, status)
}
