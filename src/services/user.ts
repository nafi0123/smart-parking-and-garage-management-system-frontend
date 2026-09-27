export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000/api/v1';

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
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const query = new URLSearchParams();

    if (params.searchTerm && params.searchTerm.trim() !== '') {
      query.append('searchTerm', params.searchTerm.trim());
    }
    if (params.role && params.role !== 'ALL') {
      query.append('role', params.role);
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

    const res = await fetch(`${API_BASE_URL}/users?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },

  blockUser: async (userId: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const res = await fetch(`${API_BASE_URL}/users/block/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });
    return res.json();
  },
};
