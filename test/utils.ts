import server from '../src/index';

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function request(path: string, options: RequestInit = {}) {
  const url = `http://localhost${path.startsWith('/') ? '' : '/'}${path}`;

  // Serialize object bodies to JSON
  let body: BodyInit | undefined = options.body as BodyInit | undefined;
  if (body !== undefined && typeof body !== 'string') {
    body = JSON.stringify(body);
  }

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined),
  };
  if (body !== undefined && headers['Content-Type'] === undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Retry transient failures (e.g., SQLITE_BUSY causing 500 responses)
  const maxAttempts = 6;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Create a fresh Request each attempt (body stream is single-use)
    const req = new Request(url, {
      method: options.method ?? 'GET',
      headers,
      body,
    });

    try {
      const res = await (server as any).fetch(req as any);
      let body = null;
      try {
        body = await res.json();
      } catch {
        body = null;
      }

      // If server returned 5xx, retry after a backoff
      if (res.status >= 500 && attempt < maxAttempts) {
        await sleep(200 * attempt);
        continue;
      }

      return { status: res.status, body, raw: res };
    } catch (err) {
      if (attempt < maxAttempts) {
        await sleep(200 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw new Error('request failed after retries');
}

export async function authRegister(email: string, name: string, password: string) {
  return request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, password }),
  });
}

export async function authLogin(email: string, password: string) {
  return request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
}
