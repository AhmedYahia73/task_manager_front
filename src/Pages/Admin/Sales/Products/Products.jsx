import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { toast } from "sonner";

const Products = () => {
    const navigate = useNavigate();

    // ---- Get Products Data ----
    const { data: response, loading: isLoading, refresh } = useGet("/api/admin/sales/products");

    // Extract array from Response
    const productsList = response?.data?.allProducts || response?.allProducts || response?.data?.products || response?.products || response?.data || [];

    const [productToDelete, setProductToDelete] = useState(null);
    const { mutate: deleteProduct, loading: isDeleting } = useMutation();

    // ---- Table Columns definition ----
    const columns = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "feez", header: "Feez" },
    ];

    // ---- 1. Edit ----
    const handleEdit = (row) => {
        navigate(`/products/${row.id}/edit/`, { state: row });
    };

    // ---- 2. Delete ----
    const handleDeleteClick = (row) => {
        setProductToDelete(row);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        const result = await deleteProduct({
            method: "DELETE",
            url: `/api/admin/sales/products/${productToDelete.id}`,
            showToast: false,
        });

        if (result.success) {
            toast.success("Product deleted successfully");
            setProductToDelete(null);
            refresh?.();
        } else {
            toast.error("Failed to delete product");
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            <DataTable
                title="Products Management"
                onAdd={() => navigate("/products/add")}
                columns={columns}
                data={productsList}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                showActions={true}
            />

            <DeleteDialog
                isOpen={!!productToDelete}
                onClose={() => setProductToDelete(null)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />
        </div>
    );
};

export default Products;
