import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { Search, ArrowRightLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import MapComponent from "@/components/MapComponent";
import { getDurationsForProduct } from "@/Pages/Admin/Sales/Visits/VisitsAdd";
import { toast } from "sonner";

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const WishList = () => {
    const navigate = useNavigate();
    const { projectId } = useParams();

    // ---- Search & Pagination States ----
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [page, setPage] = useState(1);

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
    if (projectId) {
        queryParams.append("sales_project_id", projectId);
    }
    queryParams.append("page", page.toString());
    queryParams.append("limit", "10");

    if (debouncedSearch.trim()) {
        queryParams.append("search", debouncedSearch.trim());
    }

    const wishListApiUrl = `/api/admin/sales/wish_list?${queryParams.toString()}`;

    // ---- Fetch Data ----
    const { data: response, loading: isLoading, refresh } = useGet(wishListApiUrl);

    const wish_list = response?.data?.allWishLists || response?.allWishLists || [];
    const paginationData = response?.data?.pagination || response?.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };

    // ---- Fetch Lists (sales, visit_status, products) ----
    const listsUrl = projectId
        ? `/api/admin/sales/wish_list/lists?sales_project_id=${projectId}`
        : "/api/admin/sales/wish_list/lists";
    const { data: listsResponse } = useGet(listsUrl);
    const visitStatusList =
        listsResponse?.visit_status || listsResponse?.data?.visit_status || [];
    const salesList =
        listsResponse?.sales || listsResponse?.data?.sales || [];
    const productsList =
        listsResponse?.products || listsResponse?.data?.products || [];

    const statusItems = React.useMemo(() => {
        return visitStatusList.map((st) => ({
            value: String(st.id),
            label: st.name,
        }));
    }, [visitStatusList]);

    const salesItems = React.useMemo(() => {
        return salesList.map((s) => ({
            value: String(s.id),
            label: s.name,
        }));
    }, [salesList]);

    const productsItems = React.useMemo(() => {
        return productsList.map((p) => ({
            value: String(p.id),
            label: p.name,
        }));
    }, [productsList]);

    const [wishListToDelete, setWishListToDelete] = useState(null);
    const { mutate: deleteWishList, loading: isDeleting } = useMutation();

    // ---- Convert WishList to Visit State ----
    const [wishListToConvert, setWishListToConvert] = useState(null);
    const [convertForm, setConvertForm] = useState({
        phone: "",
        status_id: "",
        sales_id: "",
        owner_name: "",
        owner_phone: "",
        notes: "",
        address: "",
        lat: DEFAULT_CENTER.lat,
        lng: DEFAULT_CENTER.lng,
        products: [],
    });
    const { mutate: convertWishList, loading: isConverting } = useMutation();

    const selectedConvertStatus = React.useMemo(() => {
        return visitStatusList.find((st) => String(st.id) === String(convertForm.status_id));
    }, [visitStatusList, convertForm.status_id]);

    const handleOpenConvertModal = (row) => {
        setWishListToConvert(row);
        setConvertForm({
            phone: "",
            status_id: visitStatusList?.[0]?.id || "",
            owner_name: "",
            owner_phone: "",
            notes: row.description || "",
            address: "",
            lat: DEFAULT_CENTER.lat,
            lng: DEFAULT_CENTER.lng,
            products: [],
        });
    };

    const handleAddProduct = () => {
        setConvertForm((prev) => ({
            ...prev,
            products: [...prev.products, { product_id: "", duration: "" }],
        }));
    };

    const handleRemoveProduct = (index) => {
        setConvertForm((prev) => ({
            ...prev,
            products: prev.products.filter((_, i) => i !== index),
        }));
    };

    const handleProductChange = (index, field, value) => {
        setConvertForm((prev) => {
            const updated = [...prev.products];
            updated[index] = {
                ...updated[index],
                [field]: value,
                ...(field === "product_id" ? { duration: "" } : {}),
            };
            return { ...prev, products: updated };
        });
    };

    const handleConvertConfirm = async () => {
        if (!wishListToConvert) return;

        if (!convertForm.phone.trim()) {
            toast.error("Phone is required");
            return;
        }
        if (!convertForm.status_id) {
            toast.error("Please select a visit status");
            return;
        }
        if (!convertForm.address.trim()) {
            toast.error("Address is required (select on map or type address)");
            return;
        }

        for (const p of convertForm.products) {
            if (!p.product_id || !p.duration) {
                toast.error("Please select both product and duration for each added product");
                return;
            }
        }

        const result = await convertWishList({
            method: "POST",
            url: `/api/admin/sales/wish_list/${wishListToConvert.id}/convert`,
            data: {
                phone: convertForm.phone.trim(),
                status_id: convertForm.status_id,
                owner_name: convertForm.owner_name.trim() || undefined,
                owner_phone: convertForm.owner_phone.trim() || undefined,
                notes: convertForm.notes.trim() || undefined,
                address: convertForm.address.trim(),
                lat: Number(convertForm.lat),
                lng: Number(convertForm.lng),
                products: convertForm.products.filter((p) => p.product_id && p.duration),
            },
        });

        if (result.success) {
            toast.success("Wish list converted to visit successfully");
            setWishListToConvert(null);
            refresh?.();
        } else {
            toast.error("Failed to convert wish list to visit");
        }
    };

    // ---- Table Columns Definition ----
    const columns = [
        { accessorKey: "name", header: "Name" },
        { accessorKey: "description", header: "Description" },
        {
            accessorKey: "sales",
            header: "Sales",
            render: (row) => {
                const sObj = salesList.find(
                    (s) => String(s.id) === String(row.sales_id) || String(s.id) === String(row.sales)
                );
                return sObj ? sObj.name : (row.sales || "-");
            },
        },
        {
            accessorKey: "convert",
            header: "Convert",
            render: (row) => (
                <Button
                    variant="outline"
                    size="sm"
                    disabled={isConverting}
                    className="h-8 text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleOpenConvertModal(row);
                    }}
                >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    To Visit
                </Button>
            ),
        },
    ];

    // ---- Actions ----
    const handleEdit = (row) => {
        navigate(`${row.id}/edit`, { state: row });
    };

    const handleDeleteClick = (row) => {
        setWishListToDelete(row);
    };

    const handleDeleteConfirm = async () => {
        if (!wishListToDelete) return;

        const result = await deleteWishList({
            method: "DELETE",
            url: `/api/admin/sales/wish_list/${wishListToDelete.id}`,
            showToast: false,
        });

        if (result.success) {
            toast.success("Wish list deleted successfully");
            setWishListToDelete(null);
            refresh?.();
        } else {
            toast.error("Failed to delete wish list");
        }
    };

    const mapFormAdapter = {
        watch: (field) => (field === "address" ? convertForm.address : convertForm[field]),
        setValue: (field, val) =>
            setConvertForm((prev) => ({ ...prev, [field]: val })),
    };

    return (
        <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
            {/* Controls Section: Search Bar */}
            <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search wish list by name or description..."
                        className="pl-9 h-10 w-full text-xs sm:text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <DataTable
                title="Wish List Management"
                onAdd={() => navigate("add")}
                columns={columns}
                data={wish_list}
                isLoading={isLoading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                search_auto={false}
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

            <DeleteDialog
                isOpen={!!wishListToDelete}
                onClose={() => setWishListToDelete(null)}
                onConfirm={handleDeleteConfirm}
                loading={isDeleting}
            />

            {/* Convert WishList to Visit Dialog */}
            <Dialog
                open={!!wishListToConvert}
                onOpenChange={(open) => {
                    if (!open) setWishListToConvert(null);
                }}
            >
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
                            Convert Wish List to Visit
                        </DialogTitle>
                        <DialogDescription className="pt-1 text-sm text-gray-600">
                            Enter the additional visit details for{" "}
                            <span className="font-semibold text-gray-900">
                                {wishListToConvert?.name}
                            </span>
                            {wishListToConvert?.sales || wishListToConvert?.sales_id ? (
                                <>
                                    {" "}
                                    (Sales:{" "}
                                    <span className="font-semibold text-gray-900">
                                        {salesList.find((s) => String(s.id) === String(wishListToConvert?.sales_id) || String(s.id) === String(wishListToConvert?.sales))?.name || wishListToConvert.sales}
                                    </span>
                                    )
                                </>
                            ) : null}
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Phone *</Label>
                                <Input
                                    type="tel"
                                    placeholder="e.g. 01012345678"
                                    value={convertForm.phone}
                                    onChange={(e) =>
                                        setConvertForm((prev) => ({
                                            ...prev,
                                            phone: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">Visit Status *</Label>
                                <Select
                                    items={statusItems}
                                    value={convertForm.status_id ? String(convertForm.status_id) : null}
                                    onValueChange={(val) =>
                                        setConvertForm((prev) => ({
                                            ...prev,
                                            status_id: val || "",
                                        }))
                                    }
                                >
                                    <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white h-10">
                                        <SelectValue placeholder="Select Visit Status">
                                            {selectedConvertStatus?.name}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="z-[9999] bg-white">
                                        {visitStatusList.map((st) => (
                                            <SelectItem key={st.id} value={String(st.id)}>
                                                {st.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">
                                    Owner Name{" "}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (Optional)
                                    </span>
                                </Label>
                                <Input
                                    placeholder="Owner / Place Name"
                                    value={convertForm.owner_name}
                                    onChange={(e) =>
                                        setConvertForm((prev) => ({
                                            ...prev,
                                            owner_name: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-sm font-medium">
                                    Owner Phone{" "}
                                    <span className="text-xs text-muted-foreground font-normal">
                                        (Optional)
                                    </span>
                                </Label>
                                <Input
                                    type="tel"
                                    placeholder="Owner / Place Phone"
                                    value={convertForm.owner_phone}
                                    onChange={(e) =>
                                        setConvertForm((prev) => ({
                                            ...prev,
                                            owner_phone: e.target.value,
                                        }))
                                    }
                                />
                            </div>
                        </div>

                        {/* Multi-Products Section */}
                        <div className="space-y-3 pt-2 border-t">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">
                                    Products (Optional)
                                </Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleAddProduct}
                                    className="flex items-center gap-1"
                                >
                                    <Plus className="h-4 w-4" /> Add Product
                                </Button>
                            </div>

                            {convertForm.products.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    No products added yet. Click &quot;Add Product&quot; to attach products to this visit.
                                </p>
                            )}

                            <div className="space-y-2">
                                {convertForm.products.map((item, idx) => {
                                    const availableDurations = getDurationsForProduct(
                                        productsList,
                                        item.product_id
                                    );
                                    return (
                                        <div
                                            key={idx}
                                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-gray-50 p-2.5 rounded-md border"
                                        >
                                            <div className="sm:col-span-6 space-y-1">
                                                <Label className="text-xs text-muted-foreground">
                                                    Product *
                                                </Label>
                                                <Select
                                                    items={productsItems}
                                                    value={item.product_id ? String(item.product_id) : null}
                                                    onValueChange={(val) =>
                                                        handleProductChange(
                                                            idx,
                                                            "product_id",
                                                            val || ""
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 text-sm bg-white h-9">
                                                        <SelectValue placeholder="Select Product">
                                                            {productsList.find((p) => String(p.id) === String(item.product_id))?.name}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999] bg-white">
                                                        {productsList.map((p) => (
                                                            <SelectItem key={p.id} value={String(p.id)}>
                                                                {p.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="sm:col-span-5 space-y-1">
                                                <Label className="text-xs text-muted-foreground">
                                                    Duration *
                                                </Label>
                                                <Select
                                                    items={availableDurations.map((d) => ({ value: d, label: d }))}
                                                    value={item.duration || null}
                                                    disabled={!item.product_id}
                                                    onValueChange={(val) =>
                                                        handleProductChange(
                                                            idx,
                                                            "duration",
                                                            val || ""
                                                        )
                                                    }
                                                >
                                                    <SelectTrigger className="w-full border border-gray-300 rounded-md px-3 text-sm bg-white h-9">
                                                        <SelectValue
                                                            placeholder={
                                                                !item.product_id
                                                                    ? "Select product first"
                                                                    : availableDurations.length === 0
                                                                    ? "No durations"
                                                                    : "Select Duration"
                                                            }
                                                        >
                                                            {item.duration || undefined}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent className="z-[9999] bg-white">
                                                        {availableDurations.map((d) => (
                                                            <SelectItem key={d} value={d}>
                                                                {d}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="sm:col-span-1 flex justify-end">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveProduct(idx)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-9 w-9"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="space-y-1.5">
                            <Label className="text-sm font-medium">Notes</Label>
                            <Textarea
                                placeholder="Any extra notes about the visit..."
                                value={convertForm.notes}
                                onChange={(e) =>
                                    setConvertForm((prev) => ({
                                        ...prev,
                                        notes: e.target.value,
                                    }))
                                }
                                className="min-h-[75px]"
                            />
                        </div>

                        {/* Location / Map */}
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="text-sm font-semibold">Location *</Label>
                            <MapComponent
                                selectedLocation={{
                                    lat: convertForm.lat,
                                    lng: convertForm.lng,
                                }}
                                setSelectedLocation={({ lat, lng }) =>
                                    setConvertForm((prev) => ({ ...prev, lat, lng }))
                                }
                                locationName={convertForm.address}
                                setLocationName={(addr) =>
                                    setConvertForm((prev) => ({ ...prev, address: addr }))
                                }
                                form={mapFormAdapter}
                                onMarkerDragEnd={(e) => {
                                    const { lat, lng } = e.target.getLatLng();
                                    setConvertForm((prev) => ({ ...prev, lat, lng }));
                                }}
                                isMapClickEnabled={true}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-3 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setWishListToConvert(null)}
                                disabled={isConverting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={handleConvertConfirm}
                                disabled={isConverting}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                {isConverting ? "Converting..." : "Convert to Visit"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default WishList;