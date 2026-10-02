'use client';

import type React from 'react';
import { useEffect, useState } from 'react';
import {
  type ICreateVehiclePayload,
  type IUpdateVehiclePayload,
  type IVehicle,
  VehicleService,
  type VehicleType,
} from '@/services/vehicle';
import Alert from '@/utils/alert';

interface IVehicleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: IVehicle | null;
  onSuccess?: () => void;
}

const VEHICLE_TYPES: { type: VehicleType; label: string; icon: string; desc: string }[] = [
  { type: 'CAR', label: 'Car / Sedan', icon: '🚗', desc: 'Standard compact & sedan cars' },
  { type: 'BIKE', label: 'Motorbike / Scooter', icon: '🏍️', desc: 'Two-wheeler motorcycles' },
  { type: 'SUV', label: 'SUV / Crossover', icon: '🚙', desc: 'Mid-size & full-size SUVs' },
  { type: 'VAN', label: 'Microbus / Van', icon: '🚐', desc: 'Passenger & family vans' },
  { type: 'TRUCK', label: 'Pickup / Truck', icon: '🚚', desc: 'Light pickup & commercial trucks' },
];

export default function VehicleFormModal({
  isOpen,
  onClose,
  vehicle,
  onSuccess,
}: IVehicleFormModalProps) {
  const isEditing = Boolean(vehicle);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('CAR');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setVehicleNumber(vehicle.vehicleNumber || '');
      setVehicleType(vehicle.vehicleType || 'CAR');
      setModel(vehicle.model || '');
      setColor(vehicle.color || '');
      setIsDefault(vehicle.isDefault || false);
    } else {
      setVehicleNumber('');
      setVehicleType('CAR');
      setModel('');
      setColor('');
      setIsDefault(false);
    }
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const plate = vehicleNumber.trim().toUpperCase();
    if (!plate) {
      Alert.error('Vehicle Number Required', 'Please enter a valid vehicle license plate number.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && vehicle) {
        Alert.toast('Updating vehicle details...', 'info');
        const payload: IUpdateVehiclePayload = {
          vehicleNumber: plate,
          vehicleType,
          model: model.trim() || undefined,
          color: color.trim() || undefined,
          isDefault,
        };
        await VehicleService.updateVehicle(vehicle.id, payload);
        Alert.success(
          'Vehicle Updated',
          `Vehicle "${plate}" details have been updated successfully.`,
        );
      } else {
        Alert.toast('Registering new vehicle...', 'info');
        const payload: ICreateVehiclePayload = {
          vehicleNumber: plate,
          vehicleType,
          model: model.trim() || undefined,
          color: color.trim() || undefined,
          isDefault,
        };
        await VehicleService.createVehicle(payload);
        Alert.success('Vehicle Registered', `Vehicle "${plate}" has been saved to your account.`);
      }

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Vehicle save error:', err);
      const msg =
        err?.response?.data?.message || err?.message || 'Could not save vehicle. Please try again.';
      Alert.error('Action Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[var(--card)] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between bg-[var(--bg)]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
              🚗
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)] tracking-tight">
                {isEditing ? 'Edit Registered Vehicle' : 'Add New Vehicle'}
              </h3>
              <p className="text-[11px] text-[var(--sub)]">
                {isEditing
                  ? 'Update license plate, vehicle class, model or default status'
                  : 'Save your car or bike details for fast 1-click spot reservations'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-[var(--bg)] transition-colors cursor-pointer"
            title="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* License Plate Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
              Vehicle License Plate Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={vehicleNumber}
              onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
              placeholder="e.g. DHAKA METRO-GA-11-2233"
              className="w-full px-3.5 py-2.5 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs font-mono font-bold text-[var(--ink)] placeholder:text-[var(--sub)] placeholder:font-sans placeholder:font-normal focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase transition-all shadow-2xs"
            />
            <p className="text-[10px] text-[var(--sub)]">
              Enter official license plate number registered on your motor vehicle documents.
            </p>
          </div>

          {/* Vehicle Type Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[var(--ink)] uppercase tracking-wider">
              Vehicle Classification Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {VEHICLE_TYPES.map((v) => {
                const isSelected = vehicleType === v.type;
                return (
                  <button
                    key={v.type}
                    type="button"
                    onClick={() => setVehicleType(v.type)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-500/10 text-[var(--ink)] shadow-xs ring-1 ring-blue-500/30'
                        : 'border-[var(--line)] bg-[var(--bg)]/60 text-[var(--sub)] hover:border-slate-300 dark:hover:border-slate-700 hover:text-[var(--ink)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{v.icon}</span>
                      <span className="text-xs font-bold text-[var(--ink)]">{v.label}</span>
                    </div>
                    <span className="text-[10px] text-[var(--sub)] mt-1 line-clamp-1">
                      {v.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column: Model & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Vehicle Model */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--ink)]">
                Vehicle Model / Make{' '}
                <span className="text-[var(--sub)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Toyota Premio, Yamaha FZ"
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] placeholder:text-[var(--sub)] focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>

            {/* Vehicle Color */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[var(--ink)]">
                Color <span className="text-[var(--sub)] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="e.g. Pearl White, Black, Silver"
                className="w-full px-3.5 py-2 rounded-lg border border-[var(--line)] bg-[var(--bg)] text-xs text-[var(--ink)] placeholder:text-[var(--sub)] focus:outline-none focus:border-blue-500 transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Default Vehicle Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg)] border border-[var(--line)] cursor-pointer hover:border-blue-500/40 transition-colors">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <span>⭐ Set as Primary / Default Vehicle</span>
                </span>
                <span className="text-[10px] text-[var(--sub)]">
                  This plate number will be auto-selected by default during rapid garage checkout.
                </span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[var(--line)] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-[var(--sub)] hover:text-[var(--ink)] hover:bg-[var(--bg)] transition-colors cursor-pointer border border-[var(--line)]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span>{isEditing ? 'Updating...' : 'Registering...'}</span>
                </>
              ) : (
                <>
                  <span>{isEditing ? 'Save Changes' : 'Register Vehicle'}</span>
                  <span>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
