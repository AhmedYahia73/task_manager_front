import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { toast } from "sonner";

const Products = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

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
        const prodId = row?.id || row?._id;
        if (!prodId) {
            toast.error("Product has an invalid ID");
            return;
        }
        if (projectId) {
            navigate(`/admin/sales-projects/${projectId}/products/${prodId}/edit`, { state: row });
        } else {
            navigate(`${prodId}/edit`, { state: row });
        }
    };

    // ---- 2. Add ----
    const handleAdd = () => {
        if (projectId) {
            navigate(`/admin/sales-projects/${projectId}/products/add`);
        } else {
            navigate("add");
        }
    };

    // ---- 3. Delete ----
    const handleDeleteClick = (row) => {
        setProductToDelete(row);
    };

    const handleDeleteConfirm = async () => {
        if (!productToDelete) return;

        const prodId = productToDelete.id || productToDelete._id || "";
        const result = await deleteProduct({
            method: "DELETE",
            url: prodId ? `/api/admin/sales/products/${prodId}` : `/api/admin/sales/products`,
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
                onAdd={handleAdd}
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
