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
  Sparkles,
  TrendingUp,
} from 'lucide-react';

export const SalesWorkspaceHeader = ({ title, subtitle, extraAction }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeProject = getActiveSalesProject();
  const projectId = activeProject?.id;

  const navItems = [
    { label: 'Dashboard', path: projectId ? `/admin/sales-projects/${projectId}/dashboard` : '/admin/sales/dashboard', icon: LayoutDashboard },
    { label: 'Visits', path: projectId ? `/admin/sales-projects/${projectId}/visits` : '/admin/sales/visits', icon: MapPin },
    { label: 'Sales Deals', path: projectId ? `/admin/sales-projects/${projectId}/deals` : '/admin/sales/deals', icon: TrendingUp },
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
      <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 overflow-hidden">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/sales-projects')}
            className="rounded-xl h-8 sm:h-9 px-2 sm:px-3 gap-1 border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
            title="All Sales Projects"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden md:inline text-xs font-semibold">All Projects</span>
          </Button>

          {activeProject?.logo ? (
            <img
              src={activeProject.logo}
              alt={activeProject.name || 'Sales Project'}
              className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-xl border border-border/60 bg-muted/30 p-1 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-foreground truncate max-w-[180px] xs:max-w-xs md:max-w-md">
                {activeProject?.name || 'Sales Management'}
              </h2>
              {activeProject?.design && (
                <span className="hidden xs:inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <Sparkles className="w-3 h-3" />
                  {activeProject.design}
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground truncate hidden xs:block mt-0.5">
              {subtitle || 'Manage sales, visits, products and team performance'}
            </p>
          </div>
        </div>

        {/* Extra Action (e.g. Add button or filters) */}
        {extraAction && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
            {extraAction}
          </div>
        )}
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-border/60 touch-pan-x -webkit-overflow-scrolling-touch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/admin/sales/dashboard' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
