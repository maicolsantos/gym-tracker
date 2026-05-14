const CONSENT_KEY = "cookie-consent"

export type ConsentStatus = "accepted" | "declined" | null

type ConsentRecord = {
  status: "accepted" | "declined"
  timestamp: string
}

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(CONSENT_KEY)
  if (!raw) return null
  try {
    const record = JSON.parse(raw) as ConsentRecord
    return record.status
  } catch {
    // legacy: plain string stored before this change
    return (raw as ConsentStatus)
  }
}

export function setConsentStatus(status: "accepted" | "declined") {
  const record: ConsentRecord = { status, timestamp: new Date().toISOString() }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record))
}

export function revokeConsent() {
  localStorage.removeItem(CONSENT_KEY)
}
