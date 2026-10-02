import apiClient from './apiClient';

export interface IManagerAnalyticsSummary {
  totalGarages: number;
  totalSlots: number;
  occupiedSlots: number;
  occupancyRate: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalBookings: number;
}

export interface IManagerAnalytics {
  summary: IManagerAnalyticsSummary;
  bookingStatusBreakdown: {
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    PENDING: number;
  };
  revenueChart: { date: string; revenue: number; bookingsCount: number }[];
  topGarages: {
    id: string;
    name: string;
    totalSlots: number;
    availableSlots: number;
    pricePerHour: number;
    averageRating: number;
    totalReviews: number;
    totalRevenue: number;
    totalBookings: number;
  }[];
}

export interface IAdminAnalyticsSummary {
  totalUsers: number;
  totalGarages: number;
  totalBookings: number;
  totalPlatformRevenue: number;
  totalRefundedAmount: number;
  netRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
}

export interface IAdminAnalytics {
  summary: IAdminAnalyticsSummary;
  userStats: {
    totalUsers: number;
    drivers: number;
    managers: number;
    admins: number;
    newUsersThisMonth: number;
  };
  bookingStats: {
    totalBookings: number;
    CONFIRMED: number;
    COMPLETED: number;
    CANCELLED: number;
    PENDING: number;
  };
  yearlyChart: {
    month: string;
    revenue: number;
    bookings: number;
    newUsers: number;
  }[];
  recentTransactions: {
    id: string;
    amount: number;
    status: string;
    refundAmount?: number | null;
    createdAt: string;
    user?: { id: string; name: string; email: string };
    booking?: {
      id: string;
      vehicleNumber?: string | null;
      garage?: { id: string; name: string };
    };
  }[];
}

export const AnalyticsService = {
  getManagerAnalytics: async (): Promise<{ success: boolean; data: IManagerAnalytics }> => {
    return apiClient.get('/analytics/manager');
  },

  getAdminAnalytics: async (): Promise<{ success: boolean; data: IAdminAnalytics }> => {
    return apiClient.get('/analytics/admin');
  },
};
