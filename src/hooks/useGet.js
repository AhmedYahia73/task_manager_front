import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios'; // 1. استيراد الـ apiClient المخصص بتاعنا
import { toast } from 'sonner';

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
            const errMsg = err.response?.data?.error?.message || err.response?.data?.message || 'Something went wrong';
            setError(errMsg);
            toast.error("Error", { description: errMsg });
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (autoFetch) fetchData();
    }, [fetchData, autoFetch]);

    return { data, loading, error, refresh: fetchData };
};