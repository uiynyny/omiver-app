/**
 * In-memory store for registration credentials.
 *
 * The multi-step sign-up flow (register → account type → personal info →
 * health → goals → dietary → terms) needs to carry a password and security
 * answer across route changes before the account exists server-side.
 *
 * Those values deliberately live in module scope rather than in `AppContext`:
 *
 *  - `AppContext` is serialized to localStorage on every change, which would
 *    persist a cleartext password indefinitely, readable by any XSS payload,
 *    browser extension, or anyone with access to the device.
 *  - Module scope survives client-side navigation (what the flow needs) but is
 *    destroyed on reload or tab close (what security needs).
 *
 * Always call `clearCredentials()` once registration completes.
 */

export type PendingCredentials = {
  password?: string;
  securityAnswer?: string;
};

let credentials: PendingCredentials = {};

export const setCredentials = (next: PendingCredentials): void => {
  credentials = { ...credentials, ...next };
};

export const getCredentials = (): PendingCredentials => credentials;

export const clearCredentials = (): void => {
  credentials = {};
};
