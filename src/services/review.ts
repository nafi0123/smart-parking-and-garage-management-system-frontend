import apiClient from './apiClient';

export interface ICreateReviewPayload {
  bookingId: string;
  rating: number;
  comment?: string;
}

export interface IUpdateReviewPayload {
  rating?: number;
  comment?: string;
}

export interface IReviewUser {
  id: string;
  name: string;
  picture?: string | null;
}

export interface IReview {
  id: string;
  userId: string;
  garageId: string;
  bookingId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: IReviewUser;
  garage?: {
    id: string;
    name: string;
    address?: string;
    location?: string | null;
  };
}

export interface IReviewResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IReview;
}

export interface IReviewMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
  averageRating: number;
  totalReviews: number;
}

export interface IReviewsListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: IReviewMeta;
  data: IReview[];
}

export const ReviewService = {
  // Submit a review for a COMPLETED booking
  createReview: async (payload: ICreateReviewPayload): Promise<IReviewResponse> => {
    return apiClient.post('/reviews', payload);
  },

  // Get my submitted reviews
  getMyReviews: async (): Promise<IReviewsListResponse> => {
    return apiClient.get('/reviews/my-reviews');
  },

  // Get reviews for a specific garage
  getGarageReviews: async (
    garageId: string,
    query?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ): Promise<IReviewsListResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', String(query.page));
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return apiClient.get(`/reviews/garage/${garageId}${queryString}`);
  },

  // Update an existing review
  updateReview: async (reviewId: string, payload: IUpdateReviewPayload): Promise<IReviewResponse> => {
    return apiClient.patch(`/reviews/${reviewId}`, payload);
  },

  // Delete a review
  deleteReview: async (reviewId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete(`/reviews/${reviewId}`);
  },
};
