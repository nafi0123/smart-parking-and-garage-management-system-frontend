import apiClient from './apiClient';

export interface IInitiatePaymentResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: {
    bookingId: string;
    transactionId: string;
    amount: number;
    paymentUrl: string;
  };
}

export interface IMyPaymentsResponse {
  statusCode: number;
  success: boolean;
  message: string;
  data: Array<{
    id: string;
    bookingId: string;
    userId: string;
    amount: number;
    transactionId: string;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    createdAt: string;
    booking?: {
      id: string;
      startTime: string;
      endTime: string;
      vehicleNumber?: string | null;
      status: string;
      garage?: {
        id: string;
        name: string;
        address: string;
        location?: string | null;
      };
    };
  }>;
}

export const PaymentService = {
  // Re-initiate payment for an existing unpaid booking
  initiatePayment: async (bookingId: string): Promise<IInitiatePaymentResponse> => {
    return apiClient.post(`/payments/initiate/${bookingId}`);
  },

  // Get all payments for current user
  getMyPayments: async (): Promise<IMyPaymentsResponse> => {
    return apiClient.get('/payments/my-payments');
  },

  // Cancel confirmed booking and process refund
  refundPayment: async (
    bookingId: string,
    reason?: string,
  ): Promise<{ statusCode: number; success: boolean; message: string; data: any }> => {
    return apiClient.post(`/payments/refund/${bookingId}`, { reason });
  },
};
