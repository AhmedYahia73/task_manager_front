import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Briefcase,
  Building2,
  MapPin,
  Clock,
  Sparkles,
  Award,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { setAuthToken, getCurrentUser } from '@/utils/auth';
import { toast } from 'sonner';

export const Profile = () => {
  const { data: profileResponse, loading: fetchingProfile, refresh } = useGet('/api/profile');
  const { mutate, loading: saving } = useMutation();

  const fileInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    whatsapp: '',
    password: '',
    confirmPassword: '',
  });

  // Image handling state
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // User meta information
  const [accountInfo, setAccountInfo] = useState({
    role: '',
    status: 'active',
    points: 0,
    job_name: '',
    department_name: '',
    zone_name: '',
    shift_name: '',
  });

  // Populate data when fetched
  useEffect(() => {
    const profile = profileResponse?.profile || profileResponse?.data || profileResponse;
    if (profile) {
      setFormData((prev) => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        password: '',
        confirmPassword: '',
      }));

      setImagePreview(profile.image || null);
      setSelectedImageFile(null);
      setRemoveExistingImage(false);

      setAccountInfo({
        role: profile.role || '',
        status: profile.status || 'active',
        points: profile.points || 0,
        job_name: profile.job?.name || profile.job_name || '',
        department_name: profile.department?.name || profile.department_name || '',
        zone_name: profile.zone?.name || profile.zone_name || '',
        shift_name: profile.shift?.name || profile.shift_name || '',
      });
    } else {
      // Fallback from localStorage if API is loading
      const local = getCurrentUser();
      if (local && local.id) {
        setFormData((prev) => ({
          ...prev,
          name: local.name || '',
          email: local.email || '',
          phone: local.phone || '',
        }));
        setImagePreview(local.image || null);
        setAccountInfo((prev) => ({
          ...prev,
          role: local.role || '',
        }));
      }
    }
  }, [profileResponse]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload a valid image file');
        return;
      }
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveExistingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      toast.error('Email is required');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Phone number is required');
      return;
    }

    // 2. Password validation (min 7 characters if provided)
    if (formData.password) {
      if (formData.password.length < 7) {
        toast.error('Password must be at least 7 characters (كلمة المرور يجب أن لا تقل عن 7 أحرف)');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match (كلمات المرور غير متطابقة)');
        return;
      }
    }

    // 3. Prepare FormData
    const data = new FormData();
    data.append('name', formData.name.trim());
    data.append('email', formData.email.trim().toLowerCase());
    data.append('phone', formData.phone.trim());

    if (formData.whatsapp) {
      data.append('whatsapp', formData.whatsapp.trim());
    } else {
      data.append('whatsapp', '');
    }

    if (formData.password) {
      data.append('password', formData.password);
    }

    if (selectedImageFile) {
      data.append('image', selectedImageFile);
    } else if (removeExistingImage) {
      data.append('image', '');
    }

    // 4. Send request
    const res = await mutate({
      method: 'PUT',
      url: '/api/profile',
      data,
      showToast: false,
    });

    if (res.success && res.data) {
      toast.success('Profile updated successfully (تم تحديث الملف الشخصي بنجاح)');

      const updatedUser = res.data.data?.user || res.data.user || res.data.data;
      const newToken = res.data.data?.token || res.data.token;

      if (newToken) {
        setAuthToken(newToken);
      }

      if (updatedUser) {
        // Sync local storage
        const current = getCurrentUser();
        const mergedUser = { ...current, ...updatedUser };
        localStorage.setItem('user', JSON.stringify(mergedUser));

        // Dispatch custom event to notify Sidebar, Topbar, and other components immediately
        window.dispatchEvent(new CustomEvent('user-profile-updated', { detail: mergedUser }));
      }

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        password: '',
        confirmPassword: '',
      }));
      setSelectedImageFile(null);
      setRemoveExistingImage(false);

      refresh();
    }
  };

  const formatRoleName = (role) => {
    if (!role) return 'User';
    return role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-['Plus_Jakarta_Sans']">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">account_circle</span>
            <span>My Profile</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {formatRoleName(accountInfo.role)}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your personal credentials, contact info, profile photo, and account security.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving || fetchingProfile}
          className="rounded-xl px-5 h-11 gap-2 shadow-sm font-semibold transition-all active:scale-95"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary Card */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs flex flex-col items-center text-center space-y-4">
            {/* Avatar Preview & Actions */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-background shadow-lg ring-2 ring-primary/20 bg-muted/30 flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt={formData.name || 'User Avatar'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-4xl">
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs cursor-pointer"
                title="Change Photo"
              >
                <Camera className="w-7 h-7 mb-1" />
                <span className="text-xs font-semibold">Change</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <div>
              <h2 className="text-lg font-bold text-foreground truncate max-w-[220px]">
                {formData.name || 'Your Name'}
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                {formData.email || 'your.email@example.com'}
              </p>
            </div>

            {/* Quick Actions for Avatar */}
            <div className="flex items-center gap-2 pt-1 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 rounded-xl text-xs h-9 gap-1.5 border-border/80"
              >
                <Camera className="w-3.5 h-3.5 text-primary" />
                <span>Upload</span>
              </Button>

              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="rounded-xl text-xs h-9 px-3 border-destructive/30 text-destructive hover:bg-destructive/10"
                  title="Remove Photo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            <p className="text-[11px] text-muted-foreground">
              Allowed JPG, PNG or WEBP. Max size 5MB.
            </p>
          </div>

          {/* Account Details Card */}
          <div className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span>Account Overview</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">System Role</span>
                <span className="font-semibold text-foreground px-2 py-0.5 rounded-md bg-muted">
                  {formatRoleName(accountInfo.role)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                <span className="text-muted-foreground">Account Status</span>
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {accountInfo.status}
                </span>
              </div>

              {accountInfo.points > 0 && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Points Balance</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    {accountInfo.points} pts
                  </span>
                </div>
              )}

              {accountInfo.job_name && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Job Title</span>
                  <span className="font-medium text-foreground">{accountInfo.job_name}</span>
                </div>
              )}

              {accountInfo.department_name && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium text-foreground">{accountInfo.department_name}</span>
                </div>
              )}

              {accountInfo.zone_name && (
                <div className="flex items-center justify-between py-1.5 border-b border-border/60">
                  <span className="text-muted-foreground">Zone</span>
                  <span className="font-medium text-foreground">{accountInfo.zone_name}</span>
                </div>
              )}

              {accountInfo.shift_name && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Shift</span>
                  <span className="font-medium text-foreground">{accountInfo.shift_name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Columns: Personal Details & Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section: Personal Information */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <span>Personal Information</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Update your display name, contact phone number, and official email address.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Name */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Full Name</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className="rounded-xl h-11 bg-background border-border text-sm"
                  required
                />
              </div>

              {/* Email (Unique) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Email Address (Unique)</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="name@company.com"
                  className="rounded-xl h-11 bg-background border-border text-sm"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be unique across all system users.
                </p>
              </div>

              {/* Phone (Unique) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Phone Number (Unique)</span>
                  <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="+20 1xxxxxxxxx"
                  className="rounded-xl h-11 bg-background border-border text-sm"
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Must be unique across all system users.
                </p>
              </div>

              {/* WhatsApp */}
              <div className="space-y-2 sm:col-span-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>WhatsApp Number (Optional)</span>
                </label>
                <Input
                  type="tel"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleInputChange}
                  placeholder="+20 1xxxxxxxxx"
                  className="rounded-xl h-11 bg-background border-border text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section: Change Password */}
          <div className="bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Security & Password</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Leave these fields blank if you do not wish to change your password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* New Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>New Password</span>
                  </span>
                  <span className="text-[11px] font-medium text-primary">Min 7 characters</span>
                </label>

                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter new password (min 7 chars)"
                    className="rounded-xl h-11 bg-background border-border pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    title={showPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {formData.password && formData.password.length < 7 && (
                  <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Password must be at least 7 characters (الحد الأدنى 7 أحرف)</span>
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Confirm Password</span>
                </label>

                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Re-enter new password"
                    className="rounded-xl h-11 bg-background border-border pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                    title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-[11px] font-semibold text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Passwords do not match (كلمات المرور غير متطابقة)</span>
                  </p>
                )}
                {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && formData.password.length >= 7 && (
                  <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passwords match</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Save Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving || fetchingProfile}
              className="rounded-xl px-8 h-12 gap-2 shadow-md font-semibold text-sm transition-all active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Profile;
