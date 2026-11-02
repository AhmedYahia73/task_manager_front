import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios'; // 1. استيراد الـ apiClient المخصص بتاعنا
import { toast } from 'sonner';
import { getAuthToken } from '@/utils/auth';

export const useGet = (url, autoFetch = true) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!url) return;
        setLoading(true);
        try {
            // 2. استخدام apiClient بدلاً من axios العادي
            const response = await apiClient.get(url);
            setData(response.data?.data || response.data);
            setError(null);
        } catch (err) {
            const status = err.response?.status;
            const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Something went wrong';
            setError(errMsg);

            // Suppress toast notifications for unauthenticated users / login page / "No token provided"
            const isNoTokenError = status === 401 && (errMsg === 'No token provided' || !getAuthToken());
            const isLoginPage = typeof window !== 'undefined' && window.location.pathname.includes('/login');

            if (!isNoTokenError && !isLoginPage) {
                toast.error("Error", { description: errMsg });
            }
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (autoFetch) fetchData();
    }, [fetchData, autoFetch]);

    return { data, loading, error, refresh: fetchData };
};