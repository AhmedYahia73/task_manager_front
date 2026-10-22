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

const MONTHS = [
    { value: "1", label: "Jan" },
    { value: "2", label: "Feb" },
    { value: "3", label: "Mar" },
    { value: "4", label: "Apr" },
    { value: "5", label: "May" },
    { value: "6", label: "Jun" },
    { value: "7", label: "Jul" },
    { value: "8", label: "Aug" },
    { value: "9", label: "Sep" },
    { value: "10", label: "Oct" },
    { value: "11", label: "Nov" },
    { value: "12", label: "Dec" },
];

const TargetAdd = () => {
    const { id } = useParams();

    // 1. جلب بيانات التارجت في حالة التعديل
    const { data: response, loading: isLoadingData } = useGet(
        id ? `/api/admin/sales/target/${id}` : null,
        Boolean(id)
    );

    // 2. جلب قوائم المبيعات (Sales) عشان نعرضها كخيارات
    const { data: listsResponse, loading: isLoadingLists } = useGet("/api/admin/sales/target/sales/lists");
    const salesList = listsResponse?.data?.sales || listsResponse?.sales || [];

    const fetchedData = response?.data?.target || response?.target || response?.data || response;

    if ((id && isLoadingData) || isLoadingLists) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AddPage
            title="Target"
            apiUrl="/api/admin/sales/target"
            method={id ? "PUT" : "POST"}
            initialData={
                id && fetchedData
                    ? {
                        id: fetchedData.id || id,
                        name: fetchedData.name,
                        type: fetchedData.type,
                        // 💡 استخراج معرفات المستخدمين (user id) من الريسبونس عشان الفورم تقرأهم كـ مختارين
                        sales: fetchedData.sales?.map((sale) => 
                            typeof sale === "string" 
                                ? sale 
                                : (sale.id || sale.user_id || sale.user?.id)
                        ).filter(Boolean) || [],
                        items: fetchedData.items?.length > 0 
                            ? fetchedData.items.map((item) => ({
                                ...item,
                                month: String(item.month ?? 1),
                            }))
                            : [{ year: new Date().getFullYear(), month: String(new Date().getMonth() + 1), number: 0 }],
                    }
                    : {
                        name: "",
                        type: "visit", // القيمة الافتراضية
                        sales: [],
                        items: [{ year: new Date().getFullYear(), month: String(new Date().getMonth() + 1), number: 0 }],
                    }
            }
            // تحضير البيانات لتطابق الـ Body المطلوب (JSON)
            transformPayload={(data) => {
                return {
                    name: data.name || "",
                    type: data.type || "visit",
                    sales: Array.isArray(data.sales) ? data.sales : [data.sales].filter(Boolean),
                    // تجاهل الـ id اللي جاي من الجيت وإرسال القيم المطلوبة بس
                    items: data.items?.map((item) => ({
                        year: Number(item.year),
                        month: Number(item.month),
                        number: Number(item.number),
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
                    name: "items",
                });

                return (
                    <div className="mt-2 space-y-8">
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                                Target Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* 1. Name Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name *</Label>
                                    <Input
                                        {...register("name", { required: "Name is required" })}
                                        placeholder="e.g. Premium"
                                        className="h-10 text-sm rounded-md"
                                    />
                                    {errors.name && (
                                        <span className="text-xs text-red-500">{errors.name.message}</span>
                                    )}
                                </div>

                                {/* 2. Type Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Type *</Label>
                                    <Controller
                                        name="type"
                                        control={control}
                                        defaultValue="visit"
                                        rules={{ required: "Type is required" }}
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger className="w-full h-10 text-sm rounded-md">
                                                    <SelectValue placeholder="Select type">
                                                        {field.value === "sales"
                                                            ? "Sales"
                                                            : field.value === "points"
                                                              ? "Points"
                                                              : "Visit"}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="visit">Visit</SelectItem>
                                                    <SelectItem value="sales">Sales</SelectItem>
                                                    <SelectItem value="points">Points</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                    {errors.type && (
                                        <span className="text-xs text-red-500">{errors.type.message}</span>
                                    )}
                                </div>

                                {/* 3. Sales Field (List Select Style) */}
                                <div className="space-y-2 sm:col-span-2">
                                    <Label className="text-sm font-medium">Assign to Sales *</Label>
                                    <Controller
                                        name="sales"
                                        control={control}
                                        defaultValue={[]}
                                        rules={{
                                            validate: (val) =>
                                                (Array.isArray(val) && val.length > 0) ||
                                                "Select at least one sales",
                                        }}
                                        render={({ field }) => {
                                            const selectedSales = Array.isArray(field.value)
                                                ? field.value
                                                : [field.value].filter(Boolean);

                                            return (
                                                <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1 p-2 border border-input rounded-md bg-white shadow-sm">
                                                    {salesList.length > 0 ? (
                                                        salesList.map((sale) => {
                                                            const isChecked = selectedSales.includes(sale.id);
                                                            return (
                                                                <label
                                                                    key={sale.id}
                                                                    className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-2 rounded-md transition-colors"
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        value={sale.id}
                                                                        checked={isChecked}
                                                                        onChange={(e) => {
                                                                            const nextSales = e.target.checked
                                                                                ? [...selectedSales, sale.id]
                                                                                : selectedSales.filter((sId) => sId !== sale.id);
                                                                            field.onChange(nextSales);
                                                                        }}
                                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                                                    />
                                                                    <span className="text-sm font-medium text-gray-700">
                                                                        {sale.name}
                                                                    </span>
                                                                </label>
                                                            );
                                                        })
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground p-2">
                                                            No sales found.
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />
                                    {errors.sales && (
                                        <span className="text-xs text-red-500">{errors.sales.message}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ----------------- المصفوفة (Items) ----------------- */}
                        <div className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                                    Target Items (Schedule)
                                </h3>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => append({ year: new Date().getFullYear(), month: "1", number: 0 })}
                                    className="h-8"
                                >
                                    <Plus className="w-4 h-4 mr-1" /> Add Item
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 border rounded-lg bg-gray-50/50 relative">
                                        <div className="space-y-2">
                                            <Label className="text-xs">Year</Label>
                                            <Input
                                                type="number"
                                                {...register(`items.${index}.year`, { required: true, valueAsNumber: true })}
                                                placeholder="e.g. 2026"
                                                className="h-9 bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Month</Label>
                                            <Controller
                                                name={`items.${index}.month`}
                                                control={control}
                                                defaultValue="1"
                                                rules={{ required: true }}
                                                render={({ field: monthField }) => {
                                                    const selectedMonthVal = String(monthField.value || "1");
                                                    const selectedMonthLabel =
                                                        MONTHS.find((m) => m.value === selectedMonthVal)?.label || "Jan";
                                                    return (
                                                        <Select
                                                            items={MONTHS}
                                                            onValueChange={monthField.onChange}
                                                            value={selectedMonthVal}
                                                        >
                                                            <SelectTrigger className="w-full h-9 text-sm rounded-md bg-white">
                                                                <SelectValue placeholder="Select month">
                                                                    {selectedMonthLabel}
                                                                </SelectValue>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MONTHS.map((m) => (
                                                                    <SelectItem key={m.value} value={m.value}>
                                                                        {m.label}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    );
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Number (Value)</Label>
                                            <Input
                                                type="number"
                                                {...register(`items.${index}.number`, { required: true, valueAsNumber: true })}
                                                placeholder="e.g. 100"
                                                className="h-9 bg-white"
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

export default TargetAdd;