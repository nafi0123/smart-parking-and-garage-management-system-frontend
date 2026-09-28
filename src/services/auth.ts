import apiClient from './apiClient';

export interface IRegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: 'DRIVER' | 'MANAGER';
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IGoogleLoginPayload {
  idToken: string;
}

export interface IVerifyOtpPayload {
  email: string;
  otpCode: string;
}

export interface IAuthResponse<T = unknown> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export const AuthService = {
  // 1. Create User / Register
  createUser: async (payload: IRegisterPayload): Promise<IAuthResponse> => {
    return apiClient.post('/users/create-user', payload);
  },

  // 2. Login User
  login: async (payload: ILoginPayload): Promise<IAuthResponse<{ accessToken: string; user: any }>> => {
    return apiClient.post('/auth/login', payload);
  },

  // 3. Google Login
  googleLogin: async (
    payload: IGoogleLoginPayload,
  ): Promise<IAuthResponse<{ accessToken: string; user: any }>> => {
    return apiClient.post('/auth/google-login', payload);
  },

  // 4. Verify OTP
  verifyOtp: async (
    payload: IVerifyOtpPayload,
  ): Promise<IAuthResponse<{ accessToken: string; user: any }>> => {
    return apiClient.post('/auth/verify-otp', payload);
  },

  // 5. Logout User
  logout: async (): Promise<IAuthResponse> => {
    try {
      return await apiClient.post('/auth/logout');
    } catch (_err) {
      return { statusCode: 200, success: true, message: 'Logged out' };
    }
  },
};
