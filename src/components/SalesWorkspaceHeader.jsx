// src/components/SalesWorkspaceHeader.jsx

import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getActiveSalesProject, clearActiveSalesProject } from '@/utils/salesProject';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  LayoutDashboard,
  MapPin,
  Users,
  Package,
  Target,
  Heart,
  GitPullRequest,
  SlidersHorizontal,
  ShieldCheck,
  Briefcase,
  UserCheck,
  Building2,
  Sparkles
} from 'lucide-react';

export const SalesWorkspaceHeader = ({ title, subtitle, extraAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeProject = getActiveSalesProject();
  const projectId = activeProject?.id;

  const navItems = [
    { label: 'Dashboard', path: projectId ? `/admin/sales-projects/${projectId}/dashboard` : '/admin/sales/dashboard', icon: LayoutDashboard },
    { label: 'Visits', path: projectId ? `/admin/sales-projects/${projectId}/visits` : '/admin/sales/visits', icon: MapPin },
    { label: 'Leads', path: projectId ? `/admin/sales-projects/${projectId}/leads` : '/admin/sales/leads', icon: Users },
    { label: 'Products', path: projectId ? `/admin/sales-projects/${projectId}/products` : '/admin/sales/products', icon: Package },
    { label: 'Targets', path: projectId ? `/admin/sales-projects/${projectId}/target` : '/admin/sales/target', icon: Target },
    { label: 'Wishlist', path: projectId ? `/admin/sales-projects/${projectId}/wishlist` : '/admin/sales/wishlist', icon: Heart },
    { label: 'Status Requests', path: projectId ? `/admin/sales-projects/${projectId}/requests` : '/admin/sales/requests', icon: GitPullRequest },
    { label: 'Visit Statuses', path: projectId ? `/admin/sales-projects/${projectId}/visitstatus` : '/admin/sales/visitstatus', icon: SlidersHorizontal },
    { label: 'Sales Leaders', path: projectId ? `/admin/sales-projects/${projectId}/leaders` : '/admin/sales/leaders', icon: Briefcase },
    { label: 'Sales Reps', path: projectId ? `/admin/sales-projects/${projectId}/sales` : '/admin/sales/sales', icon: UserCheck },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Top Banner with Active Project Context */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/sales-projects')}
            className="rounded-xl h-9 px-3 gap-1.5 border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            title="All Sales Projects"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-semibold">All Projects</span>
          </Button>

          {activeProject?.logo ? (
            <img
              src={activeProject.logo}
              alt={activeProject.name || 'Sales Project'}
              className="w-10 h-10 object-contain rounded-xl border border-border/60 bg-muted/30 p-1 shadow-2xs"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {activeProject?.name || 'Sales Management'}
              </h2>
              {activeProject?.design && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  {activeProject.design}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {subtitle || 'Manage sales, visits, products and team performance'}
            </p>
          </div>
        </div>

        {/* Extra Action (e.g. Add button or filters) */}
        {extraAction && (
          <div className="flex items-center gap-2 shrink-0">
            {extraAction}
          </div>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/sales/dashboard' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
