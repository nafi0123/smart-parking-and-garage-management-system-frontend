export const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_API || 'http://localhost:5000/api/v1';

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
  createUser: async (payload: IRegisterPayload) => {
    const res = await fetch(`${API_BASE_URL}/users/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // 2. Login User
  login: async (payload: ILoginPayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // 3. Google Login
  googleLogin: async (payload: IGoogleLoginPayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/google-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // 4. Verify OTP
  verifyOtp: async (payload: IVerifyOtpPayload) => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
};
