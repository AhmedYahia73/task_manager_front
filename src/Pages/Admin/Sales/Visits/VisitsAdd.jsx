import React, { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapComponent from "@/components/MapComponent";

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

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

export const getDurationsForProduct = (productsList, productId) => {
  if (!productsList || !productId) return [];
  const selectedProduct = productsList.find((p) => String(p.id) === String(productId));
  let pointsData = selectedProduct?.points || [];
  if (typeof pointsData === "string") {
    try {
      pointsData = JSON.parse(pointsData);
    } catch {
      pointsData = [];
    }
  }
  const durations = Array.isArray(pointsData)
    ? pointsData.map((p) => p.duration).filter(Boolean)
    : [];
  if (durations.length === 0 && selectedProduct) {
    return ["monthly", "quarterly", "semi-annually", "yearly"];
  }
  return durations;
};

const VisitsAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const isEdit = !!id;

  const { data: listsResponse, loading: isListsLoading } = useGet(
    "/api/admin/sales/visits/lists",
  );

  const statusList =
    listsResponse?.visit_status || listsResponse?.data?.visit_status || [];
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

  const { data: visitResponse, loading: isFetching } = useGet(
    isEdit ? `/api/admin/sales/visits/${id}` : null,
    isEdit && !state?.visitData,
  );

  const rawData =
    visitResponse?.Visit ||
    visitResponse?.visit ||
    visitResponse?.data?.Visit ||
    visitResponse?.data?.visit ||
    visitResponse?.data ||
    visitResponse ||
    state?.visitData;

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
      name: rawData.name,
      owner_name: rawData.owner_name || "",
      owner_phone: rawData.owner_phone || "",
      address: rawData.address,
      notes: rawData.notes,
      phone: rawData.phone,
      lat: rawData.lat ?? DEFAULT_CENTER.lat,
      lng: rawData.lng ?? DEFAULT_CENTER.lng,
      status_id: rawData.status_id,
      sales_id: rawData.sales_id ?? matchedSales?.id ?? "",
      products: parsedProducts,
    };
  }, [rawData, salesList]);

  React.useEffect(() => {
    if (initialData?.address) {
      setLocationName(initialData.address);
    }
  }, [initialData?.address]);

  if (isListsLoading || (isEdit && !state?.visitData && isFetching)) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title="Visit"
      apiUrl="/api/admin/sales/visits"
      method={isEdit ? "PUT" : "POST"}
      initialData={
        isEdit
          ? initialData
          : {
              lat: DEFAULT_CENTER.lat,
              lng: DEFAULT_CENTER.lng,
              owner_name: "",
              owner_phone: "",
              products: [],
            }
      }
      onSuccessAction={() => window.history.back()}
      transformPayload={(data) => ({
        ...data,
        status: "visit",
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
        const watchedStatusId = watch("status_id");
        const watchedProducts = watch("products") || [];

        const selectedStatus = statusList.find((s) => String(s.id) === String(watchedStatusId));
        const statusNameLower = selectedStatus?.name?.toLowerCase() || "";
        const isSales =
          statusNameLower === "sales" ||
          statusNameLower === "delivered" ||
          statusNameLower.includes("sales") ||
          statusNameLower.includes("delivered") ||
          statusNameLower.includes("won") ||
          statusNameLower.includes("تمت") ||
          statusNameLower.includes("بيع");

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
            {/* Section: Basic Info */}
            <div className="space-y-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide border-b pb-2">
                Basic Info
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 1. Name Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Name *</Label>
                  <Input
                    {...register("name", { required: true })}
                    placeholder="Visit name"
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

                {/* Owner Name Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Owner Name{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    {...register("owner_name")}
                    placeholder="e.g. Owner name"
                    className="h-10 text-sm rounded-md"
                  />
                </div>

                {/* Owner Phone Field */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Owner Phone{" "}
                    <span className="text-xs text-muted-foreground font-normal">
                      (Optional)
                    </span>
                  </Label>
                  <Input
                    type="tel"
                    {...register("owner_phone")}
                    placeholder="e.g. 01012345678"
                    className="h-10 text-sm rounded-md"
                  />
                </div>

                {/* 3. Status Select */}
                <div className="space-y-2 flex flex-col w-full">
                  <Label className="text-sm font-medium">Status *</Label>
                  <Controller
                    name="status_id"
                    control={control}
                    rules={{ required: "Status field is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => {
                          field.onChange(val);
                        }}
                      >
                        <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                          <SelectValue placeholder="Select Status">
                            {field.value
                              ? (statusList.find((s) => String(s.id) === String(field.value))?.name || field.value)
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white">
                          {statusList.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.status_id && (
                    <span className="text-xs text-red-500">
                      Status field is required
                    </span>
                  )}
                </div>

                {/* 4. Sales Select */}
                <div className="space-y-2 flex flex-col w-full">
                  <Label className="text-sm font-medium">Sales *</Label>
                  <Controller
                    name="sales_id"
                    control={control}
                    rules={{ required: "Sales field is required" }}
                    render={({ field }) => (
                      <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(val) => {
                          field.onChange(val);
                        }}
                      >
                        <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                          <SelectValue placeholder="Select Sales">
                            {field.value
                              ? (salesList.find((s) => String(s.id) === String(field.value))?.name || field.value)
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="z-50 bg-white">
                          {salesList.map((s) => (
                            <SelectItem key={s.id} value={String(s.id)}>
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
              </div>

              {/* Multi-Products Section */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">
                    Products {isSales ? "*" : "(Optional)"}
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
                    No products added yet. Click &quot;Add Product&quot; to attach products to this visit.
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
                        {/* Product Select */}
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
                                value={field.value ? String(field.value) : ""}
                                onValueChange={(val) => {
                                  field.onChange(val);
                                  setValue(`products.${index}.duration`, "");
                                }}
                              >
                                <SelectTrigger className="w-full h-10 px-3 text-sm rounded-md bg-white border">
                                  <SelectValue placeholder="Select Product">
                                    {field.value
                                      ? (productsList.find((p) => String(p.id) === String(field.value))?.name || field.value)
                                      : undefined}
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="z-50 bg-white">
                                  {productsList.map((p) => (
                                    <SelectItem key={p.id} value={String(p.id)}>
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

                        {/* Duration Select */}
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

                        {/* Remove Button */}
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

              {/* 5. Notes Field */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Notes</Label>
                <Textarea
                  {...register("notes")}
                  placeholder="Any extra notes about the visit..."
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

export default VisitsAdd;