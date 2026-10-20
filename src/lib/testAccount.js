// The testing account. One address that can empty its own career history so fresh personas
// (a doctor, a construction worker, anyone else) can be built and looked over from nothing.
// Every other account never sees these controls.
export const TEST_ACCOUNT_EMAIL = 'kellarm@xfhgamestudio.com';

export function isTestAccount(user) {
  return String(user?.email || '').trim().toLowerCase() === TEST_ACCOUNT_EMAIL;
}