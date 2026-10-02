import apiClient from './apiClient';
import type { IGarage } from './garage';

export interface IFavoriteGarageItem extends IGarage {
  favoriteId: string;
  favoritedAt: string;
}

export interface IToggleFavoriteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    isFavorited: boolean;
    message: string;
    garageId: string;
  };
}

export interface IGetFavoritesResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IFavoriteGarageItem[];
}

export interface ICheckFavoriteResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    garageId: string;
    isFavorited: boolean;
  };
}

export const FavoriteService = {
  // Toggle favorite garage (add/remove) - POST /api/v1/favorites/:garageId
  toggleFavorite: async (garageId: string): Promise<IToggleFavoriteResponse> => {
    return apiClient.post(`/favorites/${garageId}`);
  },

  // Get current user's favorite garages - GET /api/v1/favorites/my-favorites
  getMyFavorites: async (): Promise<IGetFavoritesResponse> => {
    return apiClient.get('/favorites/my-favorites');
  },

  // Check if a specific garage is favorited - GET /api/v1/favorites/check/:garageId
  checkIsFavorite: async (garageId: string): Promise<ICheckFavoriteResponse> => {
    return apiClient.get(`/favorites/check/${garageId}`);
  },
};

export default FavoriteService;
