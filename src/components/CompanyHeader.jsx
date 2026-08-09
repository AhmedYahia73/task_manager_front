import React from 'react';
import { useGet } from '@/hooks/useGet';
import { Loader2 } from 'lucide-react';

export const CompanyHeader = () => {
  const { data, loading } = useGet('/api/admin/company');

  if (loading) {
    return (
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-muted animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-5 mb-8 bg-card p-6 rounded-2xl shadow-sm border border-border">
      {data.logo ? (
        <img 
          src={data.logo} 
          alt={data.name} 
          className="w-16 h-16 object-contain rounded-xl p-1 bg-white border border-border shadow-sm"
        />
      ) : (
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold text-2xl shadow-sm">
          {data.name?.charAt(0)?.toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="text-3xl font-black text-foreground font-['Plus_Jakarta_Sans'] tracking-tight">
          {data.name}
        </h1>
        {data.owner_name && (
          <p className="text-sm font-medium text-muted-foreground mt-1">
            Owned by {data.owner_name}
          </p>
        )}
      </div>
    </div>
  );
};
