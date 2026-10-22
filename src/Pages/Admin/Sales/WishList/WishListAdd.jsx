import React from "react";
import AddPage from "@/components/AddPage";
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
import { useParams, useLocation } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { Loader2 } from "lucide-react";
import { getCurrentUser, isSalesRole } from "@/utils/auth";

const WishListAdd = () => {
    const { id, projectId } = useParams();
    const { state } = useLocation();
    const isEdit = Boolean(id);

    const currentUser = getCurrentUser();
    const isSales = isSalesRole(currentUser?.role);

    const listsUrl = projectId
        ? `/api/admin/sales/wish_list/lists?sales_project_id=${projectId}`
        : "/api/admin/sales/wish_list/lists";
    const { data: listsResponse, loading: isLoadingLists } = useGet(listsUrl);
    const salesList =
        listsResponse?.sales || listsResponse?.data?.sales || [];

    const salesItems = React.useMemo(() => {
        return salesList.map((s) => ({
            value: String(s.id),
            label: s.name,
        }));
    }, [salesList]);

    const { data: response, loading: isLoadingData } = useGet(
        isEdit ? `/api/admin/sales/wish_list/${id}` : null,
        isEdit
    );

    const fetchedData =
        response?.WishList ||
        response?.wishList ||
        response?.data?.WishList ||
        response?.data?.wishList ||
        response?.data ||
        response ||
        state;

    const initialData = React.useMemo(() => {
        const matchedSales = salesList.find(
            (s) => String(s.id) === String(fetchedData?.sales_id) || s.name === fetchedData?.sales || String(s.id) === String(fetchedData?.sales)
        );
        if (!isEdit) {
            return {
                name: "",
                description: "",
                sales_id: isSales ? (currentUser?.id || "") : "",
            };
        }
        return {
            id: fetchedData?.id || id,
            name: fetchedData?.name || "",
            description: fetchedData?.description || "",
            sales_id: isSales ? (currentUser?.id || "") : (fetchedData?.sales_id || matchedSales?.id || ""),
        };
    }, [isEdit, id, fetchedData, salesList, isSales, currentUser?.id]);

    if (isLoadingLists || (isEdit && isLoadingData && !fetchedData)) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AddPage
            title="Wish List"
            apiUrl="/api/admin/sales/wish_list"
            method={isEdit ? "PUT" : "POST"}
            initialData={initialData}
            transformPayload={(data) => ({
                ...data,
                sales_id: isSales ? (currentUser?.id || data.sales_id) : (data.sales_id ? data.sales_id : null),
                sales_project_id: projectId || undefined,
                description: data.description || null,
            })}
            onSuccessAction={() => window.history.back()}
        >
            {(methods) => {
                const {
                    register,
                    watch,
                    setValue,
                    formState: { errors },
                } = methods;

                const selectedSalesId = watch("sales_id");

                return (
                    <div className="mt-2 space-y-6">
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                                Wish List Details
                            </h3>

                            <div className="grid grid-cols-1 gap-5">
                                {/* 1. Name Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name *</Label>
                                    <Input
                                        {...register("name", { required: "Name is required" })}
                                        placeholder="e.g. Premium Products"
                                        className="h-10 text-sm rounded-md"
                                    />
                                    {errors.name && (
                                        <span className="text-xs text-red-500">
                                            {errors.name.message}
                                        </span>
                                    )}
                                </div>

                                {/* 2. Sales Field */}
                                {isSales ? (
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="text-sm font-medium">Sales Representative</Label>
                                        <div className="h-10 px-3 flex items-center rounded-md bg-muted/50 border border-border text-sm text-foreground font-medium">
                                            {currentUser?.name || "Assigned to Me"}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 flex flex-col">
                                        <Label className="text-sm font-medium">Sales Representative</Label>
                                        <Select
                                            items={salesItems}
                                            value={selectedSalesId ? String(selectedSalesId) : null}
                                            onValueChange={(val) => {
                                                setValue("sales_id", val || "", { shouldValidate: true });
                                            }}
                                        >
                                            <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                                                <SelectValue placeholder="Select sales representative">
                                                    {salesList.find((s) => String(s.id) === String(selectedSalesId))?.name}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="z-50 bg-white">
                                                {salesList.map((salesItem) => (
                                                    <SelectItem key={salesItem.id} value={String(salesItem.id)}>
                                                        {salesItem.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {/* 3. Description Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <Textarea
                                        {...register("description")}
                                        placeholder="e.g. High-value product wishlist"
                                        className="text-sm rounded-md min-h-[100px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            }}
        </AddPage>
    );
};

export default WishListAdd;
