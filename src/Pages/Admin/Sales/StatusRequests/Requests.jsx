import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from "sonner";

const statusColors = {
    "approve": "bg-green-100 text-green-800",
    "reject": "bg-red-100 text-red-800",
    "pending": "bg-yellow-100 text-yellow-800",
};

const Requests = () => {
    const navigate = useNavigate();

    // ---- Search & Pagination States ----
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

    // ---- Debounce Search Logic ----
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1); // العودة للصفحة الأولى عند كل بحث جديد
        }, 500);

        return () => clearTimeout(handler);
    }, [searchQuery]);

    // ---- Build Query Parameters for Backend ----
    const queryParams = new URLSearchParams();
    queryParams.append("page", page.toString());
    queryParams.append("limit", "10");

    if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
    }

    const requestsApiUrl = `/api/admin/sales/status_requests/pending?${queryParams.toString()}`;

    // ---- Get Requests Data ----
    const { data: response, loading: isLoading, refresh } = useGet(requestsApiUrl);

    // استخراج الداتا والـ pagination بناءً على الـ Response Schema
    const requests = response?.data?.pendingRequests || [];
    const paginationData = response?.data?.pagination || { 
        totalItems: 0, 
        totalPages: 1, 
        currentPage: 1, 
        limit: 10,
        hasNextPage: false,
        hasPrevPage: false
    };

    const { mutate: updateRequest } = useMutation();

    // ---- Update Status flow ----
    const handleStatusChange = async (requestItem, status) => {
        const payload = { status: status };
        const result = await updateRequest({
            method: "PUT",
            url: `/api/admin/sales/status_requests/status/${requestItem.id}`,
            data: payload,
        });

        if (result.success) {
            toast?.success?.("Status updated successfully");
            refresh?.();
        } else {
            toast?.error?.("Failed to update status");
        }
    };  

    const columns = [
        { accessorKey: "user_name", header: "Sales Name" },
        { accessorKey: "user_phone", header: "Sales Phone" },
        { accessorKey: "visit_name", header: "Visit" },
        { accessorKey: "from", header: "From Status" },
        { accessorKey: "to", header: "To Status" },
        { 
            accessorKey: "status",
            header: "Status",
            render: (row) => {
                return (
                    <select
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 cursor-pointer focus:ring-2 focus:ring-offset-1 transition-colors ${
                            statusColors[row.status] || "bg-yellow-100 text-yellow-800"
                        }`}
                        value={row.status || "pending"}
                        onChange={(e) => {
                            if (e.target.value) handleStatusChange(row, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <option value="pending" disabled>Pending</option> 
                        <option value="approve" className="bg-white text-black">
                            Approve
                        </option>
                        <option value="reject" className="bg-white text-black">
                            Reject
                        </option>
                    </select>
                );
            },
        }, 
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Controls Section: Search Bar */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search requests by sales name, phone, or visit..."
                        className="pl-9 h-10 w-full text-xs sm:text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                title="Requests Management"  
                columns={columns}
                data={requests}
                isLoading={isLoading}
                search_auto={false} // إيقاف الفلترة المحلية ليعتمد كلياً على الـ Backend
            />

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 bg-white dark:bg-zinc-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-zinc-400 text-center sm:text-left">
                    Showing page <span className="font-semibold text-zinc-900 dark:text-zinc-100">{paginationData.currentPage}</span> of{" "}
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">{paginationData.totalPages || 1}</span> (Total: {paginationData.totalItems})
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-center">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.max(old - 1, 1))}
                        disabled={!paginationData.hasPrevPage || page === 1 || isLoading}
                        className="flex-1 sm:flex-initial"
                    >
                        Previous
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((old) => Math.min(old + 1, paginationData.totalPages))}
                        disabled={!paginationData.hasNextPage || page >= paginationData.totalPages || isLoading}
                        className="flex-1 sm:flex-initial"
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Requests;