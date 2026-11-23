// Every backend call goes through here: adds the login token and turns errors into exceptions.
export async function api(path, { method = 'GET', body } = {}) {
  const token = localStorage.getItem('token');
  const res = await fetch(`/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// Uploads an image file (provider only) and returns its URL.
export async function uploadImage(file) {
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': file.type, Authorization: `Bearer ${localStorage.getItem('token')}` },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`);
  return data.url;
}
