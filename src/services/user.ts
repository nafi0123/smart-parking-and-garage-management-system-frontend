import apiClient from './apiClient';

export interface IUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'DRIVER' | 'MANAGER' | 'ADMIN';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUserMeta {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
}

export interface IGetAllUsersParams {
  searchTerm?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IGetAllUsersResponse {
  statusCode: number;
  success: boolean;
  message: string;
  meta?: IUserMeta;
  data?: IUser[];
}

export const UserService = {
  getAllUsers: async (params: IGetAllUsersParams = {}): Promise<IGetAllUsersResponse> => {
    const formattedParams: Record<string, any> = {};
    if (params.searchTerm && params.searchTerm.trim() !== '') {
      formattedParams.searchTerm = params.searchTerm.trim();
    }
    if (params.role && params.role !== 'ALL') {
      formattedParams.role = params.role;
    }
    if (params.page) formattedParams.page = params.page;
    if (params.limit) formattedParams.limit = params.limit;
    if (params.sortBy) formattedParams.sortBy = params.sortBy;
    if (params.sortOrder) formattedParams.sortOrder = params.sortOrder;

    return apiClient.get('/users', { params: formattedParams });
  },

  blockUser: async (userId: string): Promise<{ statusCode: number; success: boolean; message: string; data?: any }> => {
    return apiClient.patch(`/users/block/${userId}`);
  },
};
