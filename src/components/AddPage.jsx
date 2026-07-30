import React, { useEffect, useState, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { useMutation } from "@/hooks/useMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, Save, Check, ChevronsUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";

const AddPage = ({
  title,
  apiUrl,
  method, // يُفضل تمريره (POST أو PUT) أو استنتاجه من initialData
  fields = [],
  initialData,
  onSuccessAction,
  children,
  transformPayload,
  bypassIdInEdit = false,
}) => {
  const isEdit = method === "PUT" || !!initialData?.id;
  const formMethods = useForm({
    defaultValues: initialData || {},
  });
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { errors },
  } = formMethods;

  // استخدام الـ hook الموحد للإرسال (POST / PUT)
  const { mutate, loading: isLoading } = useMutation();

  const [openCombobox, setOpenCombobox] = useState({});

  // استخدام useRef للاحتفاظ بهوية الـ fields دون التسبب في إعادة تشغيل الـ useEffect
  const fieldsRef = useRef(fields);
  useEffect(() => {
    fieldsRef.current = fields;
  }, [fields]);

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  // تحويل initialData إلى نص JSON لمراقبة التغيير الحقيقي في البيانات فقط وليس الـ Reference
  const initialDataString = JSON.stringify(initialData);

  useEffect(() => {
    if (initialData) {
      const formattedData = { ...initialData };

      // استخدام fieldsRef.current لتجنب وضع fields في التبعيات
      fieldsRef.current.forEach((field) => {
        if (field.type === "date" && initialData[field.name]) {
          try {
            formattedData[field.name] = new Date(initialData[field.name])
              .toISOString()
              .split("T")[0];
          } catch (e) {
            console.error("Error formatting date:", e);
          }
        }
      });

      // عمل reset فقط عندما تتغير البيانات القادمة فعلياً من الـ API
      reset(formattedData, { keepDirtyValues: true });
    }
  }, [initialDataString, reset]); // ✅ التبعية مستقرة ولن تسبب Loop

  const onSubmit = async (data) => {
    const payloadToSend = transformPayload ? transformPayload(data) : data;

    // تحديد الـ URL والـ Method ديناميكياً
    const recordId = initialData?.id || data?.id;
    // 💡 لو bypassIdInEdit=true نبعت الرابط الأصلي صافي، وإلا نضيف الـ id تلقائياً
    const requestUrl = isEdit
      ? bypassIdInEdit
        ? apiUrl
        : `${apiUrl}/${recordId}`
      : apiUrl;
    const requestMethod = isEdit ? "PUT" : "POST";

    const result = await mutate({
      method: requestMethod,
      url: requestUrl,
      data: payloadToSend,
    });

    if (result.success) {
      onSuccessAction?.(result.data);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-3xl shadow-lg border-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold tracking-tight text-capitalize">
          {isEdit ? `${"Edit"} ${title}` : `${"Add"} ${title}`}
        </CardTitle>
        <CardDescription>Please fill in the required fields below.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fields.map((fieldItem) => (
              <div key={fieldItem.name} className="space-y-2">
                <Label htmlFor={fieldItem.name}>
                  {fieldItem.label}{" "}
                  {fieldItem.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>

                {fieldItem.type === "select" ||
                  fieldItem.type === "combobox" ? (
                  <Controller
                    name={fieldItem.name}
                    control={control}
                    defaultValue={initialData?.[fieldItem.name] || ""}
                    rules={{ required: fieldItem.required }}
                    render={({ field: { onChange: formOnChange, value } }) => {
                      const stringVal = value != null ? String(value) : "";
                      const [searchVal, setSearchVal] = React.useState("");
                      const filteredOptions = searchVal.trim()
                        ? fieldItem.options?.filter((o) =>
                          o.label
                            .toLowerCase()
                            .includes(searchVal.toLowerCase()),
                        )
                        : fieldItem.options;
                      return (
                        <Popover
                          open={openCombobox[fieldItem.name] || false}
                          onOpenChange={(isOpen) => {
                            setOpenCombobox((prev) => ({
                              ...prev,
                              [fieldItem.name]: isOpen,
                            }));
                            if (!isOpen) setSearchVal("");
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between font-normal text-left h-10 bg-card border-input",
                                errors[fieldItem.name]
                                  ? "border-destructive text-destructive"
                                  : "",
                              )}
                            >
                              {stringVal
                                ? fieldItem.options?.find(
                                  (option) =>
                                    String(option.value) === stringVal,
                                )?.label
                                : `${"selectField"} ${fieldItem.label}...`}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-0 PopoverContent"
                            align="start"
                          >
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder={`${"searchField"} ${fieldItem.label}...`}
                                value={searchVal}
                                onValueChange={setSearchVal}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {"noResultsFound"}
                                </CommandEmpty>
                                <CommandGroup>
                                  {filteredOptions?.map((option) => (
                                    <CommandItem
                                      key={option.value}
                                      value={String(option.value)}
                                      onSelect={() => {
                                        const selectedValue = String(
                                          option.value,
                                        );
                                        formOnChange(selectedValue);
                                        if (fieldItem.onChange) {
                                          fieldItem.onChange(selectedValue);
                                        }
                                        setOpenCombobox((prev) => ({
                                          ...prev,
                                          [fieldItem.name]: false,
                                        }));
                                        setSearchVal("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          stringVal === String(option.value)
                                            ? "opacity-100"
                                            : "opacity-0",
                                        )}
                                      />
                                      {option.label}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      );
                    }}
                  />
                ) : fieldItem.type === "multi-select" ? (
                  <Controller
                    name={fieldItem.name}
                    control={control}
                    defaultValue={initialData?.[fieldItem.name] || []}
                    rules={{ required: fieldItem.required }}
                    render={({
                      field: { onChange: formOnChange, value = [] },
                    }) => {
                      const safeValue = Array.isArray(value) ? value : [];
                      const handleToggleOption = (optionValue) => {
                        const stringValue = String(optionValue);
                        let updatedValue = [];

                        if (safeValue.includes(stringValue)) {
                          updatedValue = safeValue.filter(
                            (v) => v !== stringValue,
                          );
                        } else {
                          updatedValue = [...safeValue, stringValue];
                        }

                        formOnChange(updatedValue);
                        if (fieldItem.onChange) {
                          fieldItem.onChange(updatedValue);
                        }
                      };

                      return (
                        <div className="space-y-2">
                          <Select onValueChange={handleToggleOption} value="">
                            <SelectTrigger
                              className={
                                errors[fieldItem.name]
                                  ? "border-destructive w-full"
                                  : "w-full"
                              }
                            >
                              <SelectValue
                                placeholder={`${"selectField"} ${fieldItem.label}...`}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldItem.options?.map((option) => {
                                const isSelected = safeValue.includes(
                                  String(option.value),
                                );
                                return (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                    className={
                                      isSelected
                                        ? "bg-accent text-accent-foreground font-medium"
                                        : ""
                                    }
                                  >
                                    <div className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        readOnly
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-3 w-3"
                                      />
                                      {option.label}
                                    </div>
                                  </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>

                          {safeValue.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 p-2 border rounded-md bg-muted/30">
                              {safeValue.map((val) => {
                                const option = fieldItem.options?.find(
                                  (o) => String(o.value) === String(val),
                                );
                                return (
                                  <span
                                    key={val}
                                    className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-sm shadow-sm"
                                  >
                                    {option ? option.label : val}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const filtered = safeValue.filter(
                                          (v) => v !== val,
                                        );
                                        formOnChange(filtered);
                                        if (fieldItem.onChange)
                                          fieldItem.onChange(filtered);
                                      }}
                                      className="hover:bg-primary-foreground/20 rounded-full w-3 h-3 inline-flex items-center justify-center text-[10px] font-bold"
                                    >
                                      ×
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                ) : fieldItem.type === "file" ? (
                  <Controller
                    name={fieldItem.name}
                    control={control}
                    rules={{ required: isEdit ? false : fieldItem.required }}
                    render={({ field: { onChange: formOnChange, value } }) => (
                      <div className="space-y-3">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const base64 = await toBase64(file);
                              formOnChange(base64);
                              if (fieldItem.onChange)
                                fieldItem.onChange(base64);
                            }
                          }}
                          className={
                            errors[fieldItem.name] ? "border-destructive" : ""
                          }
                        />
                        {value && (
                          <div className="relative w-32 h-32 border rounded-lg overflow-hidden bg-muted">
                            <img
                              src={value}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] px-2 py-1">
                              {"currentImage"}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  />
                ) : fieldItem.type === "switch" ? (
                  <Controller
                    name={fieldItem.name}
                    control={control}
                    defaultValue={false}
                    render={({ field: { onChange: formOnChange, value } }) => (
                      <Switch
                        checked={!!value}
                        onCheckedChange={(checked) => {
                          formOnChange(checked);
                          if (fieldItem.onChange) fieldItem.onChange(checked);
                        }}
                      />
                    )}
                  />
                ) : (
                  <Input
                    id={fieldItem.name}
                    type={fieldItem.type || "text"}
                    {...register(fieldItem.name, {
                      required: fieldItem.required,
                      valueAsNumber: fieldItem.type === "number",
                      onChange: (e) => {
                        if (fieldItem.onChange) {
                          fieldItem.onChange(e.target.value);
                        }
                      },
                    })}
                    className={
                      errors[fieldItem.name] ? "border-destructive" : ""
                    }
                  />
                )}

                {errors[fieldItem.name] && (
                  <p className="text-destructive text-xs">{"required"}</p>
                )}
              </div>
            ))}
            {children && (
              <div className="col-span-full">
                {typeof children === "function"
                  // 👇 ضفنا toBase64 هنا عشان تكون متاحة لأي صفحة
                  ? children({ ...formMethods, toBase64 })
                  : children}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full md:w-32"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                  {"saving"}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />{" "}
                  {isEdit ? "update" : "save"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPage;