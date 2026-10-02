import apiClient from './apiClient';

export type VehicleType = 'CAR' | 'BIKE' | 'SUV' | 'TRUCK' | 'VAN';

export interface IVehicle {
  id: string;
  userId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  model?: string | null;
  color?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateVehiclePayload {
  vehicleNumber: string;
  vehicleType?: VehicleType;
  model?: string;
  color?: string;
  isDefault?: boolean;
}

export interface IUpdateVehiclePayload {
  vehicleNumber?: string;
  vehicleType?: VehicleType;
  model?: string;
  color?: string;
  isDefault?: boolean;
}

export interface IVehicleResponse<T> {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
}

export const VehicleService = {
  // Add new vehicle - POST /api/v1/vehicles
  createVehicle: async (payload: ICreateVehiclePayload): Promise<IVehicleResponse<IVehicle>> => {
    return apiClient.post('/vehicles', payload);
  },

  // Get my saved vehicles - GET /api/v1/vehicles/my-vehicles
  getMyVehicles: async (): Promise<IVehicleResponse<IVehicle[]>> => {
    return apiClient.get('/vehicles/my-vehicles');
  },

  // Get single vehicle - GET /api/v1/vehicles/:id
  getSingleVehicle: async (id: string): Promise<IVehicleResponse<IVehicle>> => {
    return apiClient.get(`/vehicles/${id}`);
  },

  // Update vehicle - PATCH /api/v1/vehicles/:id
  updateVehicle: async (
    id: string,
    payload: IUpdateVehiclePayload,
  ): Promise<IVehicleResponse<IVehicle>> => {
    return apiClient.patch(`/vehicles/${id}`, payload);
  },

  // Delete vehicle - DELETE /api/v1/vehicles/:id
  deleteVehicle: async (id: string): Promise<IVehicleResponse<null>> => {
    return apiClient.delete(`/vehicles/${id}`);
  },
};

export default VehicleService;
