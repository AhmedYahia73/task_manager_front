import React, { useState } from "react";
import { useParams } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapComponent from "@/components/MapComponent";

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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Controller, useFieldArray } from "react-hook-form";
import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getDurationsForProduct } from "@/Pages/Admin/Sales/Visits/VisitsAdd";

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const LeadsAdd = () => {
  const { id } = useParams();
  const isEdit = !!id;

  const { data: listsResponse, loading: isListsLoading } = useGet(
    "/api/admin/sales/leads/lists",
  );

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

  const rawData = leadResponse?.data?.Lead || leadResponse?.data?.lead;

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
      sales_id: rawData.sales_id ?? matchedSales?.id ?? "",
      products: parsedProducts,
    };
  }, [rawData, salesList]);

  if (isListsLoading || (isEdit && isFetching)) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title="Lead"
      apiUrl="/api/admin/sales/leads"
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

        const [locationName, setLocationName] = useState(
          initialData?.address || "",
        );

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

                {/* 5. Sales Search Select */}
                <div className="space-y-2 flex flex-col w-full sm:col-span-2">
                  <Label className="text-sm font-medium">Sales *</Label>
                  <Controller
                    name="sales_id"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal text-left h-10 px-3 text-sm rounded-md",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value
                              ? salesList.find((s) => s.id === field.value)?.name
                              : "Select Sales"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command className="text-sm">
                            <CommandInput
                              placeholder="Search sales..."
                              className="h-9 text-sm"
                            />
                            <CommandList>
                              <CommandEmpty className="p-2 text-sm text-center text-gray-500">
                                No results found.
                              </CommandEmpty>
                              <CommandGroup>
                                {salesList.map((s) => (
                                  <CommandItem
                                    key={s.id}
                                    value={s.name}
                                    className="text-sm py-1.5 px-2 cursor-pointer"
                                    onSelect={() => field.onChange(s.id)}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        s.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0",
                                      )}
                                    />
                                    {s.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                      "w-full justify-between font-normal text-left h-10 px-3 text-sm rounded-md bg-white",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value
                                      ? productsList.find(
                                          (p) => p.id === field.value,
                                        )?.name || "Select Product"
                                      : "Select Product"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[var(--radix-popover-trigger-width)] p-0"
                                  align="start"
                                >
                                  <Command className="text-sm">
                                    <CommandInput
                                      placeholder="Search product..."
                                      className="h-9 text-sm"
                                    />
                                    <CommandList>
                                      <CommandEmpty className="p-2 text-sm text-center text-gray-500">
                                        No results found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {productsList.map((p) => (
                                          <CommandItem
                                            key={p.id}
                                            value={p.name}
                                            className="text-sm py-1.5 px-2 cursor-pointer"
                                            onSelect={() => {
                                              field.onChange(p.id);
                                              setValue(
                                                `products.${index}.duration`,
                                                "",
                                              );
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                p.id === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {p.name}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    role="combobox"
                                    disabled={!currentProductId}
                                    className={cn(
                                      "w-full justify-between font-normal text-left h-10 px-3 text-sm rounded-md bg-white",
                                      !field.value && "text-muted-foreground",
                                    )}
                                  >
                                    {field.value
                                      ? field.value
                                      : "Select Duration"}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                  className="w-[var(--radix-popover-trigger-width)] p-0"
                                  align="start"
                                >
                                  <Command className="text-sm">
                                    <CommandList>
                                      <CommandEmpty className="p-2 text-sm text-center text-gray-500">
                                        No durations found for this product.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {availableDurations.map((d) => (
                                          <CommandItem
                                            key={d}
                                            value={d}
                                            className="text-sm py-1.5 px-2 cursor-pointer"
                                            onSelect={() => field.onChange(d)}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4",
                                                d === field.value
                                                  ? "opacity-100"
                                                  : "opacity-0",
                                              )}
                                            />
                                            {d}
                                          </CommandItem>
                                        ))}
                                      </CommandGroup>
                                    </CommandList>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
