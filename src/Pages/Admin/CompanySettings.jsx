import React, { useState, useEffect } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Building, Upload, Save } from 'lucide-react';
import { toast } from 'sonner';

const CompanySettings = () => {
  const { data, loading, refresh } = useGet('/api/admin/company');
  const { mutate, loading: mutationLoading } = useMutation();
  
  const [formData, setFormData] = useState({
    name: '',
    owner_name: '',
    address: '',
    phone: '',
    whatts: '',
    facebook: '',
    instgram: '',
    email: '',
    logo: ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || '',
        owner_name: data.owner_name || '',
        address: data.address || '',
        phone: data.phone || '',
        whatts: data.whatts || '',
        facebook: data.facebook || '',
        instgram: data.instgram || '',
        email: data.email || '',
        logo: data.logo || ''
      });
    }
  }, [data]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.logo) {
      toast.error('Name and Logo are required.');
      return;
    }

    const res = await mutate({
      method: 'PUT',
      url: '/api/admin/company',
      data: formData
    });

    if (res?.success) {
      toast.success('Company settings updated successfully');
      refresh();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 bg-background min-h-screen relative text-foreground max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-['Plus_Jakarta_Sans'] text-foreground flex items-center gap-2">
            <Building className="w-8 h-8 text-primary" />
            Company Setup
          </h1>
          <p className="text-muted-foreground mt-1">Manage your project's business information and identity</p>
        </div>
      </div>

      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Logo Section */}
          <div className="flex flex-col items-center sm:items-start gap-4 pb-6 border-b border-border">
            <label className="text-sm font-semibold text-foreground">Company Logo <span className="text-red-500">*</span></label>
            <div className="flex items-center gap-6">
              <div className="relative w-32 h-32 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden group">
                {formData.logo ? (
                  <img src={formData.logo} alt="Company Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <Building className="w-12 h-12 text-muted-foreground/50" />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <input type="file" accept="image/*" onChange={handleImageChange} className="absolute inset-0 opacity-0 cursor-pointer" />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Recommended size: 512x512px</p>
                <p>Formats: PNG, JPG</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Company Name <span className="text-red-500">*</span></label>
              <Input name="name" value={formData.name} onChange={handleInputChange} required className="h-11" placeholder="Enter company name" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Owner Name</label>
              <Input name="owner_name" value={formData.owner_name} onChange={handleInputChange} className="h-11" placeholder="Enter owner name" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Address</label>
              <Input name="address" value={formData.address} onChange={handleInputChange} className="h-11" placeholder="Full address" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Email</label>
              <Input type="email" name="email" value={formData.email} onChange={handleInputChange} className="h-11" placeholder="company@example.com" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Phone</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} className="h-11" placeholder="e.g. +123456789" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">WhatsApp</label>
              <Input name="whatts" value={formData.whatts} onChange={handleInputChange} className="h-11" placeholder="WhatsApp number" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Facebook Link</label>
              <Input name="facebook" value={formData.facebook} onChange={handleInputChange} className="h-11" placeholder="https://facebook.com/..." />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground">Instagram Link</label>
              <Input name="instgram" value={formData.instgram} onChange={handleInputChange} className="h-11" placeholder="https://instagram.com/..." />
            </div>
          </div>

          <div className="pt-6 border-t border-border flex justify-end">
            <Button type="submit" disabled={mutationLoading} className="bg-primary hover:bg-primary/90 text-white px-8 h-12 text-base font-semibold">
              {mutationLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
