
const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type ApiError = {
  message?: string | string[];
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = data as ApiError | null;
    const message = Array.isArray(error?.message)
      ? error.message.join(', ')
      : error?.message;

    throw new Error(message || `Request failed (${response.status})`);
  }

  return data as T;
}

export type AuthResponse = {
  accessToken: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    role?: string;
  };
};

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  return request('/users/register', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export function loginUser(input: {
  email: string;
  password: string;
}) {
  return request<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type CreateListingInput = {
  title: string;
  description: string;
  type: 'need_repair' | 'available' | 'looking_for_parts';
  category: string;
  location?: string;
  wantedItem?: string;
};

export type Listing = {
  _id: string;
  title: string;
  description: string;
  type: 'need_repair' | 'available' | 'looking_for_parts';
  category: string;
  location?: string;
  wantedItem?: string;
  status: 'open' | 'reserved' | 'closed';
  createdAt?: string;
  owner?: { name?: string } | string;
};

export function createListing(
  input: CreateListingInput,
  token: string,
) {
  return request<Listing>('/listings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export function getListingById(id: string, token: string) {
  return request<Listing>(`/listings/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

