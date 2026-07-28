import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/axios'; // 1. استيراد الـ apiClient المخصص بتاعنا

export const useGet = (url, autoFetch = true) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 2. استخدام apiClient بدلاً من axios العادي
            const response = await apiClient.get(url);
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }, [url]);

    useEffect(() => {
        if (autoFetch) fetchData();
    }, [fetchData, autoFetch]);

    return { data, loading, error, refresh: fetchData };
};