import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import AddPage from "@/components/AddPage";
import { useGet } from "@/hooks/useGet";
import LoadingSpinner from "@/components/LoadingSpinner";
import MapComponent from "@/components/MapComponent";

// Shadcn UI & Icons Components
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
import { Controller } from "react-hook-form";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const VisitsAdd = () => {
  const { id } = useParams();
  const { state } = useLocation();
  const isEdit = !!id;

  const { data: listsResponse, loading: isListsLoading } = useGet(
    "/api/admin/visits/lists",
  );

  const statusList =
    listsResponse?.visit_status || listsResponse?.data?.visit_status || [];
  const salesList =
    listsResponse?.sales || listsResponse?.data?.sales || [];

  const { data: visitResponse, loading: isFetching } = useGet(
    isEdit ? `/api/admin/visits/${id}` : null,
    isEdit && !state?.visitData,
  );

  const rawData = visitResponse?.data?.Visit;

  const initialData = React.useMemo(() => {
    if (!rawData) return {};
    const matchedSales = salesList.find((s) => s.name === rawData.sales);

    return {
      id: rawData.id,
      name: rawData.name,
      address: rawData.address,
      notes: rawData.notes,
      phone: rawData.phone,
      lat: rawData.lat ?? DEFAULT_CENTER.lat,
      lng: rawData.lng ?? DEFAULT_CENTER.lng,
      status_id: rawData.status_id,
      sales_id: rawData.sales_id ?? matchedSales?.id ?? "",
    };
  }, [rawData, salesList]);

  if (isListsLoading || (isEdit && !state?.visitData && isFetching)) {
    return <LoadingSpinner />;
  }

  return (
    <AddPage
      title="Visit"
      apiUrl="/api/admin/visits"
      initialData={isEdit ? initialData : { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng }}
      onSuccessAction={() => window.history.back()}
      transformPayload={(data) => ({ ...data, status: "visit" })}
    >
      {(methods) => {
        const {
          register,
          control,
          watch,
          setValue,
          formState: { errors },
        } = methods;

        const watchedLat = watch("lat");
        const watchedLng = watch("lng");
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

                {/* 3. Status Search Select */}
                <div className="space-y-2 flex flex-col w-full">
                  <Label className="text-sm font-medium">Status *</Label>
                  <Controller
                    name="status_id"
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
                              ? statusList.find((s) => s.id === field.value)
                                ?.name
                              : "Select Status"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0"
                          align="start"
                        >
                          <Command className="text-sm">
                            <CommandInput
                              placeholder="Search status..."
                              className="h-9 text-sm"
                            />
                            <CommandList>
                              <CommandEmpty className="p-2 text-sm text-center text-gray-500">
                                No results found.
                              </CommandEmpty>
                              <CommandGroup>
                                {statusList.map((s) => (
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
                  {errors.status_id && (
                    <span className="text-xs text-red-500">
                      Status field is required
                    </span>
                  )}
                </div>

                {/* 4. Sales Search Select */}
                <div className="space-y-2 flex flex-col w-full">
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