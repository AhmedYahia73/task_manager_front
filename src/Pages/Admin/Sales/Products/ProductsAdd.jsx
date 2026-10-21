import React from "react";
import { useParams } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Controller, useFieldArray } from "react-hook-form";
import { useGet } from "@/hooks/useGet";
import { Loader2, Plus, Trash2 } from "lucide-react";

const ProductsAdd = () => {
    const { id } = useParams();

    // Fetch product data if in edit mode
    const { data: response, loading: isLoadingData } = useGet(
        id ? `/api/admin/sales/products/${id}` : null,
        Boolean(id)
    );

    const fetchedData = response?.data?.product || response?.product || response?.data || response;

    if (id && isLoadingData) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AddPage
            title="Product"
            apiUrl="/api/admin/sales/products"
            method={id ? "PUT" : "POST"}
            initialData={
                id && fetchedData
                    ? {
                        id: fetchedData.id || id,
                        name: fetchedData.name,
                        feez: fetchedData.feez || 0,
                        description: fetchedData.description || "",
                        demo_link: fetchedData.demo_link || "",
                        points: fetchedData.points?.length > 0 
                            ? (typeof fetchedData.points === 'string' ? JSON.parse(fetchedData.points) : fetchedData.points) 
                            : [{ point: 0, duration: "monthly" }],
                    }
                    : {
                        name: "",
                        feez: 0,
                        description: "",
                        demo_link: "",
                        points: [{ point: 0, duration: "monthly" }],
                    }
            }
            transformPayload={(data) => {
                return {
                    name: data.name || "",
                    feez: Number(data.feez) || 0,
                    description: data.description || "",
                    demo_link: data.demo_link || "",
                    points: data.points?.map((item) => ({
                        point: Number(item.point),
                        duration: item.duration,
                    })) || [],
                };
            }}
            onSuccessAction={() => window.history.back()}
        >
            {(methods) => {
                const {
                    register,
                    control,
                    formState: { errors },
                } = methods;

                const { fields, append, remove } = useFieldArray({
                    control,
                    name: "points",
                });

                return (
                    <div className="mt-2 space-y-8">
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                                Product Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* Name Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name *</Label>
                                    <Input
                                        {...register("name", { required: "Name is required" })}
                                        placeholder="Product name"
                                        className="h-10 text-sm rounded-md"
                                    />
                                    {errors.name && (
                                        <span className="text-xs text-red-500">{errors.name.message}</span>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Feez</Label>
                                    <Input
                                        type="number"
                                        {...register("feez", { valueAsNumber: true })}
                                        placeholder="Product feez"
                                        className="h-10 text-sm rounded-md"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Demo Link</Label>
                                    <Input
                                        {...register("demo_link")}
                                        placeholder="Demo URL"
                                        className="h-10 text-sm rounded-md"
                                    />
                                </div>
                                <div className="space-y-2 col-span-1 sm:col-span-2">
                                    <Label className="text-sm font-medium">Description</Label>
                                    <Input
                                        {...register("description")}
                                        placeholder="Product description"
                                        className="h-10 text-sm rounded-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Points Field Array */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Points Details
                               </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ point: 0, duration: "monthly" })}
                                    className="h-8"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Point
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 border rounded-lg bg-gray-50/50 relative">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Point Value</Label>
                                            <Input
                                                type="number"
                                                {...register(`points.${index}.point`, { required: true, valueAsNumber: true })}
                                                placeholder="e.g. 100"
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Duration</Label>
                                            <Controller
                                                name={`points.${index}.duration`}
                                                control={control}
                                                defaultValue="monthly"
                                                rules={{ required: true }}
                                                render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger className="h-9">
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="monthly">Monthly</SelectItem>
                                                            <SelectItem value="quarterly">Quarterly</SelectItem>
                                                            <SelectItem value="biannual">Biannual</SelectItem>
                                                            <SelectItem value="yearly">Yearly</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                        </div>
                                        <div className="flex items-end pb-1">
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                onClick={() => remove(index)}
                                                disabled={fields.length === 1}
                                                className="h-9 w-9"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            }}
        </AddPage>
    );
};

export default ProductsAdd;
