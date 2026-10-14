import { useState } from 'react';
import { apiClient } from '@/lib/axios';
import { toast } from 'sonner';

export const useMutation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const mutate = async ({ method, url, data = null, showToast = true, headers = {}, ...restConfig }) => {
        setLoading(true);
        setError(null);
        try {
            // 1. الفحص إذا كانت البيانات من نوع FormData
            const isFormData = data instanceof FormData;

            const config = {
                method,
                url,
                ...(data !== null && data !== undefined ? { data } : {}),
                headers: {
                    ...headers,
                },
                ...restConfig,
            };

            if (isFormData && config.headers && config.headers['Content-Type']) {
                delete config.headers['Content-Type'];
            }

            const response = await apiClient(config);

            if (showToast) toast.success("Operation successful");

            return { success: true, data: response.data };
        } catch (err) {
            const errMsg = err.response?.data?.message || 'Operation failed';
            setError(errMsg);

            if (showToast) toast.error("Error", { description: errMsg });

            return { success: false, error: errMsg };
        } finally {
            setLoading(false);
        }
    };

    return { mutate, loading, error };
};