import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { setAuthToken } from '@/utils/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@/hooks/useMutation';

// استيراد اللوجو (تأكدي من صحة المسار في مشروعك)
import logo from '@/assets/logo.jpg'; 

export const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  const { mutate, loading } = useMutation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await mutate({
      method: 'POST',
      url: '/api/admin/auth/login', 
      data: formData
    });
    
    // الحل: الوصول إلى البيانات عبر المسار الصحيح (response.data.data)
    // نتحقق أولاً أن response.data.data موجود
    if (response?.data?.data) {
        const { token, user } = response.data.data;
        
        // 1. تخزين التوكن في الكوكيز
        setAuthToken(token);
        
        // 2. تخزين بيانات المستخدم في LocalStorage
        localStorage.setItem('user', JSON.stringify(user));
        
        // 3. التوجيه حسب الـ Role
        const userRole = user?.role?.toLowerCase?.() || '';
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
    } else {
        console.log("Login failed or structure mismatch. Response:", response);
    }
  };
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 overflow-hidden">
      {/* Subtle Branded Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-400/10 dark:bg-zinc-800/5 blur-[120px] pointer-events-none" />
      
      {/* Subtle Grid Pattern for Technical Feel */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-xl shadow-zinc-200/50 dark:shadow-none border border-zinc-200/60 dark:border-zinc-800 p-8 z-10"
      >
        <div className="text-center mb-8">
          {/* عرض اللوجو هنا */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="flex items-center justify-center mx-auto mb-4"
          >
            <img src={logo} alt="Company Logo" className="w-20 h-20 object-contain" />
          </motion.div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Sign in to manage your sales dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                type="email" 
                name="email"
                placeholder="name@systego.net"
                className="pl-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 focus-visible:ring-primary/50"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input 
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="pl-10 pr-10 h-11 bg-zinc-50/50 dark:bg-zinc-950/50 focus-visible:ring-primary/50"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 dark:shadow-none mt-2" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};