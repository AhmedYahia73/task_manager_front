import React, { useState } from 'react';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Star, Eye, Download, FileText, Phone, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const ApplicationsList = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterFavourite, setFilterFavourite] = useState(false);
  const { data, loading, refresh } = useGet(`/api/admin/applications?page=${page}&limit=10&search=${search}${filterFavourite ? '&favourite=true' : ''}`);
  const { mutate } = useMutation();

  const applicationsList = data?.applications || [];
  const pagination = data?.pagination || {};

  const [selectedApp, setSelectedApp] = useState(null);
  const { data: detailsData, loading: detailsLoading } = useGet(
    selectedApp ? `/api/admin/applications/${selectedApp}` : null
  );

  const handleToggleFavourite = async (app) => {
    const res = await mutate({ url: `/api/admin/applications/${app.id}/favourite`, method: 'PATCH', data: { favourite: !app.favourite }, showToast: false });
    if (res.success) {
      toast.success(res.message || 'Favourite status updated');
      refresh();
    } else {
      toast.error(res.message || 'An error occurred');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application? This action will also delete the CV file and cannot be undone.')) return;
    const res = await mutate({ url: `/api/admin/applications/${id}`, method: 'DELETE' });
    if (res.success) {
      toast.success(res.message || 'Application deleted successfully');
      refresh();
      if (selectedApp === id) setSelectedApp(null);
    } else {
      toast.error(res.message || 'An error occurred');
    }
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Applications</h1>
          <p className="text-muted-foreground mt-1 text-sm">Review and manage candidate applications</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <Input 
            placeholder="Search by name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => { setFilterFavourite(false); setPage(1); }}
          className={`pb-3 px-6 text-sm font-medium transition-colors ${!filterFavourite ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          All Applications
        </button>
        <button
          onClick={() => { setFilterFavourite(true); setPage(1); }}
          className={`pb-3 px-6 text-sm font-medium transition-colors flex items-center gap-2 ${filterFavourite ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Star size={14} className={filterFavourite ? 'fill-current' : ''} />
          Favourites
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-sm">
                  <th className="p-4 font-semibold text-foreground w-12 text-center">Fav</th>
                  <th className="p-4 font-semibold text-foreground">Applicant</th>
                  <th className="p-4 font-semibold text-foreground">Job</th>
                  <th className="p-4 font-semibold text-foreground hidden md:table-cell">City</th>
                  <th className="p-4 font-semibold text-foreground hidden lg:table-cell">Qualification</th>
                  <th className="p-4 font-semibold text-foreground hidden sm:table-cell">Salary</th>
                  <th className="p-4 font-semibold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {applicationsList.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-muted-foreground">
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applicationsList.map((app) => (
                    <tr key={app.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleToggleFavourite(app)}
                          className={`transition-colors p-1 rounded hover:bg-muted ${app.favourite ? 'text-amber-500' : 'text-muted-foreground hover:text-amber-500'}`}
                        >
                          <Star size={18} className={app.favourite ? 'fill-current' : ''} />
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="font-medium text-foreground">{app.name}</div>
                        <div className="text-muted-foreground text-xs flex items-center gap-1 mt-1">
                          <Phone size={10} /> {app.phone}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-medium text-xs">
                          {app.job_name || 'N/A'}
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-foreground">
                        {app.city_name || 'N/A'}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-foreground">
                        {app.qualification_name || 'N/A'}
                      </td>
                      <td className="p-4 hidden sm:table-cell font-medium text-emerald-600 dark:text-emerald-400">
                        {app.expected_salary ? `${app.expected_salary} EGP` : 'Negotiable'}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View CV"
                            asChild
                            className="text-primary hover:text-primary hover:bg-primary/10"
                          >
                            <a href={app.upload_cv?.startsWith('http') ? app.upload_cv : `${import.meta.env.VITE_API_BASE_URL || ''}${app.upload_cv}`} target="_blank" rel="noopener noreferrer">
                              <FileText size={16} />
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                            onClick={() => setSelectedApp(app.id)}
                            className="text-foreground hover:bg-muted"
                          >
                            <Eye size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDelete(app.id)}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <Button variant="outline" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-2xl rounded-xl shadow-xl border border-border p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedApp(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-bold text-foreground mb-6 border-b border-border pb-4">
              Application Details
            </h2>
            
            {detailsLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="animate-spin text-primary w-8 h-8" />
              </div>
            ) : detailsData?.application ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Applicant Name</h3>
                    <p className="text-foreground font-medium">{detailsData.application.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Phone Number</h3>
                    <p className="text-foreground">{detailsData.application.phone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Address</h3>
                    <p className="text-foreground">{detailsData.application.address}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Job Applied For</h3>
                    <p className="text-foreground">{detailsData.application.job_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Expected Salary</h3>
                    <p className="text-foreground">{detailsData.application.expected_salary ? `${detailsData.application.expected_salary} EGP` : 'Not specified'}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Qualification</h3>
                    <p className="text-foreground">{detailsData.application.qualification_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">City</h3>
                    <p className="text-foreground">{detailsData.application.city_name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Marital Status</h3>
                    <p className="text-foreground">{detailsData.application.marital_status || '-'}</p>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Education & Experience</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">University</span>
                      <p className="text-sm">{detailsData.application.university || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">College</span>
                      <p className="text-sm">{detailsData.application.college || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Current Job</span>
                      <p className="text-sm">{detailsData.application.current_job || '-'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">Graduation Date</span>
                      <p className="text-sm">{detailsData.application.graduate_date ? new Date(detailsData.application.graduate_date).toLocaleDateString() : '-'}</p>
                    </div>
                  </div>
                </div>

                {detailsData.application.experiences && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Experiences</h3>
                    <div className="bg-muted/30 p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {detailsData.application.experiences}
                    </div>
                  </div>
                )}
                
                {detailsData.application.courses && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Courses</h3>
                    <div className="bg-muted/30 p-3 rounded-lg text-sm whitespace-pre-wrap">
                      {detailsData.application.courses}
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4 flex gap-3">
                  <Button asChild className="w-full sm:w-auto min-w-[140px]">
                    <a href={detailsData.application.upload_cv?.startsWith('http') ? detailsData.application.upload_cv : `${import.meta.env.VITE_API_BASE_URL || ''}${detailsData.application.upload_cv}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2">
                      <FileText size={16} className="shrink-0" /> <span className="whitespace-nowrap">Open CV</span>
                    </a>
                  </Button>
                  {detailsData.application.link && (
                    <Button asChild variant="outline" className="flex-1 flex items-center gap-2 justify-center">
                      <a href={detailsData.application.link} target="_blank" rel="noopener noreferrer">
                        <Download size={16} /> Portfolio Link
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Failed to load details.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsList;
