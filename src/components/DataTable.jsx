import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Pencil, Trash2, Loader2 } from "lucide-react";

export const DataTable = ({ 
  title, 
  onAdd, 
  showAdd = true, 
  columns = [], 
  data = [], 
  onEdit, 
  onDelete, 
  isLoading = false,
  searchPlaceholder = "Search...",
  search_auto = true, // تم ضبطه لـ false ليعتمد كلياً على الـ Backend
  showSearchInput = false // تم إخفاؤه افتراضياً لتجنب ازدواجية حقول البحث
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // تطبيق الفلترة المحلية فقط في حال تفعيل search_auto والكتابة في حقل البحث الداخلي
  let filteredData = data;
  if (search_auto && searchTerm.trim() !== "") {
    filteredData = data.filter((item) =>
      Object.values(item).some((val) =>
        String(val ?? "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }

  const hasActions = Boolean(onEdit || onDelete);

  return (
    <div className="space-y-4 w-full">
      {/* العنوان وزر الإضافة */}
      {(title || (showAdd && onAdd)) && (
        <div className="flex justify-between items-center mb-4">
          {title && <h2 className="text-xl font-bold text-gray-800">{title}</h2>}
          {showAdd && onAdd && (
            <Button onClick={onAdd} className="gap-2">
              <Plus className="h-4 w-4" /> Add
            </Button>
          )}
        </div>
      )}

      {/* حقل البحث الداخلي (يظهر فقط إذا كان showSearchInput = true) */}
      {showSearchInput && (
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
      )}

      {/* الجدول */}
      <div className="rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={col.accessorKey || index} className="font-semibold text-gray-700">
                  {col.header}
                </TableHead>
              ))}
              {hasActions && <TableHead className="text-center font-semibold text-gray-700">Actions</TableHead>}
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length + (hasActions ? 1 : 0)} className="h-32 text-center">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                    <span>Loading data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredData.length > 0 ? (
              filteredData.map((row, rowIndex) => (
                <TableRow key={row.id || rowIndex} className="hover:bg-gray-50/50 transition-colors">
                  {columns.map((col, colIndex) => (
                    <TableCell key={colIndex}>
                      {col.render ? col.render(row) : (row[col.accessorKey] ?? "-")}
                    </TableCell>
                  ))}
                  {hasActions && (
                    <TableCell>
                      <div className="flex justify-center items-center gap-1">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => onEdit(row)}
                            className="h-8 w-8 text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Delete"
                            aria-label="Delete"
                            onClick={() => onDelete(row)}
                            className="h-8 w-8 text-slate-600 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell 
                  colSpan={columns.length + (hasActions ? 1 : 0)} 
                  className="h-32 text-center text-gray-500 font-medium"
                >
                  No records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};