// A brief stall on the way to the database should not cost someone the detail they just typed.
// Only connection timeouts are retried; a real answer to the request is passed straight back.
const TIMEOUT = /timed out|timeout/i;

const messageOf = (error) => error?.response?.data?.error || error?.message || '';

export default async function retryOnTimeout(operation, attempts = 2) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !TIMEOUT.test(messageOf(error))) throw error;
    }
  }
  throw lastError;
}