export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000/api/v1';

export interface IGarageOwner {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
}

export interface IGarage {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  totalSlots: number;
  availableSlots: number;
  pricePerHour: number;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  images: string[];
  averageRating: number;
  totalReviews: number;
  ownerId: string;
  owner?: IGarageOwner;
  createdAt: string;
  updatedAt: string;
  distanceKm?: number;
}

export interface IGarageMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IGetAllGaragesParams {
  searchTerm?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean | string;
  minRating?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface INearbyGaragesParams {
  latitude: number;
  longitude: number;
  radius?: number;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean | string;
  minRating?: number;
  limit?: number;
}

export interface ICreateGaragePayload {
  name: string;
  address: string;
  description?: string;
  totalSlots: number;
  availableSlots?: number;
  pricePerHour?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface IUpdateGaragePayload {
  name?: string;
  address?: string;
  description?: string;
  totalSlots?: number;
  availableSlots?: number;
  pricePerHour?: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  images?: string[];
}

export interface IGaragesResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: IGarageMeta;
  data?: IGarage[];
}

export interface ISingleGarageResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data?: IGarage;
}

export const GarageService = {
  // Get all garages (Public / Search with filters & pagination)
  getAllGarages: async (params: IGetAllGaragesParams = {}): Promise<IGaragesResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const query = new URLSearchParams();

    if (params.searchTerm && params.searchTerm.trim() !== '') {
      query.append('searchTerm', params.searchTerm.trim());
    }
    if (params.minPrice !== undefined) {
      query.append('minPrice', params.minPrice.toString());
    }
    if (params.maxPrice !== undefined) {
      query.append('maxPrice', params.maxPrice.toString());
    }
    if (params.onlyAvailable !== undefined) {
      query.append('onlyAvailable', params.onlyAvailable.toString());
    }
    if (params.minRating !== undefined) {
      query.append('minRating', params.minRating.toString());
    }
    if (params.page) {
      query.append('page', params.page.toString());
    }
    if (params.limit) {
      query.append('limit', params.limit.toString());
    }
    if (params.sortBy) {
      query.append('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      query.append('sortOrder', params.sortOrder);
    }

    const res = await fetch(`${API_BASE_URL}/garages?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },

  // Get garages owned by currently logged-in user (Manager / Admin)
  getMyGarages: async (): Promise<IGaragesResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(`${API_BASE_URL}/garages/my-garages`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },

  // Get nearby garages within radius
  getNearbyGarages: async (params: INearbyGaragesParams): Promise<IGaragesResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const query = new URLSearchParams({
      latitude: params.latitude.toString(),
      longitude: params.longitude.toString(),
    });

    if (params.radius) query.append('radius', params.radius.toString());
    if (params.minPrice !== undefined) query.append('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) query.append('maxPrice', params.maxPrice.toString());
    if (params.onlyAvailable !== undefined) query.append('onlyAvailable', params.onlyAvailable.toString());
    if (params.minRating !== undefined) query.append('minRating', params.minRating.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/garages/nearby?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },

  // Get single garage details by ID
  getSingleGarage: async (id: string): Promise<ISingleGarageResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(`${API_BASE_URL}/garages/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },

  // Create a garage (Manager / Admin)
  createGarage: async (payload: ICreateGaragePayload | FormData): Promise<ISingleGarageResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const isFormData = payload instanceof FormData;

    const res = await fetch(`${API_BASE_URL}/garages`, {
      method: 'POST',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isFormData ? payload : JSON.stringify(payload),
      credentials: 'include',
    });
    return res.json();
  },

  // Update a garage (Manager / Admin)
  updateGarage: async (id: string, payload: IUpdateGaragePayload | FormData): Promise<ISingleGarageResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const isFormData = payload instanceof FormData;

    const res = await fetch(`${API_BASE_URL}/garages/${id}`, {
      method: 'PATCH',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isFormData ? payload : JSON.stringify(payload),
      credentials: 'include',
    });
    return res.json();
  },

  // Delete a garage (Manager / Admin)
  deleteGarage: async (id: string): Promise<{ success: boolean; message: string }> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(`${API_BASE_URL}/garages/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },
};
