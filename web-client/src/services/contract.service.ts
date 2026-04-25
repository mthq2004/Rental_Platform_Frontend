import envConfig from "@/config";

const BASE = `${envConfig.NEXT_PUBLIC_API_ENDPOINT}/contract`;

async function authFetch(url: string, opts: RequestInit = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token") ?? ""
      : "";
  const res = await fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

// ── Termination ─────────────────────────────────────────

export async function createTerminationRequest(payload: {
  rentalId: string;
  reason: string;
  note?: string;
  requestedTerminationDate: string;
  earlyTerminationFee?: number;
}) {
  return authFetch(`${BASE}/terminations`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getTerminationRequests(rentalId: string) {
  return authFetch(`${BASE}/terminations/contract/${rentalId}`);
}

export async function reviewTerminationRequest(
  id: string,
  payload: { status: "approved" | "rejected"; reviewNote?: string }
) {
  return authFetch(`${BASE}/terminations/${id}/review`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function updateTerminationStatus(
  id: string,
  payload: { status: string; resolution?: string; note?: string }
) {
  return authFetch(`${BASE}/terminations/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// ── Reports ─────────────────────────────────────────────

export async function createReport(payload: {
  rentalId: string;
  againstId: string;
  terminationRequestId?: string;
  type: string;
  priority?: string;
  title: string;
  description: string;
  attachments?: { url: string; type: string; fileName?: string; fileSize?: number }[];
}) {
  return authFetch(`${BASE}/reports`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getReportsByContract(rentalId: string) {
  return authFetch(`${BASE}/reports/contract/${rentalId}`);
}

export async function updateReportStatus(
  id: string,
  payload: { status: string; note?: string; adminNote?: string; terminationResolution?: string }
) {
  return authFetch(`${BASE}/reports/${id}/status`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
