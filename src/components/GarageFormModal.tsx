'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useState } from 'react';
import { type ICreateGaragePayload, type IGarage, GarageService } from '@/services/garage';
import Alert from '@/utils/alert';

interface IGarageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: IGarage | null;
  onSuccess?: () => void;
}

export default function GarageFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: IGarageFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!initialData?.id;

  const [formData, setFormData] = useState<ICreateGaragePayload>({
    name: '',
    address: '',
    location: '',
    totalSlots: 10,
    availableSlots: 10,
    pricePerHour: 50,
    description: '',
    images: [],
    latitude: undefined,
    longitude: undefined,
  });

  const [imageUrlsText, setImageUrlsText] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        address: initialData.address || '',
        location: initialData.location || '',
        totalSlots: initialData.totalSlots || 10,
        availableSlots: initialData.availableSlots ?? initialData.totalSlots ?? 10,
        pricePerHour: initialData.pricePerHour ?? 50,
        description: initialData.description || '',
        images: initialData.images || [],
        latitude: initialData.latitude ?? undefined,
        longitude: initialData.longitude ?? undefined,
      });
      setImageUrlsText(initialData.images?.join(', ') || '');
    } else {
      setFormData({
        name: '',
        address: '',
        location: '',
        totalSlots: 10,
        availableSlots: 10,
        pricePerHour: 50,
        description: '',
        images: [],
        latitude: undefined,
        longitude: undefined,
      });
      setImageUrlsText('');
    }
  }, [initialData, isOpen]);

  // Handle Geolocation
  function handleDetectLocation() {
    if (!navigator.geolocation) {
      Alert.error('Not Supported', 'Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setIsLocating(false);
        Alert.toast('Coordinates acquired from GPS!', 'success');
      },
      (err) => {
        setIsLocating(false);
        Alert.error('Location Error', err.message || 'Unable to retrieve location.');
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (payload: ICreateGaragePayload) => GarageService.createGarage(payload),
    onSuccess: (res) => {
      if (res.success) {
        Alert.toast(res.message || 'Garage created successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: ['garages'] });
        onSuccess?.();
        onClose();
      } else {
        Alert.error('Creation Failed', res.message || 'Could not create garage.');
      }
    },
    onError: (err: any) => {
      Alert.error('Error', err?.message || 'An error occurred while creating the garage.');
    },
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (payload: ICreateGaragePayload) =>
      GarageService.updateGarage(initialData!.id, payload),
    onSuccess: (res) => {
      if (res.success) {
        Alert.toast(res.message || 'Garage updated successfully!', 'success');
        queryClient.invalidateQueries({ queryKey: ['garages'] });
        onSuccess?.();
        onClose();
      } else {
        Alert.error('Update Failed', res.message || 'Could not update garage.');
      }
    },
    onError: (err: any) => {
      Alert.error('Error', err?.message || 'An error occurred while updating the garage.');
    },
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      Alert.error('Validation Error', 'Garage name is required.');
      return;
    }
    if (!formData.address.trim()) {
      Alert.error('Validation Error', 'Address is required.');
      return;
    }

    const imagesArray = imageUrlsText
      .split(',')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    const payload: ICreateGaragePayload = {
      ...formData,
      totalSlots: Number(formData.totalSlots) || 1,
      availableSlots:
        formData.availableSlots !== undefined ? Number(formData.availableSlots) : Number(formData.totalSlots) || 1,
      pricePerHour: Number(formData.pricePerHour) || 0,
      images: imagesArray,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-[var(--card)] text-[var(--ink)] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200/80 dark:border-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/90 dark:border-slate-800 bg-[var(--bg)]/40">
          <div>
            <h3 className="text-base font-bold text-[var(--ink)]">
              {isEditing ? 'Edit Garage Information' : 'Register New Parking Garage'}
            </h3>
            <p className="text-xs text-[var(--sub)] mt-0.5">
              {isEditing
                ? 'Update slots, hourly rates, coordinates and details'
                : 'Add a new parking garage facility to Central Parking Network'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-[var(--sub)] hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Row 1: Name & Location (Area) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">
                Garage Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Central Plaza Secure Parking"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">Area / Location Name</label>
              <input
                type="text"
                placeholder="e.g. Dhanmondi 27, Dhaka"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 2: Full Address */}
          <div>
            <label className="block font-semibold text-[var(--ink)] mb-1">
              Full Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. House #14, Road #27, Dhanmondi R/A, Dhaka 1209"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
            />
          </div>

          {/* Row 3: Total Slots, Available Slots & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">
                Total Capacity (Slots) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                required
                value={formData.totalSlots}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    totalSlots: Number(e.target.value),
                    // Auto-adjust available slots if not editing
                    availableSlots: !isEditing ? Number(e.target.value) : formData.availableSlots,
                  })
                }
                className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">Available Slots</label>
              <input
                type="number"
                min={0}
                max={formData.totalSlots}
                value={formData.availableSlots}
                onChange={(e) => setFormData({ ...formData, availableSlots: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-[var(--ink)] mb-1">Price Per Hour (৳ / $)</label>
              <input
                type="number"
                min={0}
                step={5}
                value={formData.pricePerHour}
                onChange={(e) => setFormData({ ...formData, pricePerHour: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
              />
            </div>
          </div>

          {/* Row 4: Geo-Coordinates (Latitude & Longitude) */}
          <div className="p-3 bg-[var(--bg)]/60 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[var(--ink)] text-xs flex items-center gap-1.5">
                <span>📍</span> GPS Coordinates (for Nearby Radar Search)
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--card)] hover:bg-[var(--bg)] text-[11px] font-semibold text-[var(--navy-2)] dark:text-blue-400 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                {isLocating ? 'Locating...' : '⚡ Use My GPS'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--sub)] mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 23.7523"
                  value={formData.latitude ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-md bg-[var(--card)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--sub)] mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 90.3789"
                  value={formData.longitude ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: e.target.value === '' ? undefined : Number(e.target.value),
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-md bg-[var(--card)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Images URLs */}
          <div>
            <label className="block font-semibold text-[var(--ink)] mb-1">
              Image URLs <span className="text-[var(--sub)] font-normal">(Comma separated URLs)</span>
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/photo-1506521781263-d8422e82f27a, https://..."
              value={imageUrlsText}
              onChange={(e) => setImageUrlsText(e.target.value)}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium"
            />
          </div>

          {/* Row 6: Description */}
          <div>
            <label className="block font-semibold text-[var(--ink)] mb-1">Description & Amenities</label>
            <textarea
              rows={3}
              placeholder="Covered underground parking, 24/7 CCTV surveillance, EV charging points available..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-[var(--bg)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none focus:ring-2 focus:ring-[var(--navy-2)]/20 transition-all font-medium resize-none"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 rounded-md bg-[var(--bg)] hover:bg-[var(--bg)]/80 text-[var(--ink)] font-semibold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2 rounded-md bg-gradient-to-r from-[#0f2a6b] to-[#1e40af] hover:from-[#0b1f50] hover:to-[#1e3a8a] text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isPending ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                'Update Garage'
              ) : (
                'Create Garage'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
