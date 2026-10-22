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
import { useParams } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { Loader2 } from "lucide-react";

const WishListAdd = () => {
    const { id } = useParams();

    const { data: listsResponse, loading: isLoadingLists } = useGet(
        "/api/admin/sales/wish_list/lists"
    );
    const salesList =
        listsResponse?.sales || listsResponse?.data?.sales || [];

    const { data: response, loading: isLoadingData } = useGet(
        id ? `/api/admin/sales/wish_list/${id}` : null,
        Boolean(id)
    );

    const fetchedData = response?.data?.WishList || response?.data?.wishList || response?.WishList || response;

    if ((id && isLoadingData) || isLoadingLists) {
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
            method={id ? "PUT" : "POST"}
            initialData={
                id && fetchedData
                    ? {
                        id: fetchedData.id || id,
                        name: fetchedData.name || "",
                        description: fetchedData.description || "",
                        sales_id: fetchedData.sales_id || "",
                    }
                    : {
                        name: "",
                        description: "",
                        sales_id: "",
                    }
            }
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

                                {/* 2. Sales Select */}
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-sm font-medium">Sales Representative</Label>
                                    <Select
                                        value={selectedSalesId || ""}
                                        onValueChange={(val) => {
                                            setValue("sales_id", val, { shouldValidate: true });
                                        }}
                                    >
                                        <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                                            <SelectValue placeholder="Select sales representative" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {salesList.map((salesItem) => (
                                                <SelectItem key={salesItem.id} value={salesItem.id}>
                                                    {salesItem.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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