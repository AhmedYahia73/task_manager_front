import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { setAuthToken, isAuthenticated } from '@/utils/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@/hooks/useMutation';



export const LoginPage = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // If already authenticated, redirect immediately
    if (isAuthenticated()) {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const role = user?.role?.toLowerCase?.() || '';
        if (role === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      } catch {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [navigate]);

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
    
    if (response?.data?.data) {
        const { token, user } = response.data.data;
        
        setAuthToken(token);
        localStorage.setItem('user', JSON.stringify(user));
        
        const userRole = user?.role?.toLowerCase?.() || '';
        if (userRole === 'admin') {
          navigate('/admin/dashboard', { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background p-4 overflow-hidden font-['Plus_Jakarta_Sans']">
      {/* Dynamic Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]" />
        <div className="absolute -bottom-[10%] -left-[10%] w-[500px] h-[500px] rounded-full bg-[#006c49]/10 blur-[100px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-card rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.08)] border border-border p-10 z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.2, duration: 0.4, type: 'spring' }}
            className="flex items-center justify-center mx-auto mb-6 bg-card rounded-2xl p-2 w-24 h-24 shadow-sm border border-border"
          >
            <img src="/logo.png" alt="Taskito Logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-sm text-muted-foreground ">
            Please enter your admin credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-foreground dark:text-[#e1e3e4]">
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type="email" 
                name="email"
                placeholder="admin@example.com"
                className="pl-11 h-12 bg-background border-border focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl text-[15px]"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-semibold text-foreground dark:text-[#e1e3e4]">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="pl-11 pr-11 h-12 bg-background border-border focus-visible:ring-primary/20 focus-visible:border-primary transition-all rounded-xl text-[15px]"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground dark:hover:text-white transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-[15px] font-semibold bg-primary hover:bg-primary-hover text-white transition-all shadow-[0_4px_14px_rgba(53,37,205,0.3)] hover:shadow-[0_6px_20px_rgba(53,37,205,0.4)] rounded-xl mt-4" 
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Signing in...</span>
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