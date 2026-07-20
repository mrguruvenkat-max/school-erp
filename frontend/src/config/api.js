export const API_URL = 'https://school-erp-mado.onrender.com';

export async function parseResponse(response) {
  const contentType = response.headers.get('content-type');

  if (!response.ok) {
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      } catch (e) {
        throw new Error(e.message || 'Request failed', { cause: e });
      }
    }
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  const text = await response.text();
  throw new Error(
    `Expected JSON but received: ${text.substring(0, 100)}`
  );
}
