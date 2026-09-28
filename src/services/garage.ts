import apiClient from './apiClient';

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
    return apiClient.get('/garages', { params });
  },

  // Get garages owned by currently logged-in user (Manager / Admin)
  getMyGarages: async (): Promise<IGaragesResponse> => {
    return apiClient.get('/garages/my-garages');
  },

  // Get nearby garages within radius
  getNearbyGarages: async (params: INearbyGaragesParams): Promise<IGaragesResponse> => {
    return apiClient.get('/garages/nearby', { params });
  },

  // Get single garage details by ID
  getSingleGarage: async (id: string): Promise<ISingleGarageResponse> => {
    return apiClient.get(`/garages/${id}`);
  },

  // Create a garage (Manager / Admin)
  createGarage: async (payload: ICreateGaragePayload | FormData): Promise<ISingleGarageResponse> => {
    const isFormData = payload instanceof FormData;
    return apiClient.post('/garages', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  // Update a garage (Manager / Admin)
  updateGarage: async (
    id: string,
    payload: IUpdateGaragePayload | FormData,
  ): Promise<ISingleGarageResponse> => {
    const isFormData = payload instanceof FormData;
    return apiClient.patch(`/garages/${id}`, payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
  },

  // Delete a garage (Manager / Admin)
  deleteGarage: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/garages/${id}`);
  },
};
