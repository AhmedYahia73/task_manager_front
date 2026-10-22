// src/layouts/SalesProjectWorkspaceLayout.jsx

import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useParams, useNavigate, useLocation, NavLink } from 'react-router-dom';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import {
  getActiveSalesProject,
  setActiveSalesProject,
  getActiveSalesProjectId,
} from '@/utils/salesProject';
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
  ChevronDown,
  Sparkles,
  Check,
} from 'lucide-react';

export const SalesProjectWorkspaceLayout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [currentProject, setCurrentProject] = useState(() => {
    const cached = getActiveSalesProject();
    if (cached && cached.id === projectId) return cached;
    return null;
  });

  const [projectsList, setProjectsList] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setIsSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 1. Strict Guard: Must have a projectId
  useEffect(() => {
    if (!projectId) {
      toast.error('Please select a sales project first');
      navigate('/admin/sales-projects', { replace: true });
      return;
    }

    // Synchronize storage and axios header
    if (getActiveSalesProjectId() !== projectId) {
      setActiveSalesProject({ id: projectId });
    }

    // Fetch project details if not available or id mismatch
    let isMounted = true;
    const fetchProjectDetails = async () => {
      try {
        const res = await apiClient.get(`/api/admin/sales/projects/${projectId}`);
        const proj = res.data?.salesProject;
        if (isMounted && proj) {
          setCurrentProject(proj);
          setActiveSalesProject(proj);
        }
      } catch (err) {
        console.error('Failed to fetch sales project details:', err);
      }
    };

    fetchProjectDetails();
    return () => {
      isMounted = false;
    };
  }, [projectId, navigate]);

  // 2. Fetch list of available sales projects for quick switching dropdown
  useEffect(() => {
    let isMounted = true;
    const fetchAllProjects = async () => {
      setLoadingProjects(true);
      try {
        const res = await apiClient.get('/api/admin/sales/projects?limit=50');
        const list = res.data?.salesProjects || [];
        if (isMounted) setProjectsList(list);
      } catch (err) {
        console.error('Failed to fetch projects list for switcher:', err);
      } finally {
        if (isMounted) setLoadingProjects(false);
      }
    };
    fetchAllProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSwitchProject = (targetProject) => {
    setIsSwitcherOpen(false);
    if (targetProject.id === projectId) return;
    setActiveSalesProject(targetProject);
    setCurrentProject(targetProject);
    toast.success(`Switched to project: ${targetProject.name}`);

    // Keep current subpath if possible, or fallback to dashboard
    const parts = location.pathname.split(`/sales-projects/${projectId}/`);
    const subpath = parts[1] || 'dashboard';
    navigate(`/admin/sales-projects/${targetProject.id}/${subpath}`);
  };

  const navItems = [
    { label: 'Dashboard', path: `/admin/sales-projects/${projectId}/dashboard`, icon: LayoutDashboard },
    { label: 'Visits', path: `/admin/sales-projects/${projectId}/visits`, icon: MapPin },
    { label: 'Leads', path: `/admin/sales-projects/${projectId}/leads`, icon: Users },
    { label: 'Products', path: `/admin/sales-projects/${projectId}/products`, icon: Package },
    { label: 'Targets', path: `/admin/sales-projects/${projectId}/target`, icon: Target },
    { label: 'Wishlist', path: `/admin/sales-projects/${projectId}/wishlist`, icon: Heart },
    { label: 'Status Requests', path: `/admin/sales-projects/${projectId}/requests`, icon: GitPullRequest },
    { label: 'Visit Statuses', path: `/admin/sales-projects/${projectId}/visitstatus`, icon: SlidersHorizontal },
    { label: 'Sales Leaders', path: `/admin/sales-projects/${projectId}/leaders`, icon: Briefcase },
    { label: 'Sales Reps', path: `/admin/sales-projects/${projectId}/sales`, icon: UserCheck },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================
          🏢 Enterprise Workspace Header & Project Switcher
          ======================================================== */}
      <div className="bg-card border border-border/70 rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
        {/* Top Bar: Identity & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3.5">
            {/* Back to all sales projects */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/sales-projects')}
              className="rounded-xl h-9 px-3 gap-1.5 border-border/70 hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              title="Back to all sales projects"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-semibold">All Projects</span>
            </Button>

            {/* Project Logo */}
            {currentProject?.logo ? (
              <img
                src={currentProject.logo}
                alt={currentProject.name || 'Sales Project'}
                className="w-11 h-11 object-contain rounded-xl border border-border/60 bg-muted/40 p-1 shadow-2xs shrink-0"
              />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
            )}

            {/* Project Details & Switcher */}
            <div>
              <div className="flex items-center gap-2 relative" ref={switcherRef}>
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  {currentProject?.name || 'Sales Workspace'}
                </h1>

                {/* Project Switcher Button */}
                <button
                  type="button"
                  onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
                  className="flex items-center gap-1 h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/40 hover:bg-muted rounded-lg transition-colors"
                >
                  <span>Switch Project</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isSwitcherOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu Container */}
                {isSwitcherOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 rounded-xl border border-border bg-popover p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[11px] font-semibold text-muted-foreground px-2 py-1">
                      Available Sales Projects
                    </div>
                    <div className="h-px bg-border my-1" />
                    <div className="max-h-56 overflow-y-auto space-y-0.5">
                      {projectsList.length > 0 ? (
                        projectsList.map((p) => {
                          const isCurrent = p.id === projectId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSwitchProject(p)}
                              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors text-left ${
                                isCurrent
                                  ? 'bg-primary/10 text-primary font-bold'
                                  : 'hover:bg-muted text-foreground'
                              }`}
                            >
                              <div className="flex items-center gap-2 truncate">
                                {p.logo ? (
                                  <img
                                    src={p.logo}
                                    alt={p.name}
                                    className="w-5 h-5 object-contain rounded bg-muted/50 p-0.5 shrink-0"
                                  />
                                ) : (
                                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                )}
                                <span className="truncate">{p.name}</span>
                              </div>
                              {isCurrent && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-2 text-center text-xs text-muted-foreground">
                          {loadingProjects ? 'Loading projects...' : 'No other projects'}
                        </div>
                      )}
                    </div>
                    <div className="h-px bg-border my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        setIsSwitcherOpen(false);
                        navigate('/admin/sales-projects');
                      }}
                      className="w-full text-right px-2.5 py-1.5 text-xs text-primary font-medium hover:bg-muted rounded-lg"
                    >
                      Manage All Projects...
                    </button>
                  </div>
                )}

                {currentProject?.design && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                    <Sparkles className="w-3 h-3" />
                    {currentProject.design}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Integrated sales workspace for visits, leads, and performance tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-medium border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Active Project
            </span>
          </div>
        </div>

        {/* Bottom Bar: Horizontal Module Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-3 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.path ||
              (item.path.endsWith('/dashboard') &&
                (location.pathname === `/admin/sales-projects/${projectId}` ||
                  location.pathname === `/admin/sales-projects/${projectId}/`));

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ========================================================
          📦 Workspace Child View (Dashboard, Visits, Leads, etc.)
          ======================================================== */}
      <div>
        <Outlet />
      </div>
    </div>
  );
};
