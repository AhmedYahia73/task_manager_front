import React, { useState } from "react";
import { useParams } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapComponent from "@/components/MapComponent";
import { getCurrentUser, isSalesRole } from "@/utils/auth";

// Shadcn UI & Icons Components
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useFieldArray } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDurationsForProduct } from "@/Pages/Admin/Sales/Visits/VisitsAdd";

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const LeadsAdd = () => {
  const { id, projectId } = useParams();
  const isEdit = !!id;

  const currentUser = getCurrentUser();
  const isSales = isSalesRole(currentUser?.role);

  const listsUrl = projectId
    ? `/api/admin/sales/leads/lists?sales_project_id=${projectId}`
    : "/api/admin/sales/leads/lists";
  const { data: listsResponse, loading: isListsLoading } = useGet(listsUrl);

  const salesList =
    listsResponse?.sales || listsResponse?.data?.sales || [];

  const { data: productsRes } = useGet("/api/admin/sales/products");
  const productsList =
    listsResponse?.products ||
    listsResponse?.data?.products ||
    productsRes?.data?.allProducts ||
    productsRes?.allProducts ||
    productsRes?.data?.products ||
    [];

  const { data: leadResponse, loading: isFetching } = useGet(
    isEdit ? `/api/admin/sales/leads/${id}` : null,
    isEdit,
  );

  const rawData =
    leadResponse?.Lead ||
    leadResponse?.lead ||
    leadResponse?.data?.Lead ||
    leadResponse?.data?.lead ||
    leadResponse?.data ||
    leadResponse;

  const [locationName, setLocationName] = useState("");

  const initialData = React.useMemo(() => {
    if (!rawData) return {};
    const matchedSales = salesList.find((s) => s.name === rawData.sales);

    let parsedProducts = [];
    if (Array.isArray(rawData.products)) {
      parsedProducts = rawData.products.map((item) => ({
        product_id: item.product_id || "",
        duration: item.duration || "",
      }));
    } else if (typeof rawData.products === "string") {
      try {
        const parsed = JSON.parse(rawData.products);
        if (Array.isArray(parsed)) {
          parsedProducts = parsed.map((item) => ({
            product_id: item.product_id || "",
            duration: item.duration || "",
          }));
        }
      } catch {
        parsedProducts = [];
      }
    }

    return {
      id: rawData.id,
      name: rawData.name || "",
      phone: rawData.phone || "",
      place_name: rawData.place_name || "",
      place_phone: rawData.place_phone || "",
      address: rawData.address || "",
      notes: rawData.notes || "",
      lat: rawData.lat ?? DEFAULT_CENTER.lat,
      lng: rawData.lng ?? DEFAULT_CENTER.lng,
      sales_id: isSales ? (currentUser?.id || "") : (rawData.sales_id ?? matchedSales?.id ?? ""),
      products: parsedProducts,
    };
  }, [rawData, salesList, isSales, currentUser?.id]);

  React.useEffect(() => {
    if (initialData?.address) {
      setLocationName(initialData.address);
    }
  }, [initialData?.address]);

  if (isListsLoading || (isEdit && isFetching)) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title="Lead"
      apiUrl="/api/admin/sales/leads"
      method={isEdit ? "PUT" : "POST"}
      initialData={
        isEdit
          ? initialData
          : {
              lat: DEFAULT_CENTER.lat,
              lng: DEFAULT_CENTER.lng,
              place_name: "",
              place_phone: "",
              products: [],
            }
      }
      onSuccessAction={() => window.history.back()}
      transformPayload={(data) => ({
        ...data,
        sales_id: isSales ? (currentUser?.id || data.sales_id) : data.sales_id,
        sales_project_id: projectId || undefined,
        products: (data.products || []).filter((p) => p && p.product_id),
      })}
    >
      {(methods) => {
        const {
          register,
          control,
          watch,
          setValue,
          formState: { errors },
        } = methods;

        const { fields, append, remove } = useFieldArray({
          control,
          name: "products",
        });

        const watchedLat = watch("lat");
        const watchedLng = watch("lng");
        const watchedProducts = watch("products") || [];

        const selectedLocation = {
          lat: watchedLat || DEFAULT_CENTER.lat,
          lng: watchedLng || DEFAULT_CENTER.lng,
        };

        const setSelectedLocation = ({ lat, lng }) => {
          setValue("lat", lat, { shouldValidate: true });
          setValue("lng", lng, { shouldValidate: true });
        };

        const handleMarkerDragEnd = (e) => {
          const { lat, lng } = e.target.getLatLng();
          setSelectedLocation({ lat, lng });
        };

        return (
          <div className="mt-2 space-y-8">
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                Lead Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Name Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Lead name"
                    className="h-10 text-sm rounded-md"
                  />
                  {errors.name && (
                    <span className="text-xs text-red-500">
                      Name field is required
                    </span>
                  )}
                </div>

                {/* 2. Phone Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone *</Label>
                  <Input
                    type="tel"
                    {...register("phone", { required: true })}
                    placeholder="e.g. 01012345678"
                    className="h-10 text-sm rounded-md"
                  />
                  {errors.phone && (
                    <span className="text-xs text-red-500">
                      Phone field is required
                    </span>
                  )}
                </div>

                {/* 3. Place Name Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Place Name{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    {...register("place_name")}
                    placeholder="e.g. Store / Company name"
                    className="h-10 text-sm rounded-md"
                  />
                </div>

                {/* 4. Place Phone Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Place Phone{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    type="tel"
                    {...register("place_phone")}
                    placeholder="e.g. 01012345678"
                    className="h-10 text-sm rounded-md"
                  />
                </div>

                {/* 5. Sales Representative Field */}
                {isSales ? (
                  <div className="space-y-2 flex flex-col w-full sm:col-span-2">
                    <Label className="text-sm font-medium">Sales Representative</Label>
                    <div className="h-10 px-3 flex items-center rounded-md bg-muted/50 border border-border text-sm text-foreground font-medium">
                      {currentUser?.name || "Assigned to Me"}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 flex flex-col w-full sm:col-span-2">
                    <Label className="text-sm font-medium">Sales *</Label>
                    <Controller
                      name="sales_id"
                      control={control}
                      rules={{ required: "Sales field is required" }}
                      render={({ field }) => (
                        <Select
                          value={field.value || ""}
                          onValueChange={(val) => {
                            field.onChange(val);
                          }}
                        >
                          <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                            <SelectValue placeholder="Select Sales">
                              {field.value
                                ? salesList.find((s) => s.id === field.value)?.name
                                : undefined}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="z-50 bg-white">
                            {salesList.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.sales_id && (
                      <span className="text-xs text-red-500">
                        Sales field is required
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Multi-Products Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Products (Optional)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ product_id: "", duration: "" })}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add Product
                  </Button>
                </div>

                {fields.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No products added yet. Click &quot;Add Product&quot; to attach products to this lead.
                  </p>
                )}

                <div className="space-y-3">
                  {fields.map((item, index) => {
                    const currentProductId = watchedProducts?.[index]?.product_id;
                    const availableDurations = getDurationsForProduct(
                      productsList,
                      currentProductId,
                    );

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start bg-gray-50/70 p-3 rounded-md border"
                      >
                        <div className="sm:col-span-6 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Product *
                          </Label>
                          <Controller
                            name={`products.${index}.product_id`}
                            control={control}
                            rules={{ required: "Product is required" }}
                            render={({ field }) => (
                              <Select
                                value={field.value || ""}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setValue(`products.${index}.duration`, "");
                                }}
                              >
                                <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                                  <SelectValue placeholder="Select Product">
                                    {field.value
                                      ? productsList.find((p) => p.id === field.value)?.name
                                      : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white">
                                  {productsList.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors?.products?.[index]?.product_id && (
                            <span className="text-xs text-red-500">
                              {errors.products[index].product_id.message}
                            </span>
                          )}
                        </div>

                        <div className="sm:col-span-5 space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Duration *
                          </Label>
                          <Controller
                            name={`products.${index}.duration`}
                            control={control}
                            rules={{ required: "Duration is required" }}
                            render={({ field }) => (
                              <Select
                                value={field.value || ""}
                                disabled={!currentProductId || availableDurations.length === 0}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                }}
                              >
                                <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                                  <SelectValue placeholder={!currentProductId ? "Select product first" : availableDurations.length === 0 ? "No durations" : "Select Duration"}>
                                    {field.value || undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white">
                                  {availableDurations.map((d) => (
                                    <SelectItem key={d} value={d}>
                                      {d}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          />
                          {errors?.products?.[index]?.duration && (
                            <span className="text-xs text-red-500">
                              {errors.products[index].duration.message}
                            </span>
                          )}
                        </div>

                        <div className="sm:col-span-1 flex items-end justify-end pt-5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Any extra notes about the lead..."
                  className="text-sm rounded-md min-h-[90px]"
                />
              </div>
            </div>

            {/* Section: Location */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                Location
              </h3>

              <div className="space-y-2">
                <input
                  type="hidden"
                  {...register("lat", { required: true, valueAsNumber: true })}
                />
                <input
                  type="hidden"
                  {...register("lng", { required: true, valueAsNumber: true })}
                />
                <input
                  type="hidden"
                  {...register("address", { required: true })}
                />

                <MapComponent
                  selectedLocation={selectedLocation}
                  setSelectedLocation={setSelectedLocation}
                  locationName={locationName}
                  setLocationName={setLocationName}
                  form={methods}
                  onMarkerDragEnd={handleMarkerDragEnd}
                  isMapClickEnabled={true}
                />
                {(errors.lat || errors.lng || errors.address) && (
                  <span className="text-xs text-red-500">
                    Please select a location on the map
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </AddPage>
  );
};

export default LeadsAdd;
