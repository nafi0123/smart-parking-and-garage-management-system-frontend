'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { GarageService, type ICreateGaragePayload, type IGarage } from '@/services/garage';
import Alert from '@/utils/alert';

interface IGarageFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: IGarage | null;
  onSuccess?: () => void;
}

interface IFilePreview {
  file: File;
  url: string;
}

const MAX_IMAGES = 5;
const MAX_FILE_SIZE_MB = 5;

export default function GarageFormModal({
  isOpen,
  onClose,
  initialData,
  onSuccess,
}: IGarageFormModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Image management state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<IFilePreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');
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
      setExistingImages(initialData.images || []);
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
      setExistingImages([]);
    }
    setSelectedFiles([]);
    setShowUrlInput(false);
    setCustomUrlInput('');
  }, [initialData, isOpen]);

  // Clean up object URLs on unmount/close
  useEffect(() => {
    return () => {
      selectedFiles.forEach((f) => URL.revokeObjectURL(f.url));
    };
  }, [selectedFiles]);

  // File selection handler
  function handleFilesSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    const currentTotal = existingImages.length + selectedFiles.length;
    const availableSlots = MAX_IMAGES - currentTotal;

    if (availableSlots <= 0) {
      Alert.error('Limit Reached', `You can only upload up to ${MAX_IMAGES} images per facility.`);
      return;
    }

    const newPreviews: IFilePreview[] = [];
    const filesArray = Array.from(files).slice(0, availableSlots);

    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) {
        Alert.error('Invalid File Type', `${file.name} is not an image file.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        Alert.error(
          'File Too Large',
          `${file.name} exceeds the ${MAX_FILE_SIZE_MB}MB size limit.`,
        );
        continue;
      }

      newPreviews.push({
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (newPreviews.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newPreviews]);
    }
  }

  function handleRemoveNewFile(index: number) {
    setSelectedFiles((prev) => {
      const removed = prev[index];
      if (removed) URL.revokeObjectURL(removed.url);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleRemoveExistingImage(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddCustomUrl() {
    const trimmed = customUrlInput.trim();
    if (!trimmed) return;

    const currentTotal = existingImages.length + selectedFiles.length;
    if (currentTotal >= MAX_IMAGES) {
      Alert.error('Limit Reached', `You can only upload up to ${MAX_IMAGES} images per facility.`);
      return;
    }

    setExistingImages((prev) => [...prev, trimmed]);
    setCustomUrlInput('');
  }

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
    mutationFn: (payload: ICreateGaragePayload | FormData) => GarageService.createGarage(payload),
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
    mutationFn: (payload: ICreateGaragePayload | FormData) =>
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

    const jsonPayload: ICreateGaragePayload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      location: formData.location?.trim() || undefined,
      totalSlots: Number(formData.totalSlots) || 1,
      availableSlots:
        formData.availableSlots !== undefined
          ? Number(formData.availableSlots)
          : Number(formData.totalSlots) || 1,
      pricePerHour: Number(formData.pricePerHour) || 0,
      description: formData.description?.trim() || undefined,
      images: existingImages,
      latitude: formData.latitude ? Number(formData.latitude) : undefined,
      longitude: formData.longitude ? Number(formData.longitude) : undefined,
    };

    // If new files are selected, send FormData to upload to Cloud
    if (selectedFiles.length > 0) {
      const data = new FormData();
      for (const item of selectedFiles) {
        data.append('images', item.file);
      }
      data.append('data', JSON.stringify(jsonPayload));

      if (isEditing) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    } else {
      // Direct JSON submission
      if (isEditing) {
        updateMutation.mutate(jsonPayload);
      } else {
        createMutation.mutate(jsonPayload);
      }
    }
  }

  if (!isOpen) return null;

  const totalImageCount = existingImages.length + selectedFiles.length;

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
                ? 'Update facility slots, rates, GPS coordinates, and photos'
                : 'Add a new parking garage with cloud photo uploads to Central Network'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-[var(--sub)] hover:text-[var(--ink)] p-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
                <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>GPS Coordinates (for Nearby Radar Search)</span>
              </span>
              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={isLocating}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[var(--card)] hover:bg-[var(--bg)] text-[11px] font-semibold text-[var(--navy-2)] dark:text-blue-400 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <svg className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
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

          {/* Row 5: Garage Photos Upload Section (Cloud Upload) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-[var(--ink)]">
                Garage Photos{' '}
                <span className="text-[var(--sub)] font-normal text-[11px]">
                  ({totalImageCount}/{MAX_IMAGES} uploaded)
                </span>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput((prev) => !prev)}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {showUrlInput ? 'Hide URL input' : '+ Add via URL'}
              </button>
            </div>

            {/* Optional URL Adder */}
            {showUrlInput && (
              <div className="flex items-center gap-2 p-2 bg-[var(--bg)]/70 rounded-lg animate-in fade-in duration-150">
                <input
                  type="url"
                  placeholder="Paste direct image URL (https://...)"
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 rounded bg-[var(--card)] border-0 text-[var(--ink)] placeholder-[var(--sub)] outline-none text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddCustomUrl}
                  disabled={!customUrlInput.trim() || totalImageCount >= MAX_IMAGES}
                  className="px-3 py-1.5 rounded bg-[var(--navy-2)] hover:bg-[var(--navy)] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
                >
                  Add URL
                </button>
              </div>
            )}

            {/* File Dropzone */}
            {totalImageCount < MAX_IMAGES && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFilesSelected(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                role="button"
                tabIndex={0}
                className={`w-full p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 cursor-pointer ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/10 dark:bg-blue-950/20'
                    : 'border-slate-300 dark:border-slate-700 bg-[var(--bg)]/40 hover:bg-[var(--bg)] hover:border-blue-400/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    handleFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="font-bold text-[var(--ink)] text-xs">
                    Click to upload or drag & drop photos
                  </p>
                  <p className="text-[11px] text-[var(--sub)] mt-0.5">
                    JPEG, PNG, WebP • Up to {MAX_IMAGES} photos (max {MAX_FILE_SIZE_MB}MB each)
                  </p>
                </div>
              </div>
            )}

            {/* Photos Preview Grid */}
            {totalImageCount > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {/* Existing Images */}
                {existingImages.map((url, idx) => (
                  <div
                    key={url}
                    className="relative group rounded-lg overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-[var(--bg)] aspect-video"
                  >
                    <img
                      src={url}
                      alt={`Facility preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[9px] font-bold text-white uppercase">
                      Cloud
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}

                {/* Newly Selected Files */}
                {selectedFiles.map((item, idx) => (
                  <div
                    key={item.url}
                    className="relative group rounded-lg overflow-hidden border border-blue-500/50 bg-blue-500/5 aspect-video"
                  >
                    <img
                      src={item.url}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-white uppercase shadow-xs">
                      New
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 px-1 py-0.5 rounded bg-black/60 text-[9px] text-white truncate text-center">
                      {(item.file.size / (1024 * 1024)).toFixed(1)}MB
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewFile(idx)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center text-xs shadow-md transition-all cursor-pointer opacity-90 hover:opacity-100"
                      title="Remove photo"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
          <div className="pt-3 border-t border-slate-200/90 dark:border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-[var(--sub)]">
              {selectedFiles.length > 0 && (
                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  {selectedFiles.length} new photo(s) ready to upload to cloud
                </span>
              )}
            </div>

            <div className="flex items-center gap-2.5">
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
                    <span>{selectedFiles.length > 0 ? 'Uploading to Cloud...' : 'Saving...'}</span>
                  </>
                ) : isEditing ? (
                  'Update Garage'
                ) : (
                  'Create Garage'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}


