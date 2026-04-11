import { clearAllRoomMetadataStorage } from "./roomMetadata";
import { clearBrowserLocalRoomSessionState } from "./roomSession";
import { getApiServerBaseUrl } from "./runtimeConfig";
import { clearAllBrowserLocalRoomStorage } from "./storage";

export type ClientResetPolicy = {
  policyId: string;
  issuedAt: string;
  reason?: string;
  scope: "all-browser-local-room-state";
  mode: "once-per-browser";
};

const CLIENT_RESET_POLICY_ACK_STORAGE_KEY =
  "play-space-alpha-client-reset-policy-ack-v1";

export async function applyClientResetPolicyIfNeeded() {
  const policy = await fetchClientResetPolicy();

  if (!policy) {
    return;
  }

  const acknowledgedPolicyId = localStorage
    .getItem(CLIENT_RESET_POLICY_ACK_STORAGE_KEY)
    ?.trim();

  if (acknowledgedPolicyId === policy.policyId) {
    return;
  }

  wipeBrowserLocalRoomMemoryState();
  localStorage.setItem(CLIENT_RESET_POLICY_ACK_STORAGE_KEY, policy.policyId);
}

async function fetchClientResetPolicy() {
  try {
    const response = await fetch(
      new URL("/api/client-reset-policy", getApiServerBaseUrl()).toString()
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`client-reset-policy-fetch-failed:${response.status}`);
    }

    const parsed = (await response.json()) as {
      policy?: Partial<ClientResetPolicy> | null;
    };

    const policy = parsed.policy;

    if (
      !policy ||
      typeof policy.policyId !== "string" ||
      policy.policyId.trim().length === 0 ||
      policy.scope !== "all-browser-local-room-state" ||
      policy.mode !== "once-per-browser" ||
      typeof policy.issuedAt !== "string" ||
      policy.issuedAt.trim().length === 0
    ) {
      return null;
    }

    return {
      policyId: policy.policyId,
      issuedAt: policy.issuedAt,
      reason: typeof policy.reason === "string" ? policy.reason : undefined,
      scope: policy.scope,
      mode: policy.mode,
    } satisfies ClientResetPolicy;
  } catch (error) {
    console.warn("[client-reset-policy][fetch-failed]", error);
    return null;
  }
}

function wipeBrowserLocalRoomMemoryState() {
  clearBrowserLocalRoomSessionState();
  clearAllRoomMetadataStorage();
  clearAllBrowserLocalRoomStorage();
}
