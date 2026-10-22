import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { MapPin, StickyNote, Search, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { brandConfig } from "@/utils/brand";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";

const statusColors = {
    "Negotiation": "bg-yellow-100 text-yellow-800",
    "Sales": "bg-gray-100 text-gray-800",
    "Deliverd": "bg-green-100 text-green-800",
};

const Visits = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    // ---- Filter, Search & Pagination States ----
    const [page, setPage] = useState(1);
    const [selectedSalesFilter, setSelectedSalesFilter] = useState("");
    const [selectedStatusFilter, setSelectedStatusFilter] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    
    // ---- Month & Year Filter States ----
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedMonths, setSelectedMonths] = useState([]);

    const months = [
        { value: "01", label: "Jan" },
        { value: "02", label: "Feb" },
        { value: "03", label: "Mar" },
        { value: "04", label: "Apr" },
        { value: "05", label: "May" },
        { value: "06", label: "Jun" },
        { value: "07", label: "Jul" },
        { value: "08", label: "Aug" },
        { value: "09", label: "Sep" },
        { value: "10", label: "Oct" },
        { value: "11", label: "Nov" },
        { value: "12", label: "Dec" },
    ];

    const [selectedNotes, setSelectedNotes] = useState(null);

    // ---- Product Selection States ----
    const [productModalOpen, setProductModalOpen] = useState(false);
    const [pendingSalesStatusVisit, setPendingSalesStatusVisit] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([
        { product_id: "", duration: "" },
    ]);

    // ---- Get Products Data ----
    const { data: productsRes } = useGet("/api/admin/sales/products");
    const productsList = Array.isArray(productsRes?.data?.allProducts) ? productsRes.data.allProducts : 
                         Array.isArray(productsRes?.allProducts) ? productsRes.allProducts : 
                         Array.isArray(productsRes?.data?.products) ? productsRes.data.products : [];

    // ---- Debounce Search Logic ----
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // إعادة التعيين للصفحة الأولى عند كل بحث جديد
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    // ---- Build Query Parameters for Backend ----
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", "10");

    if (selectedSalesFilter) {
        queryParams.append("sales_id", selectedSalesFilter);
    }
    if (selectedStatusFilter) {
        queryParams.append("status_id", selectedStatusFilter);
    }

    if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
    }

    if (selectedMonths.length > 0 && selectedYear) {
        queryParams.append("months", selectedMonths.join(','));
        queryParams.append("year", selectedYear);
    }

    const visitsApiUrl = `/api/admin/sales/visits?${queryParams.toString()}`;

    // ---- Get Visits Data ----
    const { data: response, loading: isLoading, refresh } = useGet(visitsApiUrl);
    const visits = response?.data?.allVisits || response?.allVisits || response?.data || (Array.isArray(response) ? response : []);
    
    // استخراج بيانات الـ Pagination من الـ Response
    const paginationData = response?.data?.pagination || response?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

    // إعادة تعيين الصفحة إلى 1 عند تغيير الفلتر
    const handleFilterChange = (e) => {
        setSelectedSalesFilter(e.target.value);
        setPage(1); 
    };

    const handleStatusFilterChange = (e) => {
        setSelectedStatusFilter(e.target.value);
        setPage(1); 
    };

    // ---- Get Status & Sales Lists ----
    const { data: listsResponse } = useGet("/api/admin/sales/visits/lists");
    const statusList = listsResponse?.visit_status || listsResponse?.data?.visit_status || [];
    const sales_statues = ["visit", "sales", "delivered"];
    const salesList = listsResponse?.sales || listsResponse?.data?.sales || [];

    // ---- Mutations ----
    const { mutate: deleteVisit, loading: isDeleting } = useMutation();
    const { mutate: updateVisit } = useMutation();

    const [visitToDelete, setVisitToDelete] = useState(null);

    const handleDeleteClick = (visit) => {
        setVisitToDelete(visit);
    };

    const handleDeleteConfirm = async () => {
        if (!visitToDelete) return;

        const result = await deleteVisit({
            method: "DELETE",
            url: `/api/admin/sales/visits/${visitToDelete.id}`,
        });

        if (result.success) {
            toast?.success?.("Visit deleted successfully");
            setVisitToDelete(null);
            refresh?.();
        } else {
            toast?.error?.("Failed to delete visit");
        }
    };

    const handleStatusChange = async (visit, newStatusId) => {
        const payload = { status_id: newStatusId };
        const result = await updateVisit({
            method: "PUT",
            url: `/api/admin/sales/visits/${visit.id}`,
            data: payload,
        });

        if (result.success) {
            toast?.success?.("Status updated successfully");
            refresh?.();
        } else {
            toast?.error?.("Failed to update status");
        }
    };

    const handleSalesStatusChange = async (visit, newStatus) => {
        if (newStatus === "sales" || newStatus === "delivered") {
            setPendingSalesStatusVisit({ visit, targetStatus: newStatus });
            const existingProducts = Array.isArray(visit.products) && visit.products.length > 0
                ? visit.products.map((p) => ({
                    product_id: p.product_id || "",
                    duration: p.duration || "",
                }))
                : [{ product_id: "", duration: "" }];
            setSelectedProducts(existingProducts);
            setProductModalOpen(true);
            return;
        }

        const payload = { status: newStatus };
        const result = await updateVisit({
            method: "PUT",
            url: `/api/admin/sales/visits/${visit.id}`,
            data: payload,
        });

        if (result.success) {
            toast?.success?.("Status updated successfully");
            refresh?.();
        } else {
            toast?.error?.("Failed to update status");
        }
    };

    const confirmProductEnrollment = async () => {
        const validProducts = selectedProducts.filter(
            (p) => p.product_id && p.duration
        );
        if (!pendingSalesStatusVisit || validProducts.length === 0) {
            toast?.error?.("Please select at least one product and duration");
            return;
        }
        const visitObj = pendingSalesStatusVisit.visit || pendingSalesStatusVisit;
        const targetStatus = pendingSalesStatusVisit.targetStatus || "sales";
        const result = await updateVisit({
            method: "PUT",
            url: `/api/admin/sales/visits/${visitObj.id}`,
            data: { status: targetStatus, products: validProducts },
        });
        
        if (result.success) {
            toast.success("Status updated and products enrolled successfully");
            setProductModalOpen(false);
            setPendingSalesStatusVisit(null);
            refresh?.();
        } else {
            toast.error("Failed to update status and enroll products");
        }
    };

    const handleSalesChange = async (visit, newSalesId) => {
        const payload = { sales_id: newSalesId };
        const result = await updateVisit({
            method: "PUT",
            url: `/api/admin/sales/visits/${visit.id}`,
            data: payload,
        });

        if (result.success) {
            toast?.success?.("Sales updated successfully");
            refresh?.();
        } else {
            toast?.error?.("Failed to update sales");
        }
    };

    const columns = [
        { accessorKey: "name", header: "Name" },
        { 
            accessorKey: "owner_name", 
            header: "Owner Name",
            render: (row) => row.owner_name || <span className="text-gray-400">-</span>
        },
        { accessorKey: "address", header: "Address" },
        { accessorKey: "phone", header: "Phone" },
        { 
            accessorKey: "owner_phone", 
            header: "Owner Phone",
            render: (row) => row.owner_phone || <span className="text-gray-400">-</span>
        },
        {
            accessorKey: "product",
            header: "Products",
            render: (row) => {
                if (Array.isArray(row.products) && row.products.length > 0) {
                    return (
                        <div className="flex flex-wrap gap-1">
                            {row.products.map((p, idx) => (
                                <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
                                >
                                    {p.product_name || p.product_id}
                                    {p.duration ? ` (${p.duration})` : ""}
                                </span>
                            ))}
                        </div>
                    );
                }
                return row.product || <span className="text-gray-400">-</span>;
            },
        },
        { accessorKey: "createdAt", header: "Date" }, 
        {
            accessorKey: "visit_status",
            header: "Status",
            render: (row) => {
                const currentStatus = statusList.find((s) => s.name === row.visit_status);
                const currentStatusId = currentStatus ? currentStatus.id : row.status_id || "";

                return (
                    <select
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors ${
                            statusColors[row.visit_status] || "bg-gray-100 text-gray-800"
                        }`}
                        value={currentStatusId}
                        onChange={(e) => {
                            if (e.target.value) handleStatusChange(row, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>Select Status</option>
                        {statusList.map((s) => (
                            <option key={s.id} value={s.id} className="bg-white text-black">
                                {s.name}
                            </option>
                        ))}
                    </select>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Sales Status",
            render: (row) => {
                const currentStatus = sales_statues.find((s) => s === row.status);
                const currentStatusId = currentStatus || row.status || "";

                return (
                    <select
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors ${
                            statusColors[row.status] || "bg-gray-100 text-gray-800"
                        }`}
                        value={currentStatusId}
                        onChange={(e) => {
                            if (e.target.value) handleSalesStatusChange(row, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>Select Status</option>
                        {sales_statues.map((s) => (
                            <option key={s} value={s} className="bg-white text-black">
                                {s}
                            </option>
                        ))}
                    </select>
                );
            },
        },
        {
            accessorKey: "sales",
            header: "Sales",
            render: (row) => {
                const currentSales = salesList.find((s) => s.name === row.sales);
                const currentSalesId = currentSales ? currentSales.id : row.sales_id || "";

                return (
                    <select
                        className="px-2 py-1 rounded-full text-xs font-medium border border-gray-200 bg-white cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors text-gray-800"
                        value={currentSalesId}
                        onChange={(e) => {
                            if (e.target.value) handleSalesChange(row, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="" disabled>Select Sales</option>
                        {salesList.map((s) => (
                            <option key={s.id} value={s.id} className="bg-white text-black">
                                {s.name}
                            </option>
                        ))}
                    </select>
                );
            },
        },
        {
            accessorKey: "notes",
            header: "Notes",
            render: (row) => {
                if (!row.notes) return <span className="text-gray-400">-</span>;

                return (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs gap-1.5"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNotes({
                                name: row.name,
                                notes: row.notes,
                            });
                        }}
                    >
                        <StickyNote className="h-3.5 w-3.5 text-blue-500" />
                        View Notes
                    </Button>
                );
            },
        },
        {
            accessorKey: "map_link",
            header: "Map",
            render: (row) => (
                <a
                    href={row.map_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-500 hover:underline flex items-center gap-1"
                >
                    <MapPin className="h-4 w-4" /> View
                </a>
            ),
        },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-2 sm:py-6 space-y-4 sm:space-y-6">
            <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 mb-2">
                {/* Left Side: Filters */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
                    {/* Year & Month Filter */}
                    <div className="bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs flex flex-col gap-3 sm:gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label htmlFor="year-filter" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                Filter by Year:
                            </label>
                            <select
                                id="year-filter"
                                className="border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full sm:w-auto sm:min-w-[130px]"
                                value={selectedYear}
                                onChange={(e) => {
                                    setSelectedYear(e.target.value);
                                    setPage(1);
                                }}
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <button
                                type="button"
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${selectedMonths.length === 0 ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700"}`}
                                onClick={() => { setSelectedMonths([]); setPage(1); }}
                            >
                                All Months
                            </button>
                            {months.map(m => {
                                const isSelected = selectedMonths.includes(m.value);
                                return (
                                    <button
                                        type="button"
                                        key={m.value}
                                        className={`px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${isSelected ? "bg-primary text-primary-foreground font-semibold shadow-xs" : "bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-700"}`}
                                        onClick={() => { 
                                            if (isSelected) {
                                                setSelectedMonths(selectedMonths.filter(x => x !== m.value));
                                            } else {
                                                setSelectedMonths([...selectedMonths, m.value]);
                                            }
                                            setPage(1);
                                        }}
                                    >
                                        {m.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Controls Section: Filter & Search */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                        {/* Sales Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="sales-filter" className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                Filter by Sales:
                            </label>
                            <select
                                id="sales-filter"
                                className="border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full"
                                value={selectedSalesFilter}
                                onChange={handleFilterChange}
                            >
                                <option value="">All Sales (Show All)</option>
                                {salesList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor="status-filter" className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                Filter by Status:
                            </label>
                            <select
                                id="status-filter"
                                className="border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full"
                                value={selectedStatusFilter}
                                onChange={handleStatusFilterChange}
                            >
                                <option value="">All Statuses (Show All)</option>
                                {statusList.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Search Input (Backend Search) */}
                        <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                            <label htmlFor="search-filter" className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
                                Search Visits:
                            </label>
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    id="search-filter"
                                    type="text"
                                    placeholder="Search by name, phone or address..."
                                    className="pl-9 h-9.5 text-xs sm:text-sm w-full"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Total Visits Overview */}
                <div className="w-full xl:w-64 shrink-0 flex items-stretch">
                    <div className={`${brandConfig.overviewCardClass} w-full flex-row xl:flex-col items-center justify-between xl:justify-center p-4 sm:p-6`}>
                        <div className={`${brandConfig.overviewIconWrapperClass} mb-0 xl:mb-4 shrink-0`}>
                            <MapPin className={brandConfig.overviewIconClass} />
                        </div>
                        <p className="text-3xl sm:text-4xl xl:text-5xl font-extrabold leading-none mb-1">{paginationData.total}</p>
                        <h2 className={brandConfig.overviewLabelClass}>Total Visits</h2>
                    </div>
                </div>
            </div>

            <DataTable
                title="Visits Management"
                onAdd={() => navigate(projectId ? `/admin/sales-projects/${projectId}/visits/add` : "add")}
                onDelete={handleDeleteClick}
                onEdit={(row) => navigate(projectId ? `/admin/sales-projects/${projectId}/visits/${row.id}/edit` : `${row.id}/edit`, { state: { visitData: row } })}
                columns={columns}
                data={visits}
                isLoading={isLoading}
                search_auto={false} // إيقاف الفلترة المحلية ليعتمد كلياً على الـ Backend
            />

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 text-center sm:text-left">
                    Showing page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{paginationData.page}</span> of{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{paginationData.totalPages || 1}</span> (Total: {paginationData.total})
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.max(old - 1, 1))}
                        disabled={page === 1 || isLoading}
                        className="flex-1 sm:flex-initial"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.min(old + 1, paginationData.totalPages))}
                        disabled={page >= paginationData.totalPages || isLoading}
                        className="flex-1 sm:flex-initial"
                    >
                        Next
                    </Button>
                </div>
            </div>

            {/* Product Enrollment Dialog (Multi-Products) */}
            <Dialog open={productModalOpen} onOpenChange={setProductModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Enroll Products for Sales</DialogTitle>
                        <DialogDescription>
                            Select one or more products and their durations to calculate points for this sale.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
                        {selectedProducts.map((item, idx) => {
                            const productObj = productsList.find(
                                (p) => p.id === item.product_id
                            );
                            let pointsData = productObj?.points || [];
                            if (typeof pointsData === "string") {
                                try {
                                    pointsData = JSON.parse(pointsData);
                                } catch {
                                    pointsData = [];
                                }
                            }

                            return (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-md border"
                                >
                                    <select
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={item.product_id}
                                        onChange={(e) => {
                                            const updated = [...selectedProducts];
                                            updated[idx] = {
                                                product_id: e.target.value,
                                                duration: "",
                                            };
                                            setSelectedProducts(updated);
                                        }}
                                    >
                                        <option value="">Select Product</option>
                                        {productsList.map((p) => (
                                            <option key={p.id} value={p.id}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </select>

                                    <select
                                        className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        value={item.duration}
                                        disabled={!item.product_id}
                                        onChange={(e) => {
                                            const updated = [...selectedProducts];
                                            updated[idx] = {
                                                ...updated[idx],
                                                duration: e.target.value,
                                            };
                                            setSelectedProducts(updated);
                                        }}
                                    >
                                        <option value="">Select Duration</option>
                                        {Array.isArray(pointsData) &&
                                            pointsData.map((p) => (
                                                <option
                                                    key={p.duration}
                                                    value={p.duration}
                                                >
                                                    {p.duration} ({p.point} pts)
                                                </option>
                                            ))}
                                    </select>

                                    {selectedProducts.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700"
                                            onClick={() =>
                                                setSelectedProducts(
                                                    selectedProducts.filter(
                                                        (_, i) => i !== idx
                                                    )
                                                )
                                            }
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            );
                        })}

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                                setSelectedProducts([
                                    ...selectedProducts,
                                    { product_id: "", duration: "" },
                                ])
                            }
                            className="w-full flex items-center justify-center gap-1"
                        >
                            <Plus className="h-4 w-4" /> Add Another Product
                        </Button>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setProductModalOpen(false)}>Cancel</Button>
                        <Button onClick={confirmProductEnrollment}>Confirm</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <DeleteDialog
                isOpen={!!visitToDelete}
                onClose={() => setVisitToDelete(null)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />

            {/* PopUp / Modal لعرض الـ Notes */}
            <Dialog open={!!selectedNotes} onOpenChange={() => setSelectedNotes(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <StickyNote className="h-5 w-5 text-primary" />
                            Visit Notes - {selectedNotes?.name}
                        </DialogTitle>
                        <DialogDescription className="pt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                            {selectedNotes?.notes}
                        </DialogDescription>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Visits;