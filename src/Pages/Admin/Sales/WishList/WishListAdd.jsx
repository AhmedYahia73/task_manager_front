import React, { useState } from "react";
import AddPage from "@/components/AddPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { useParams } from "react-router-dom";
import { useGet } from "@/hooks/useGet";
import { Loader2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const WishListAdd = () => {
    const { id } = useParams();
    const [openSales, setOpenSales] = useState(false);

    const { data: listsResponse, loading: isLoadingLists } = useGet(
        "/api/admin/sales/wish_list/lists"
    );
    const salesList =
        listsResponse?.data?.sales || listsResponse?.sales || [];

    const { data: response, loading: isLoadingData } = useGet(
        id ? `/api/admin/sales/wish_list/${id}` : null,
        Boolean(id)
    );

    const fetchedData = response?.data?.WishList || response;

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
            initialData={
                id && fetchedData
                    ? {
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

                                {/* 2. Sales Combobox */}
                                <div className="space-y-2 flex flex-col">
                                    <Label className="text-sm font-medium">Sales Representative</Label>
                                    <Popover open={openSales} onOpenChange={setOpenSales}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openSales}
                                                className={cn(
                                                    "w-full h-10 justify-between font-normal text-sm rounded-md",
                                                    !selectedSalesId && "text-muted-foreground"
                                                )}
                                            >
                                                {selectedSalesId
                                                    ? salesList.find((s) => s.id === selectedSalesId)?.name ||
                                                      "Select sales representative"
                                                    : "Select sales representative"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent
                                            className="w-[--radix-popover-trigger-width] p-0"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Search sales..." />
                                                <CommandList>
                                                    <CommandEmpty>No sales found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {salesList.map((salesItem) => (
                                                            <CommandItem
                                                                key={salesItem.id}
                                                                value={salesItem.name}
                                                                onSelect={() => {
                                                                    setValue(
                                                                        "sales_id",
                                                                        selectedSalesId === salesItem.id
                                                                            ? ""
                                                                            : salesItem.id,
                                                                        { shouldValidate: true }
                                                                    );
                                                                    setOpenSales(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedSalesId === salesItem.id
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {salesItem.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
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