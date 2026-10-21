import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/DataTable";
import { DeleteDialog } from "@/components/DeleteDialog";
import { useGet } from "@/hooks/useGet";
import { useMutation } from "@/hooks/useMutation";
import { MapPin, StickyNote, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Leads = () => {
  const navigate = useNavigate();

  const [selectedSalesFilter, setSelectedSalesFilter] = useState("");
  const [selectedNotes, setSelectedNotes] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [leadToConvert, setLeadToConvert] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState("");

  const { data: response, loading: isLoading, refresh } = useGet(
    "/api/admin/sales/leads"
  );
  const allLeads =
    response?.data?.allLeads ||
    response?.allLeads ||
    response?.data?.leads ||
    [];

  const { data: listsResponse } = useGet("/api/admin/sales/leads/lists");
  const salesList =
    listsResponse?.sales || listsResponse?.data?.sales || [];
  const visitStatusList =
    listsResponse?.visit_status || listsResponse?.data?.visit_status || [];

  const filteredLeads = selectedSalesFilter
    ? allLeads.filter((l) => l.sales_id === selectedSalesFilter)
    : allLeads;

  const { mutate: deleteLead, loading: isDeleting } = useMutation();
  const { mutate: convertLead, loading: isConverting } = useMutation();

  const handleDeleteClick = (lead) => {
    setLeadToDelete(lead);
  };

  const handleDeleteConfirm = async () => {
    if (!leadToDelete) return;

    const result = await deleteLead({
      method: "DELETE",
      url: `/api/admin/sales/leads/${leadToDelete.id}`,
    });

    if (result.success) {
      toast?.success?.("Lead deleted successfully");
      setLeadToDelete(null);
      refresh?.();
    } else {
      toast?.error?.("Failed to delete lead");
    }
  };

  const handleOpenConvertModal = (lead) => {
    setLeadToConvert(lead);
    setSelectedStatusId(visitStatusList?.[0]?.id || "");
  };

  const handleConvertToVisit = async () => {
    if (!leadToConvert) return;
    if (!selectedStatusId) {
      toast?.error?.("Please select a visit status");
      return;
    }

    const result = await convertLead({
      method: "POST",
      url: `/api/admin/sales/leads/${leadToConvert.id}/convert`,
      data: {
        status_id: selectedStatusId,
        products: leadToConvert.products || [],
      },
    });

    if (result.success) {
      toast?.success?.("Lead converted to visit successfully");
      setLeadToConvert(null);
      setSelectedStatusId("");
      refresh?.();
    } else {
      toast?.error?.("Failed to convert lead to visit");
    }
  };

  const columns = [
    { accessorKey: "name", header: "Name" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "place_name",
      header: "Place Name",
      render: (row) =>
        row.place_name || <span className="text-gray-400">-</span>,
    },
    {
      accessorKey: "place_phone",
      header: "Place Phone",
      render: (row) =>
        row.place_phone || <span className="text-gray-400">-</span>,
    },
    {
      accessorKey: "sales",
      header: "Sales",
      render: (row) => row.sales || <span className="text-gray-400">-</span>,
    },
    {
      accessorKey: "product",
      header: "Products",
      render: (row) => {
        if (Array.isArray(row.products) && row.products.length > 0) {
          return (
            <div className="flex flex-wrap gap-1">
              {row.products.map((p, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium border border-blue-200"
                >
                  {p.product_name || p.product_id}
                  {p.duration ? ` (${p.duration})` : ""}
                </span>
              ))}
            </div>
          );
        }
        return row.product || <span className="text-gray-400">-</span>;
      },
    },
    { accessorKey: "address", header: "Address" },
    {
      accessorKey: "notes",
      header: "Notes",
      render: (row) => {
        if (!row.notes) return <span className="text-gray-400">-</span>;
        return (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedNotes({
                name: row.name,
                notes: row.notes,
              });
            }}
          >
            <StickyNote className="h-3.5 w-3.5 text-blue-500" />
            View Notes
          </Button>
        );
      },
    },
    {
      accessorKey: "map_link",
      header: "Map",
      render: (row) => (
        <a
          href={row.map_link}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 hover:underline flex items-center gap-1"
        >
          <MapPin className="h-4 w-4" /> View
        </a>
      ),
    },
    {
      accessorKey: "convert",
      header: "Convert",
      render: (row) => (
        <Button
          variant="outline"
          size="sm"
          disabled={isConverting}
          className="h-8 text-xs gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
          onClick={(e) => {
            e.stopPropagation();
            handleOpenConvertModal(row);
          }}
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          To Visit
        </Button>
      ),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <label
            htmlFor="sales-filter"
            className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-zinc-300"
          >
            Filter by Sales:
          </label>
          <select
            id="sales-filter"
            className="border border-gray-300 dark:border-zinc-700 rounded-md px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 w-full sm:w-auto sm:min-w-[200px]"
            value={selectedSalesFilter}
            onChange={(e) => setSelectedSalesFilter(e.target.value)}
          >
            <option value="">All Sales (Show All)</option>
            {salesList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        title="Leads Management"
        onAdd={() => navigate("/leads/add")}
        onDelete={handleDeleteClick}
        onEdit={(row) => navigate(`/leads/${row.id}/edit`)}
        columns={columns}
        data={filteredLeads}
        isLoading={isLoading}
      />

      <DeleteDialog
        isOpen={!!leadToDelete}
        onClose={() => setLeadToDelete(null)}
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
      />

      <Dialog
        open={!!leadToConvert}
        onOpenChange={(open) => {
          if (!open) {
            setLeadToConvert(null);
            setSelectedStatusId("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-emerald-600" />
              Convert Lead to Visit
            </DialogTitle>
            <DialogDescription className="pt-1 text-sm text-gray-600">
              Select the visit status to convert{" "}
              <span className="font-semibold text-gray-900">
                {leadToConvert?.name}
              </span>{" "}
              into a visit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Visit Status *
              </label>
              <select
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                value={selectedStatusId}
                onChange={(e) => setSelectedStatusId(e.target.value)}
              >
                <option value="">Select Visit Status</option>
                {visitStatusList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLeadToConvert(null);
                  setSelectedStatusId("");
                }}
                disabled={isConverting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConvertToVisit}
                disabled={isConverting || !selectedStatusId}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isConverting ? "Converting..." : "Convert to Visit"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedNotes}
        onOpenChange={() => setSelectedNotes(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-primary" />
              Lead Notes - {selectedNotes?.name}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {selectedNotes?.notes}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Leads;
