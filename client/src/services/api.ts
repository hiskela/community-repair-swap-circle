
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
  status: 'open' | 'hidden'| 'reserved' | 'closed';
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

export type ListingsResponse = {
  data: Listing[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

export function getPublicListings(params?: {
  keyword?: string;
  type?: string;
  category?: string;
  location?: string;
  page?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  if (params?.keyword) query.set('keyword', params.keyword);
  if (params?.type) query.set('type', params.type);
  if (params?.category) query.set('category', params.category);
  if (params?.location) query.set('location', params.location);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  const qs = query.toString();
  return request<ListingsResponse>(`/listings${qs ? `?${qs}` : ''}`);
}

export function getListingById(id: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return request<Listing>(`/listings/${id}`, { headers });
}

export function getMyListings(token: string) {
  return request<Listing[]>('/listings/my', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateListing(
  id: string,
  input: Partial<CreateListingInput>,
  token: string,
) {
  return request<Listing>(`/listings/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}

export function deleteListing(id: string, token: string) {
  return request<{ message: string }>(`/listings/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
export function setListingVisibility(
  id: string,
  hidden: boolean,
  token: string,
) {
  return request<Listing>(`/listings/${id}/visibility`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ hidden }),
  });
}
export function createOffer(
  input: {
    listingId: string;
    message: string;
  },
  token: string,
) {
  return request('/offers', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(input),
  });
}


export type Offer = {
  _id: string;
  listing?: {
    _id: string;
    title: string;
    type?: string;
    category?: string;
    location?: string;
    status?: string;
  } | string;
  listingId?: {
    _id: string;
    title: string;
    type?: string;
    category?: string;
  } | string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  createdAt?: string;
  sender?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  receiver?: {
    _id?: string;
    name?: string;
    email?: string;
  };
};

export function getSentOffers(token: string) {
  return request<Offer[]>('/offers/sent', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getReceivedOffers(token: string) {
  return request<Offer[]>('/offers/received', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function acceptOffer(offerId: string, token: string) {
  return request<Offer>(`/offers/${offerId}/accept`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function rejectOffer(offerId: string, token: string) {
  return request<Offer>(`/offers/${offerId}/reject`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export type TransactionStatus =
  | 'agreed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'disputed';
export type CancellationRequest = {
  reason: string;
  requestedBy: string | { _id: string };
  status: 'pending' | 'accepted' | 'rejected';
  respondedBy?: string | { _id: string };
  respondedAt?: string;
};
export type Transaction = {
  _id: string;
  status: TransactionStatus;
  listing: {
    _id: string;
    title: string;
    type?: string;
    category?: string;
    location?: string;
    status?: string;
  };
  requester: {
    _id: string;
    name?: string;
    email?: string;
  };
  provider: {
    _id: string;
    name?: string;
    email?: string;
  };
  requesterConfirmedCompletion?: boolean;
  providerConfirmedCompletion?: boolean;
  disputeReason?: string;
  resolutionNotes?: string;
cancellationRequest?: CancellationRequest | null;
  createdAt?: string;
};

export function getMyTransactions(token: string) {
  return request<Transaction[]>('/transactions/my', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
export function getTransactionById(id: string, token: string) {
  return request<{
    _id: string;
    status: string;
    listing?: {
      title?: string;
      type?: string;
      category?: string;
    } | string;
    requester?: {
      _id?: string;
      name?: string;
    } | string;
    provider?: {
      _id?: string;
      name?: string;
    } | string;
    disputeReason?: string;
    resolutionNotes?: string;
    requesterConfirmedCompletion?: boolean;
    providerConfirmedCompletion?: boolean;
    cancellationRequest?: {
      reason?: string;
      status?: string;
    } | null;
    history?: {
      status: string;
      note: string;
      changedAt?: string;
      changedBy?: {
        name?: string;
      } | string;
    }[];
  }>(`/transactions/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
export function updateTransactionStatus(
  transactionId: string,
  status: 'in_progress' | 'cancelled',
  token: string,
) {
  return request<Transaction>(
    `/transactions/${transactionId}/status`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );
}

export function confirmTransactionCompletion(
  transactionId: string,
  token: string,
) {
  return request<Transaction>(
    `/transactions/${transactionId}/confirm-completion`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
export function createTransactionDispute(
  transactionId: string,
  reason: string,
  token: string,
) {
  return request<Transaction>(
    `/transactions/${transactionId}/dispute`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    },
  );
}
export function requestTransactionCancellation(
  transactionId: string,
  reason: string,
  token: string,
) {
  return request<Transaction>(
    `/transactions/${transactionId}/cancellation-request`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    },
  );
}

export function respondToCancellationRequest(
  transactionId: string,
  status: 'accepted' | 'rejected',
  token: string,
) {
  return request<Transaction>(
    `/transactions/${transactionId}/cancellation-request/respond`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    },
  );
}

export type NotificationType =
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_rejected'
  | 'transaction_updated'
  | 'dispute_opened'
  | 'dispute_resolved';

export type AppNotification = {
  _id: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  actor?: string | { _id: string; name?: string };
  relatedId?: string;
  relatedType?: string;
  createdAt?: string;
};

export function getNotifications(token: string) {
  return request<AppNotification[]>('/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function markNotificationAsRead(
  notificationId: string,
  token: string,
) {
  return request<AppNotification>(
    `/notifications/${notificationId}/read`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}

export function markAllNotificationsAsRead(token: string) {
  return request<{ message: string; modifiedCount: number }>(
    '/notifications/read-all',
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

}
export function deleteNotification(
  notificationId: string,
  token: string,
) {
  return request<{ message: string; id: string }>(
    `/notifications/${notificationId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );
}
export function getOfferById(id: string, token: string) {
  return request<Offer>(`/offers/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}