import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { toast } from "sonner";

const VisitStatus = () => {
    const navigate = useNavigate();

    // ---- Get Data ----
    const { data: response, loading: isLoading, refresh } = useGet("/api/admin/sales/visit_status");

    // 💡 سحب البيانات من allVisitStatuss بناءً على الريسبونس بتاعك
    const visitStatuses = response?.data?.allVisitStatuss || response?.allVisitStatuss || [];

    const [visitStatusToDelete, setVisitStatusToDelete] = useState(null);
    const { mutate: deleteVisitStatus, loading: isDeleting } = useMutation();

    // ---- Delete Function ----
    const handleDeleteClick = (row) => {
        setVisitStatusToDelete(row);
    };

    const handleDeleteConfirm = async () => {
        if (!visitStatusToDelete) return;

        const result = await deleteVisitStatus({
            method: "DELETE",
            url: `/api/admin/sales/visit_status/${visitStatusToDelete.id}`,
            showToast: false,
        });

        if (result.success) {
            toast.success("Visit status deleted successfully");
            setVisitStatusToDelete(null);
            refresh?.();
        } else {
            toast.error("Failed to delete visit status");
        }
    };

    // ---- Table Columns definition ----
    const columns = [
        { accessorKey: "name", header: "Name" },
        {
            accessorKey: "status",
            header: "Status",
            render: (row) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                    // 💡 التحقق من قيمة البولين (true / false)
                    row.status === true || row.status === "true"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                }`}>
                    {row.status ? "Active" : "Inactive"}
                </span>
            ),
        },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            <DataTable
                title="Visit Status Management"
                onAdd={() => navigate("/visitstatus/add")}
                showActions={true}
                onEdit={(row) => navigate(`/visitstatus/${row.id}/edit`)}
                onDelete={handleDeleteClick}
                columns={columns}
                data={visitStatuses}
                isLoading={isLoading}
            />

            <DeleteDialog
                isOpen={!!visitStatusToDelete}
                onClose={() => setVisitStatusToDelete(null)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />
        </div>
    );
};

export default VisitStatus;