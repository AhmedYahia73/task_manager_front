import React from 'react';
import { useGet } from '@/hooks/useGet';

export const CompanyFooter = () => {
  const { data, loading } = useGet('/api/admin/company');

  if (loading || !data) return null;

  const waLink = data.whatts ? `https://wa.me/${data.whatts.replace(/[^0-9+]/g, '')}` : null;

  // Check if we have any footer data to display
  if (!data.address && !data.phone && !data.email && !data.facebook && !data.instgram && !data.whatts) {
    return null;
  }

  return (
    <div className="mt-12 bg-slate-900 dark:bg-slate-950 rounded-2xl shadow-lg border border-slate-800 overflow-hidden text-slate-300">
      <div className="p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Address Section */}
          {data.address && (
            <div className="space-y-3 lg:col-span-2">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                Our Location
              </h3>
              <p className="text-slate-100 leading-relaxed font-medium">
                {data.address}
              </p>
            </div>
          )}

          {/* Contact Section */}
          {(data.phone || data.email) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">contact_support</span>
                Contact Us
              </h3>
              <div className="space-y-2">
                {data.phone && (
                  <a href={`tel:${data.phone}`} className="flex items-center gap-2 text-slate-200 hover:text-primary transition-colors font-medium">
                    <span className="material-symbols-outlined text-lg">call</span>
                    <span dir="ltr">{data.phone}</span>
                  </a>
                )}
                {data.email && (
                  <a href={`mailto:${data.email}`} className="flex items-center gap-2 text-slate-200 hover:text-primary transition-colors font-medium break-all">
                    <span className="material-symbols-outlined text-lg">mail</span>
                    {data.email}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Social Section */}
          {(data.facebook || data.instgram || data.whatts) && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold tracking-wider text-slate-400 uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">share</span>
                Follow Us
              </h3>
              <div className="flex flex-col gap-2">
                {waLink && (
                  <a 
                    href={waLink}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-lg">chat</span>
                    WhatsApp
                  </a>
                )}
                {data.facebook && (
                  <a 
                    href={data.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-lg">thumb_up</span>
                    Facebook
                  </a>
                )}
                {data.instgram && (
                  <a 
                    href={data.instgram} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors font-medium"
                  >
                    <span className="material-symbols-outlined text-lg">photo_camera</span>
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Bottom Strip */}
      <div className="bg-black/20 p-4 text-center border-t border-slate-800">
        <p className="text-sm text-slate-400 font-medium">
          &copy; {new Date().getFullYear()} <span className="text-slate-200">{data.name}</span>. All rights reserved.
        </p>
      </div>
    </div>
  );
};
