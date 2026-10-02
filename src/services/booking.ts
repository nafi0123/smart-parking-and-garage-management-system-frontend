import apiClient from './apiClient';

export interface ICreateBookingPayload {
  garageId: string;
  startTime: string;
  endTime: string;
  vehicleNumber?: string;
}

export interface IBookingPayment {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  transactionId: string;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  createdAt?: string;
}

export interface IBookingGarage {
  id: string;
  name: string;
  address: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  pricePerHour: number;
  images?: string[];
  owner?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
  };
}

export interface IBookingUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
}

export interface IBookingReview {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface IBooking {
  id: string;
  userId: string;
  garageId: string;
  startTime: string;
  endTime: string;
  vehicleNumber?: string | null;
  totalPrice: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdAt: string;
  updatedAt: string;
  garage?: IBookingGarage;
  user?: IBookingUser;
  payment?: IBookingPayment | null;
  review?: IBookingReview | null;
  paymentUrl?: string | null;
  transactionId?: string | null;
}

export interface IBookingResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IBooking;
}

export interface IBookingsListResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: IBooking[];
}

export const BookingService = {
  // Create a new booking & get SSLCommerz payment session URL
  createBooking: async (payload: ICreateBookingPayload): Promise<IBookingResponse> => {
    return apiClient.post('/bookings', payload);
  },

  // Get bookings created by logged in user (Driver)
  getMyBookings: async (): Promise<IBookingsListResponse> => {
    return apiClient.get('/bookings/my-bookings');
  },

  // Get bookings for garages owned by manager (Manager / Admin)
  getManagerBookings: async (): Promise<IBookingsListResponse> => {
    return apiClient.get('/bookings/manager-bookings');
  },

  // Update booking status (Manager / Admin)
  updateBookingStatus: async (
    bookingId: string,
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'PENDING',
  ): Promise<IBookingResponse> => {
    return apiClient.patch(`/bookings/${bookingId}/status`, { status });
  },

  // Get single booking details
  getSingleBooking: async (bookingId: string): Promise<IBookingResponse> => {
    return apiClient.get(`/bookings/${bookingId}`);
  },

  // Cancel a booking
  cancelBooking: async (bookingId: string): Promise<IBookingResponse> => {
    return apiClient.patch(`/bookings/${bookingId}/cancel`);
  },
};
