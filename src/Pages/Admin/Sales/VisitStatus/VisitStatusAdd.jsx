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
import { Controller } from "react-hook-form";
import { useGet } from "@/hooks/useGet";
import { Loader2 } from "lucide-react";

const VisitStatusAdd = () => {
    const { id } = useParams();

    const { data: response, loading: isLoadingData } = useGet(
        id ? `/api/admin/sales/visit_status/${id}` : null,
        Boolean(id)
    );

    // استخراج الداتا في حالة التعديل
    const fetchedData =
        response?.data?.VisitStatuss ||
        response?.VisitStatuss ||
        response?.data ||
        response;

    if (id && isLoadingData) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <AddPage
            title="Visit Status"
            apiUrl="/api/admin/sales/visit_status"
            initialData={
                id && fetchedData
                    ? {
                        ...fetchedData,
                        // تحويلها لنص عشان قائمة الـ Select تقرأها بشكل صحيح في واجهة التعديل
                        status: fetchedData.status === false ? "false" : "true"
                    }
                    : {
                        name: "",
                        status: "true", // القيمة الافتراضية
                    }
            }
            transformPayload={(data) => {
                // 💡 تجميع الـ Body المطلوب إرساله للباك إند
                return {
                    name: data.name || "",
                    // تحويل الـ status لـ Boolean حقيقي (true/false) مش String
                    status: data.status === "true" || data.status === true,
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

                return (
                    <div className="mt-2 space-y-6">
                        <div className="space-y-5">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                                Status Details
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {/* 1. Name Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Name *</Label>
                                    <Input
                                        {...register("name", { required: "Name is required" })}
                                        placeholder="e.g. Completed"
                                        className="h-10 text-sm rounded-md"
                                    />
                                    {errors.name && <span className="text-xs text-red-500">{errors.name.message}</span>}
                                </div>

                                {/* 2. Status Field */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Controller
                                        name="status"
                                        control={control}
                                        defaultValue="true"
                                        render={({ field }) => (
                                            <Select
                                                onValueChange={field.onChange}
                                                // التأكد إن القيمة الممررة دايماً String عشان الـ Select
                                                value={String(field.value)} 
                                            >
                                                <SelectTrigger className="h-10 text-sm rounded-md">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="true">Active (True)</SelectItem>
                                                    <SelectItem value="false">Inactive (False)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
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

export default VisitStatusAdd;