import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { toast } from "sonner";

const Target = () => {
    const navigate = useNavigate();

    // ---- Get Target Data ----
    const { data: response, loading: isLoading, refresh } = useGet("/api/admin/sales/target");

    // استخراج المصفوفة بناءً على الـ Response
    const targetList = response?.data?.targets || response?.targets || response?.data || [];

    const [targetToDelete, setTargetToDelete] = useState(null);
    const { mutate: deleteTarget, loading: isDeleting } = useMutation();

    // ---- Table Columns definition ----
    const columns = [
        { accessorKey: "name", header: "Name" },
        {
            accessorKey: "type",
            header: "Type",
            render: (row) => (
                <span className="capitalize px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    {row.type}
                </span>
            )
        },
    ];

    // ---- 1. دالة التعديل (Edit) ----
    const handleEdit = (row) => {
        navigate(`/target/${row.id}/edit/`, { state: row });
    };

    // ---- 2. دالة الحذف (Delete) ----
    const handleDeleteClick = (row) => {
        setTargetToDelete(row);
    };

    const handleDeleteConfirm = async () => {
        if (!targetToDelete) return;

        const result = await deleteTarget({
            method: "DELETE",
            url: `/api/admin/sales/target/${targetToDelete.id}`,
            showToast: false,
        });

        if (result.success) {
            toast.success("Target deleted successfully");
            setTargetToDelete(null);
            refresh?.();
        } else {
            toast.error("Failed to delete target");
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            <DataTable
                title="Target Management"
                onAdd={() => navigate("/target/add")}
                columns={columns}
                data={targetList}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                showActions={true}
            />

            <DeleteDialog
                isOpen={!!targetToDelete}
                onClose={() => setTargetToDelete(null)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />
        </div>
    );
};

export default Target;