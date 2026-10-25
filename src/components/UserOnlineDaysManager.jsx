// src/components/UserOnlineDaysManager.jsx

import React, { useState, useEffect } from "react";
import {
  CalendarDays,
  Users,
  Search,
  Check,
  CheckCheck,
  Send,
  Loader2,
  Trash2,
  Edit2,
  Sparkles,
  UserCheck,
  Filter,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DAYS_CONFIG = [
  { key: "sunday", labelEn: "Sunday", labelAr: "الأحد" },
  { key: "monday", labelEn: "Monday", labelAr: "الإثنين" },
  { key: "tuesday", labelEn: "Tuesday", labelAr: "الثلاثاء" },
  { key: "wednesday", labelEn: "Wednesday", labelAr: "الأربعاء" },
  { key: "thursday", labelEn: "Thursday", labelAr: "الخميس" },
  { key: "friday", labelEn: "Friday", labelAr: "الجمعة" },
  { key: "saturday", labelEn: "Saturday", labelAr: "السبت" },
];

export const UserOnlineDaysManager = () => {
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");

  // Selection state
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);

  // Fetch users with their online days
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/api/admin/user-online-days");
      if (res?.data?.success) {
        setUsersList(res.data.data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users online days:", err);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users based on search and role
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "all" || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  // Select all filtered users
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredUsers.map((u) => u.id);
    const allSelected = filteredIds.every((id) => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Toggle day selection
  const toggleDay = (dayKey) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((d) => d !== dayKey) : [...prev, dayKey]
    );
  };

  // Quick preset: Sun-Thu
  const selectWorkdays = () => {
    setSelectedDays(["sunday", "monday", "tuesday", "wednesday", "thursday"]);
  };

  // Quick preset: Clear
  const clearDays = () => {
    setSelectedDays([]);
  };

  // Save changes & notify users
  const handleSaveAndNotify = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user");
      return;
    }

    try {
      setSaving(true);
      const res = await apiClient.put("/api/admin/user-online-days", {
        userIds: selectedUserIds,
        days: selectedDays,
      });

      if (res?.data?.success) {
        toast.success(
          `Online days assigned & real-time notification sent to ${selectedUserIds.length} user(s)!`
        );
        setSelectedUserIds([]);
        setSelectedDays([]);
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to update online days:", err);
      toast.error(err?.response?.data?.message || "Failed to update online days");
    } finally {
      setSaving(false);
    }
  };

  // Pre-fill selection from an existing user
  const handleEditUserDays = (user) => {
    setSelectedUserIds([user.id]);
    let days = user.online_days || [];
    if (typeof days === "string") {
      try {
        days = JSON.parse(days);
      } catch (e) {
        days = [];
      }
    }
    setSelectedDays(Array.isArray(days) ? days : []);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  // Clear online days for single user
  const handleClearSingleUser = async (userId) => {
    try {
      await apiClient.put("/api/admin/user-online-days", {
        userIds: [userId],
        days: [],
      });
      toast.success("User online days cleared");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to clear online days");
    }
  };

  const roles = [
    { key: "all", label: "All Roles" },
    { key: "engineer", label: "Engineers" },
    { key: "leader_sales", label: "Sales Leaders" },
    { key: "sales", label: "Sales Reps" },
    { key: "admin", label: "Admins" },
  ];

  return (
    <div className="space-y-6">
      {/* Configuration Card */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Assign User Online / Remote Work Days
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Select employees and the days they are authorized to work remotely. Users will receive an instant real-time notification.
          </p>
        </div>

        {/* Step 1: Select Users */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              1. Select Employees ({selectedUserIds.length} selected)
            </label>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectAllFiltered}
                className="text-xs h-8"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1 text-primary" />
                {filteredUsers.every((u) => selectedUserIds.includes(u.id)) && filteredUsers.length > 0
                  ? "Deselect All"
                  : "Select All Filtered"}
              </Button>
              {selectedUserIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUserIds([])}
                  className="text-xs h-8 text-muted-foreground hover:text-foreground"
                >
                  Clear Selection
                </Button>
              )}
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search employee by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {roles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setSelectedRole(r.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedRole === r.key
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Grid */}
          <div className="max-h-60 overflow-y-auto p-1.5 rounded-xl border border-border/80 bg-background/50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {loading ? (
              <div className="col-span-full py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Loading employees...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
                No employees matching your criteria
              </div>
            ) : (
              filteredUsers.map((u) => {
                const isSelected = selectedUserIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggleUserSelection(u.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all cursor-pointer text-left select-none ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-xs"
                        : "bg-card border-border hover:border-primary/50 text-foreground"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors shrink-0 ${
                        isSelected
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30 bg-background"
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>

                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden shrink-0">
                      {u.image ? (
                        <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        u.name?.charAt(0).toUpperCase()
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate leading-tight">{u.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate capitalize">
                        {u.role?.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Step 2: Select Days */}
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-primary" />
              2. Select Online Days
            </label>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={selectWorkdays}
                className="text-primary hover:underline font-medium"
              >
                Sun - Thu
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={clearDays}
                className="text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS_CONFIG.map(({ key, labelEn, labelAr }) => {
              const isDaySelected = selectedDays.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(key)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs transition-all ${
                    isDaySelected
                      ? "bg-primary border-primary text-primary-foreground font-bold shadow-sm ring-2 ring-primary/20 scale-[1.02]"
                      : "bg-background border-border text-foreground hover:bg-muted/70"
                  }`}
                >
                  <span className="text-xs font-semibold">{labelEn}</span>
                  <span className="text-[10px] opacity-80 mt-0.5">{labelAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Action Button */}
        <div className="pt-4 border-t border-border flex items-center justify-end">
          <Button
            type="button"
            onClick={handleSaveAndNotify}
            disabled={saving || selectedUserIds.length === 0}
            className="w-full sm:w-auto h-10 px-6 font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Assigning & Notifying...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Assign Online Days & Notify ({selectedUserIds.length})
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Current Assignments Overview */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              Active Online Days Overview
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Employees who currently have remote work permissions configured.
            </p>
          </div>
        </div>

        <div className="divide-y divide-border rounded-xl border border-border overflow-hidden bg-background">
          {usersList.filter((u) => {
            const d = Array.isArray(u.online_days)
              ? u.online_days
              : typeof u.online_days === "string"
              ? JSON.parse(u.online_days || "[]")
              : [];
            return d.length > 0;
          }).length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No employees currently have custom online days assigned.
            </div>
          ) : (
            usersList
              .filter((u) => {
                let d = u.online_days || [];
                if (typeof d === "string") {
                  try {
                    d = JSON.parse(d);
                  } catch (e) {
                    d = [];
                  }
                }
                return Array.isArray(d) && d.length > 0;
              })
              .map((u) => {
                let d = u.online_days || [];
                if (typeof d === "string") {
                  try {
                    d = JSON.parse(d);
                  } catch (e) {
                    d = [];
                  }
                }
                return (
                  <div
                    key={u.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground overflow-hidden shrink-0">
                        {u.image ? (
                          <img src={u.image} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          u.name?.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground">{u.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-wrap gap-1">
                        {d.map((day) => (
                          <span
                            key={day}
                            className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold capitalize"
                          >
                            {day}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditUserDays(u)}
                          className="w-7 h-7 text-muted-foreground hover:text-foreground"
                          title="Edit days"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleClearSingleUser(u.id)}
                          className="w-7 h-7 text-muted-foreground hover:text-red-500"
                          title="Remove online days"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};
