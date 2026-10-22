// src/Pages/Admin/Sales/SalesDashboard.jsx

import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { SalesWorkspaceHeader } from "@/components/SalesWorkspaceHeader";
import { setActiveSalesProject, getActiveSalesProjectId } from "@/utils/salesProject";
import {
  Plus,
  Calendar,
  RefreshCw,
  Target,
  TrendingUp,
  Activity,
  Handshake,
  CheckCircle2,
  Loader2,
  ListTodo,
} from "lucide-react";

export default function SalesDashboard() {
  const { id: routeProjectId, projectId: layoutProjectId } = useParams();
  const currentProjectId = layoutProjectId || routeProjectId;
  const [dateFilter, setDateFilter] = useState({ from: "", to: "" });

  // Synchronize active project id
  useEffect(() => {
    if (currentProjectId && currentProjectId !== getActiveSalesProjectId()) {
      setActiveSalesProject({ id: currentProjectId });
    }
  }, [currentProjectId]);

  const queryParams = new URLSearchParams();
  if (dateFilter.from) queryParams.append("from", dateFilter.from);
  if (dateFilter.to) queryParams.append("to", dateFilter.to);

  const queryString = queryParams.toString();
  const endpoint = `/api/admin/sales/dashboard${queryString ? `?${queryString}` : ""}`;

  const { data, loading, error, refresh } = useGet(endpoint);

  const apiData = data || {};

  const achievedVisits = apiData.targetAchievedVisits || 0;
  const targetVisits = apiData.total_visits_target || 0;
  const visitsProgress = targetVisits > 0 ? (achievedVisits / targetVisits) * 100 : 0;

  const achievedSales = apiData.targetAchievedSales || 0;
  const targetSales = apiData.total_sales_target || 0;
  const salesProgress = targetSales > 0 ? (achievedSales / targetSales) * 100 : 0;

  const achievedPoints = apiData.targetAchievedPoints || 0;
  const targetPoints = apiData.total_points_target || 0;
  const pointsProgress = targetPoints > 0 ? (achievedPoints / targetPoints) * 100 : 0;

  const stats = {
    sales: apiData.sales || 0,
    delivered: apiData.delivered || 0,
    negotiation: apiData.negotiation || 0,
  };

  const visitStatuses = apiData.allVisitStatuss || [];

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setDateFilter((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* --- Filters Section --- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
              Sales Overview & KPIs
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track achievements, visits, and sales against set targets in real-time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2.5 sm:gap-3 w-full lg:w-auto">
          <Button
            asChild
            size="sm"
            className="rounded-xl font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-sm h-9 sm:h-10 px-4 self-stretch sm:self-auto shrink-0"
          >
            <Link to={currentProjectId ? `/admin/sales-projects/${currentProjectId}/visits/add` : '/admin/sales/visits/add'}>
              <Plus className="w-4 h-4" />
              <span>New Visit</span>
            </Link>
          </Button>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:gap-2.5">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> From
              </Label>
              <Input
                id="from"
                type="date"
                name="from"
                value={dateFilter.from}
                onChange={handleFilterChange}
                className="w-full sm:w-36 h-9 rounded-xl text-xs bg-background"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="to" className="text-[11px] sm:text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> To
              </Label>
              <Input
                id="to"
                type="date"
                name="to"
                value={dateFilter.to}
                onChange={handleFilterChange}
                className="w-full sm:w-36 h-9 rounded-xl text-xs bg-background"
              />
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            disabled={loading}
            className="h-9 w-9 rounded-xl hover:bg-muted border-border/80 shrink-0 self-end hidden sm:flex"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-2xl text-sm flex items-center justify-between">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={refresh} className="text-destructive hover:bg-destructive/20">
            Retry
          </Button>
        </div>
      )}

      {/* --- Targets & Achievements (Progress Section) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Visits Target */}
        <Card className="border-border/80 shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Visits Target</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{achievedVisits}</span>
                  <span className="text-xs font-medium text-muted-foreground">/ {targetVisits}</span>
                </div>
              </div>
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <Progress value={visitsProgress} className="h-2 rounded-full" />
            <p className="text-[11px] font-semibold text-muted-foreground mt-2 flex justify-end">
              {visitsProgress.toFixed(1)}% Achieved
            </p>
          </CardContent>
        </Card>

        {/* Sales Target */}
        <Card className="border-border/80 shadow-xs rounded-2xl overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sales Target</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{achievedSales}</span>
                  <span className="text-xs font-medium text-muted-foreground">/ {targetSales}</span>
                </div>
              </div>
              <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <Progress value={salesProgress} className="h-2 rounded-full" />
            <p className="text-[11px] font-semibold text-muted-foreground mt-2 flex justify-end">
              {salesProgress.toFixed(1)}% Achieved
            </p>
          </CardContent>
        </Card>

        {/* Points Target */}
        <Card className="border-border/80 shadow-xs rounded-2xl overflow-hidden sm:col-span-2 lg:col-span-1">
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Points Target</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{achievedPoints}</span>
                  <span className="text-xs font-medium text-muted-foreground">/ {targetPoints}</span>
                </div>
              </div>
              <div className="p-2.5 bg-indigo-500/10 text-indigo-500 rounded-xl">
                <Target className="w-5 h-5" />
              </div>
            </div>
            <Progress value={pointsProgress} className="h-2 rounded-full" />
            <p className="text-[11px] font-semibold text-muted-foreground mt-2 flex justify-end">
              {pointsProgress.toFixed(1)}% Achieved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Stats & Statuses --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Negotiation */}
        <Card className="border-l-4 border-l-amber-500 border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Negotiation</CardTitle>
            <Handshake className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent className="pb-4">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.negotiation}</div>
            )}
          </CardContent>
        </Card>

        {/* Delivered */}
        <Card className="border-l-4 border-l-emerald-500 border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Delivered</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="pb-4">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.delivered}</div>
            )}
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card className="border-l-4 border-l-primary border-border/80 shadow-xs rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Sales</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-4">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <div className="text-2xl font-bold text-foreground">{stats.sales}</div>
            )}
          </CardContent>
        </Card>

        {/* Dynamic Statuses */}
        {visitStatuses.map((status) => (
          <Card key={status.id} className="border-border/80 shadow-xs rounded-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground truncate mr-2" title={status.name}>
                {status.name}
              </CardTitle>
              <ListTodo className="w-4 h-4 text-muted-foreground/60 shrink-0" />
            </CardHeader>
            <CardContent className="pb-4">
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <div className="text-2xl font-bold text-foreground">{status.count}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
