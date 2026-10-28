import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { apiClient } from '@/lib/axios';
import { 
  Loader2, 
  Search, 
  Calendar, 
  ChevronLeft, 
  Lock, 
  AlarmClock, 
  Kanban as KanbanIcon, 
  Table as TableIcon, 
  CheckSquare, 
  Square, 
  RefreshCw, 
  Eye, 
  Trash2,
  FolderKanban,
  User as UserIcon,
  Filter,
  GripVertical
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';
import { toast } from 'sonner';
import { isAdminRole } from '@/utils/auth';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';

// Strict status order as requested by user
const KANBAN_COLUMNS = [
  { id: 'pending', label: 'Pending', dotColor: 'bg-amber-500', dropHighlight: 'ring-2 ring-amber-400 bg-amber-50/40 dark:bg-amber-950/20' },
  { id: 'inprogress', label: 'In Progress', dotColor: 'bg-blue-500', dropHighlight: 'ring-2 ring-blue-400 bg-blue-50/40 dark:bg-blue-950/20' },
  { id: 'done', label: 'Completed', dotColor: 'bg-emerald-500', dropHighlight: 'ring-2 ring-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' },
  { id: 'edit', label: 'Need to Revision', dotColor: 'bg-orange-500', dropHighlight: 'ring-2 ring-orange-400 bg-orange-50/40 dark:bg-orange-950/20' },
  { id: 'approve', label: 'Approved', dotColor: 'bg-purple-500', dropHighlight: 'ring-2 ring-purple-400 bg-purple-50/40 dark:bg-purple-950/20' }
];

const FilteredTasks = () => {
  const navigate = useNavigate();
  const { getRoleName } = useRoleNames();
  const { type } = useParams(); // 'pending', 'delay', 'today', 'all'
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || '';
  const isAdmin = isAdminRole(userRole);
  const isLeaderOrAdmin = isAdmin; // In global task view, global admins or task leaders have full privilege

  // View mode: 'kanban' (default) or 'table'
  const [viewMode, setViewMode] = useState('kanban');

  // Search & Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [projectId, setProjectId] = useState('');
  const [userIdFilter, setUserIdFilter] = useState('');

  // Mobile active tab for column view
  const [mobileActiveTab, setMobileActiveTab] = useState('pending');

  // Selection mode & multi-select state ("by selection")
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('inprogress');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Table view pagination
  const [tablePage, setTablePage] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setTablePage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { search: querySearch } = useLocation();
  const queryParams = new URLSearchParams(querySearch);
  const initialUserId = queryParams.get('user_id') || '';
  const initialProjectId = queryParams.get('project_id') || '';

  useEffect(() => {
    if (initialUserId) setUserIdFilter(initialUserId);
    if (initialProjectId) setProjectId(initialProjectId);
  }, [initialUserId, initialProjectId]);

  const endpoint = type === 'pending' ? '/api/admin/tasks/pendingTasks' 
                 : type === 'delay' ? '/api/admin/tasks/delayTasks' 
                 : type === 'today' ? '/api/admin/tasks/todayTasks'
                 : '/api/admin/tasks';
                 
  const pageTitle = type === 'pending' ? 'Pending Tasks' 
                  : type === 'delay' ? 'Delayed Tasks' 
                  : type === 'today' ? "Today's Tasks"
                  : 'All Tasks';

  // Fetch Lists for Filters (projects, users)
  const { data: listsData } = useGet('/api/admin/tasks/lists');
  const projectsList = listsData?.projects_list || [];
  const usersList = listsData?.users_list || [];

  // =========================================================================
  // KANBAN COLUMNS STATE (Independent pagination + infinite scroll per column)
  // =========================================================================
  const [columnsData, setColumnsData] = useState(() => {
    const initial = {};
    KANBAN_COLUMNS.forEach(col => {
      initial[col.id] = {
        tasks: [],
        page: 1,
        totalPages: 1,
        total: 0,
        loading: false,
        loadingMore: false,
        hasMore: false
      };
    });
    return initial;
  });

  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromCol, setDraggedFromCol] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // Fetch a specific column's page
  const fetchColumnPage = useCallback(async (statusKey, pageNum = 1, append = false) => {
    setColumnsData(prev => ({
      ...prev,
      [statusKey]: {
        ...prev[statusKey],
        loading: !append,
        loadingMore: append
      }
    }));

    try {
      const res = await apiClient.get(endpoint, {
        params: {
          status: statusKey,
          page: pageNum,
          limit: 12,
          search: debouncedSearch,
          project_id: projectId || undefined,
          user_id: userIdFilter || undefined
        }
      });

      const data = res?.data?.data || res?.data || {};
      const fetchedTasks = data.tasks || data.Tasks || [];
      const pagination = data.pagination || { total: fetchedTasks.length, totalPages: 1, page: pageNum };

      setColumnsData(prev => {
        const currentTasks = prev[statusKey]?.tasks || [];
        const combined = append
          ? [...currentTasks, ...fetchedTasks.filter(item => !currentTasks.some(existing => existing.id === item.id))]
          : fetchedTasks;

        return {
          ...prev,
          [statusKey]: {
            tasks: combined,
            page: pageNum,
            totalPages: pagination.totalPages || 1,
            total: Number(pagination.total || combined.length),
            loading: false,
            loadingMore: false,
            hasMore: pageNum < (pagination.totalPages || 1)
          }
        };
      });
    } catch (err) {
      console.error(`Failed to load tasks for status ${statusKey}:`, err);
      setColumnsData(prev => ({
        ...prev,
        [statusKey]: {
          ...prev[statusKey],
          loading: false,
          loadingMore: false
        }
      }));
    }
  }, [endpoint, debouncedSearch, projectId, userIdFilter]);

  // Refresh all Kanban columns
  const refreshAllColumns = useCallback(() => {
    KANBAN_COLUMNS.forEach(col => {
      fetchColumnPage(col.id, 1, false);
    });
  }, [fetchColumnPage]);

  // Trigger loading when search or filters change
  useEffect(() => {
    refreshAllColumns();
  }, [refreshAllColumns]);

  // Handle Infinite Scroll within a Column container
  const handleColumnScroll = useCallback((statusKey, e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const col = columnsData[statusKey];

    if (scrollHeight - scrollTop - clientHeight < 80) {
      if (col && !col.loading && !col.loadingMore && col.hasMore) {
        fetchColumnPage(statusKey, col.page + 1, true);
      }
    }
  }, [columnsData, fetchColumnPage]);

  // =========================================================================
  // TABLE VIEW DATA FETCH
  // =========================================================================
  const { data: tableTasksData, loading: tableTasksLoading, refresh: refreshTableTasks } = useGet(
    viewMode === 'table' 
      ? `${endpoint}?page=${tablePage}&limit=10&search=${debouncedSearch}&project_id=${projectId}&user_id=${userIdFilter}`
      : null
  );
  const tableTasks = tableTasksData?.tasks || tableTasksData?.Tasks || [];
  const tablePagination = tableTasksData?.pagination || { totalPages: 1, page: 1, total: 0 };

  const [tableTaskList, setTableTaskList] = useState([]);
  const [draggedTableIndex, setDraggedTableIndex] = useState(null);
  const [dragOverTableIndex, setDragOverTableIndex] = useState(null);

  useEffect(() => {
    if (tableTasksData?.tasks || tableTasksData?.Tasks) {
      setTableTaskList(tableTasksData?.tasks || tableTasksData?.Tasks);
    }
  }, [tableTasksData]);

  const { mutate } = useMutation();

  // =========================================================================
  // KANBAN DRAG AND DROP HANDLERS (Card reorder within column & across columns)
  // =========================================================================
  const handleDragStart = (e, task, colId, index) => {
    if (isSelectionMode) return;
    setDraggedTask(task);
    setDraggedFromCol(colId || task.status);
    setDraggedFromIndex(index ?? null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOverCol = (e, statusKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== statusKey) {
      setDragOverCol(statusKey);
    }
  };

  const handleDragLeaveCol = (e, statusKey) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === statusKey) {
      setDragOverCol(null);
    }
  };

  const handleDragOverCard = (e, targetTask, targetColId, targetIndex) => {
    if (!draggedTask) return;
    if (draggedTask.id === targetTask.id) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCardId !== targetTask.id) {
      setDragOverCardId(targetTask.id);
    }
    if (dragOverCol !== targetColId) {
      setDragOverCol(targetColId);
    }
  };

  const handleDragLeaveCard = (e, targetTask) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCardId === targetTask.id) {
      setDragOverCardId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDraggedFromCol(null);
    setDraggedFromIndex(null);
    setDragOverCol(null);
    setDragOverCardId(null);
  };

  // Dropping on another card in Kanban: Reorders within column or places at index
  const handleDropOnCard = async (e, targetTask, targetColId, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(null);
    setDragOverCol(null);

    const taskToMove = draggedTask;
    if (!taskToMove || taskToMove.id === targetTask.id) {
      setDraggedTask(null);
      return;
    }

    const sourceStatus = draggedFromCol || taskToMove.status;
    const isSameColumn = sourceStatus === targetColId;

    // Permissions check
    if (!isSameColumn) {
      if (!isAdmin && (targetColId === 'approve' || targetColId === 'edit')) {
        toast.error("You don't have permission to approve tasks or request revision");
        setDraggedTask(null);
        return;
      }
      if (taskToMove.status === 'approve' && !isAdmin) {
        toast.error("You don't have permission to modify approved tasks");
        setDraggedTask(null);
        return;
      }
    }

    const previousColumnsData = { ...columnsData };

    if (isSameColumn) {
      const colTasks = [...(columnsData[sourceStatus]?.tasks || [])];
      const fromIdx = colTasks.findIndex(t => t.id === taskToMove.id);
      if (fromIdx === -1) {
        setDraggedTask(null);
        return;
      }

      const [removed] = colTasks.splice(fromIdx, 1);
      colTasks.splice(targetIndex, 0, removed);

      setColumnsData(prev => ({
        ...prev,
        [sourceStatus]: {
          ...prev[sourceStatus],
          tasks: colTasks
        }
      }));

      setDraggedTask(null);
      setDraggedFromCol(null);
      setDraggedFromIndex(null);

      if (isAdmin) {
        const payload = colTasks.map((t, idx) => ({
          id: t.id,
          sort: idx + 1
        }));
        try {
          await apiClient.put('/api/admin/tasks/reorder', { tasks: payload });
          toast.success('تم تحديث ترتيب المهام بنجاح');
          if (viewMode === 'table') refreshTableTasks?.();
        } catch (err) {
          console.error('Failed to reorder tasks:', err);
          toast.error('فشل في حفظ ترتيب المهام');
          setColumnsData(previousColumnsData);
        }
      }
    } else {
      const sourceTasks = (columnsData[sourceStatus]?.tasks || []).filter(t => t.id !== taskToMove.id);
      const targetTasks = [...(columnsData[targetColId]?.tasks || []).filter(t => t.id !== taskToMove.id)];

      const updatedTask = { ...taskToMove, status: targetColId };
      targetTasks.splice(targetIndex, 0, updatedTask);

      setColumnsData(prev => ({
        ...prev,
        [sourceStatus]: {
          ...prev[sourceStatus],
          tasks: sourceTasks,
          total: Math.max(0, (prev[sourceStatus]?.total || 0) - 1)
        },
        [targetColId]: {
          ...prev[targetColId],
          tasks: targetTasks,
          total: (prev[targetColId]?.total || 0) + 1
        }
      }));

      setDraggedTask(null);
      setDraggedFromCol(null);
      setDraggedFromIndex(null);

      if (isAdmin) {
        const payload = targetTasks.map((t, idx) => ({
          id: t.id,
          sort: idx + 1,
          status: targetColId
        }));
        try {
          await apiClient.put('/api/admin/tasks/reorder', { tasks: payload });
          const targetColInfo = KANBAN_COLUMNS.find(c => c.id === targetColId);
          toast.success(`Task moved to ${targetColInfo?.label || targetColId}`);
          if (viewMode === 'table') refreshTableTasks?.();
        } catch (err) {
          console.error('Failed to move/reorder task:', err);
          toast.error('فشل في نقل وترتيب المهمة');
          setColumnsData(previousColumnsData);
        }
      } else {
        try {
          await apiClient.put(`/api/admin/tasks/${taskToMove.id}`, { status: targetColId });
          const targetColInfo = KANBAN_COLUMNS.find(c => c.id === targetColId);
          toast.success(`Task moved to ${targetColInfo?.label || targetColId}`);
          if (viewMode === 'table') refreshTableTasks?.();
        } catch (err) {
          console.error('Failed to move task:', err);
          toast.error('فشل في نقل المهمة');
          setColumnsData(previousColumnsData);
        }
      }
    }
  };

  // Move task status handler
  const handleMoveTaskStatus = async (taskId, newStatus) => {
    let targetTask = null;
    let oldStatus = null;

    for (const key of Object.keys(columnsData)) {
      const found = columnsData[key].tasks.find(t => t.id === taskId);
      if (found) {
        targetTask = found;
        oldStatus = key;
        break;
      }
    }

    if (!targetTask && viewMode === 'table') {
      targetTask = tableTaskList.find(t => t.id === taskId);
      oldStatus = targetTask?.status;
    }

    if (!targetTask || oldStatus === newStatus) return;

    // Permissions check
    if (!isAdmin && (newStatus === 'approve' || newStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      setDragOverCol(null);
      return;
    }

    if (targetTask.status === 'approve' && !isAdmin) {
      toast.error("You don't have permission to modify approved tasks");
      setDragOverCol(null);
      return;
    }

    // Optimistic UI Update in columns
    const updatedTask = { ...targetTask, status: newStatus };
    setColumnsData(prev => {
      const sourceCol = prev[oldStatus] || { tasks: [], total: 0 };
      const destCol = prev[newStatus] || { tasks: [], total: 0 };

      return {
        ...prev,
        [oldStatus]: {
          ...sourceCol,
          tasks: sourceCol.tasks.filter(t => t.id !== taskId),
          total: Math.max(0, sourceCol.total - 1)
        },
        [newStatus]: {
          ...destCol,
          tasks: [updatedTask, ...destCol.tasks.filter(t => t.id !== taskId)],
          total: destCol.total + 1
        }
      };
    });

    if (viewMode === 'table') {
      setTableTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }

    try {
      const res = await mutate({
        method: 'PUT',
        url: `/api/admin/tasks/${taskId}`,
        data: { status: newStatus }
      });

      if (res?.success) {
        toast.success(`Task moved to ${KANBAN_COLUMNS.find(c => c.id === newStatus)?.label || newStatus}`);
        if (viewMode === 'table') refreshTableTasks();
      } else {
        toast.error(res?.message || 'Failed to update task status');
        refreshAllColumns();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('An error occurred while updating status');
      refreshAllColumns();
    } finally {
      setDragOverCol(null);
      setDraggedTask(null);
      setDraggedFromCol(null);
      setDraggedFromIndex(null);
    }
  };

  const handleDropOnCol = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTask?.id;
    if (!taskId) return;

    handleMoveTaskStatus(taskId, targetStatus);
  };

  // =========================================================================
  // TABLE VIEW DRAG AND DROP REORDER (Leader / Admin)
  // =========================================================================
  const handleTableDragStart = (e, index) => {
    if (!isAdmin || debouncedSearch) return;
    setDraggedTableIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleTableDragOver = (e, index) => {
    if (!isAdmin || debouncedSearch) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTableIndex !== index) {
      setDragOverTableIndex(index);
    }
  };

  const handleTableDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
  };

  const handleTableDragEnd = () => {
    setDraggedTableIndex(null);
    setDragOverTableIndex(null);
  };

  const handleTableDrop = async (e, targetIndex) => {
    if (!isAdmin || debouncedSearch) return;
    e.preventDefault();

    if (draggedTableIndex === null || draggedTableIndex === undefined || draggedTableIndex === targetIndex) {
      setDraggedTableIndex(null);
      setDragOverTableIndex(null);
      return;
    }

    const previousList = [...tableTaskList];
    const updated = [...tableTaskList];
    const [movedItem] = updated.splice(draggedTableIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setTableTaskList(updated);
    setDraggedTableIndex(null);
    setDragOverTableIndex(null);

    const payload = updated.map((t, idx) => ({
      id: t.id,
      sort: (tablePage - 1) * 10 + idx + 1
    }));

    try {
      await apiClient.put('/api/admin/tasks/reorder', { tasks: payload });
      toast.success('تم تحديث ترتيب المهام بنجاح');
      refreshAllColumns();
    } catch (err) {
      console.error('Error reordering tasks:', err);
      toast.error('فشل في حفظ ترتيب المهام');
      setTableTaskList(previousList);
      if (refreshTableTasks) refreshTableTasks();
    }
  };

  // Importance change
  const handleImportanceChange = async (taskId, newImportance) => {
    try {
      const res = await mutate({
        method: 'PUT',
        url: `/api/admin/tasks/${taskId}`,
        data: { importanc_status: newImportance }
      });

      if (res?.success) {
        toast.success(`Importance updated to ${newImportance}`);
        setColumnsData(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = {
              ...updated[key],
              tasks: updated[key].tasks.map(t => t.id === taskId ? { ...t, importanc_status: newImportance } : t)
            };
          });
          return updated;
        });
        if (viewMode === 'table') refreshTableTasks();
      }
    } catch (err) {
      console.error('Failed to change importance:', err);
      toast.error('Failed to update importance');
    }
  };

  // Delete task
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/tasks/${id}`
    });

    if (response?.success) {
      toast.success('Task deleted successfully');
      setColumnsData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          next[key] = {
            ...next[key],
            tasks: next[key].tasks.filter(t => t.id !== id),
            total: Math.max(0, next[key].total - 1)
          };
        });
        return next;
      });
      if (viewMode === 'table') refreshTableTasks();
    } else {
      toast.error(response?.message || 'Failed to delete task');
    }
  };

  // Documentation viewer / downloader
  const handleViewDoc = (e, docString) => {
    e.preventDefault();
    e.stopPropagation();
    if (!docString) return;
    
    try {
      if (docString.startsWith('data:')) {
        const arr = docString.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        let ext = 'file';
        if(mime.includes('word')) ext = 'docx';
        else if(mime.includes('excel') || mime.includes('spreadsheet')) ext = 'xlsx';
        else if(mime.includes('zip')) ext = 'zip';
        else if(mime.includes('pdf')) ext = 'pdf';
        else if(mime.includes('image/jpeg')) ext = 'jpg';
        else if(mime.includes('image/png')) ext = 'png';
        
        link.download = `document_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        window.open(docString, '_blank');
      }
    } catch {
      window.open(docString, '_blank');
    }
  };

  // Selection mode helpers
  const toggleTaskSelection = (id) => {
    setSelectedTaskIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkMove = async () => {
    if (selectedTaskIds.length === 0) return;

    if (!isAdmin && (bulkTargetStatus === 'approve' || bulkTargetStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const res = await mutate({
        method: 'PUT',
        url: '/api/admin/tasks/bulk-status',
        data: {
          task_ids: selectedTaskIds,
          status: bulkTargetStatus
        }
      });

      if (res?.success) {
        toast.success(`Successfully moved ${selectedTaskIds.length} tasks to ${KANBAN_COLUMNS.find(c => c.id === bulkTargetStatus)?.label || bulkTargetStatus}`);
        setSelectedTaskIds([]);
        setIsSelectionMode(false);
        refreshAllColumns();
        if (viewMode === 'table') refreshTableTasks();
      } else {
        toast.error(res?.message || 'Failed to update selected tasks');
      }
    } catch (err) {
      console.error('Bulk update error:', err);
      toast.error('An error occurred during bulk update');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const cardProps = {
    isSelectionMode,
    onToggleSelect: toggleTaskSelection,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onOpenModal: (task) => navigate(`/admin/tasks/${task.id}/view`),
    onDelete: handleDelete,
    onStatusChange: handleMoveTaskStatus,
    onImportanceChange: handleImportanceChange,
    onViewDoc: handleViewDoc,
    isLeaderOrAdmin: isAdmin,
    isAdmin,
    getRoleName,
    availableColumns: KANBAN_COLUMNS
  };

  const totalTasksCount = Object.values(columnsData).reduce((acc, curr) => acc + (curr.total || 0), 0);

  const getStatusStyles = (status) => {
    switch(status) {
      case 'pending': return { color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-700', label: 'Pending' };
      case 'inprogress': return { color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700', label: 'In Progress' };
      case 'done': return { color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', label: 'Completed' };
      case 'edit': return { color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700', label: 'Need to Revision' };
      case 'approve': return { color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700', label: 'Approved' };
      default: return { color: 'bg-muted0', badge: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  const getImportanceStyles = (status) => {
    switch(status?.toLowerCase()) {
      case 'urgent': return 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800';
      case 'high': return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300';
      case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300';
      case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <nav className="mb-2 text-sm text-muted-foreground flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer border-none bg-transparent p-0 mr-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
            <span>/</span>
            <span className="font-semibold text-foreground">{pageTitle}</span>
          </nav>
          
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {pageTitle}
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
              {totalTasksCount} Tasks
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Manage, drag & drop, and track tasks across status columns with infinite scroll.
          </p>
        </div>

        {/* Toolbar: Search, Project Filter, User Filter, Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Project Filter */}
          <div className="relative min-w-[140px] flex-1 sm:flex-initial">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full h-10 appearance-none rounded-xl border border-input bg-card pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
            >
              <option value="">All Projects</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <FolderKanban className="pointer-events-none absolute right-2.5 top-3 w-4 h-4 text-muted-foreground" />
          </div>

          {/* User Filter */}
          <div className="relative min-w-[140px] flex-1 sm:flex-initial">
            <select
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full h-10 appearance-none rounded-xl border border-input bg-card pl-3 pr-8 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground cursor-pointer"
            >
              <option value="">All Users</option>
              {usersList.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({getRoleName(u.role)})</option>
              ))}
            </select>
            <UserIcon className="pointer-events-none absolute right-2.5 top-3 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56 min-w-[160px]">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 text-xs sm:text-sm rounded-xl border-input bg-card"
            />
          </div>

          {/* Refresh button */}
          <button
            onClick={() => {
              refreshAllColumns();
              if (viewMode === 'table') refreshTableTasks();
            }}
            title="Refresh All Columns"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-input bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Selection Mode Toggle */}
          <button
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedTaskIds([]);
            }}
            title={isSelectionMode ? "Exit Selection Mode" : "Select multiple tasks to move"}
            className={`h-10 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isSelectionMode 
                ? 'bg-primary text-white border-primary shadow-xs' 
                : 'bg-card border-input text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <span className="hidden sm:inline">Select Mode</span>
          </button>

          {/* View Mode Toggle: Kanban vs Table */}
          <div className="flex items-center rounded-xl border border-input bg-card p-1 shadow-xs">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none ${
                viewMode === 'kanban' 
                  ? 'bg-primary text-white font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KanbanIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none ${
                viewMode === 'table' 
                  ? 'bg-primary text-white font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Status Tabs (Shown on screens < md) */}
      {viewMode === 'kanban' && (
        <div className="block md:hidden mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {KANBAN_COLUMNS.map((col) => {
              const count = columnsData[col.id]?.total || 0;
              const isActive = mobileActiveTab === col.id;
              return (
                <button
                  key={col.id}
                  onClick={() => setMobileActiveTab(col.id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-md scale-102'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-white' : col.dotColor}`} />
                  <span>{col.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-muted text-foreground'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Floating Selection Mode Batch Bar */}
      {isSelectionMode && selectedTaskIds.length > 0 && (
        <div className="sticky top-20 z-30 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-card/95 p-3.5 shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-extrabold">
              {selectedTaskIds.length}
            </span>
            <span className="text-sm font-bold text-foreground">
              Tasks selected
            </span>
            <button
              onClick={() => setSelectedTaskIds([])}
              className="text-xs text-muted-foreground hover:text-destructive underline ml-2 cursor-pointer border-none bg-transparent"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-muted-foreground">Move to:</span>
            <select
              value={bulkTargetStatus}
              onChange={(e) => setBulkTargetStatus(e.target.value)}
              className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
            >
              <option value="pending">Pending</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Completed</option>
              <option value="edit" disabled={!isAdmin}>
                {isAdmin ? 'Need to Revision' : 'Need to Revision (Leader 🔒)'}
              </option>
              <option value="approve" disabled={!isAdmin}>
                {isAdmin ? 'Approved' : 'Approved (Leader 🔒)'}
              </option>
            </select>

            <Button
              onClick={handleBulkMove}
              disabled={isBulkUpdating}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white shadow-xs"
            >
              {isBulkUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              <span>Apply Move</span>
            </Button>
          </div>
        </div>
      )}

      {/* MAIN VIEW: Kanban or Table */}
      {viewMode === 'kanban' ? (
        <div className="w-full">
          {/* Desktop Kanban: 5 scrollable columns side-by-side */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
            {KANBAN_COLUMNS.map((col) => {
              const colState = columnsData[col.id] || { tasks: [], total: 0, loading: false, loadingMore: false, hasMore: false };
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  tasks={colState.tasks}
                  total={colState.total}
                  loading={colState.loading}
                  loadingMore={colState.loadingMore}
                  hasMore={colState.hasMore}
                  onScroll={handleColumnScroll}
                  isDragOver={dragOverCol === col.id}
                  onDragOver={handleDragOverCol}
                  onDragLeave={handleDragLeaveCol}
                  onDrop={handleDropOnCol}
                  dragOverCardId={dragOverCardId}
                  onDragOverCard={handleDragOverCard}
                  onDragLeaveCard={handleDragLeaveCard}
                  onDropOnCard={handleDropOnCard}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onAddTask={null}
                  cardProps={{
                    ...cardProps,
                    isSelected: (id) => selectedTaskIds.includes(id),
                  }}
                />
              );
            })}
          </div>

          {/* Mobile Kanban: Single active column selected via top tabs */}
          <div className="block md:hidden">
            {(() => {
              const activeCol = KANBAN_COLUMNS.find(c => c.id === mobileActiveTab) || KANBAN_COLUMNS[0];
              const colState = columnsData[activeCol.id] || { tasks: [], total: 0, loading: false, loadingMore: false, hasMore: false };
              return (
                <KanbanColumn
                  column={activeCol}
                  tasks={colState.tasks}
                  total={colState.total}
                  loading={colState.loading}
                  loadingMore={colState.loadingMore}
                  hasMore={colState.hasMore}
                  onScroll={handleColumnScroll}
                  isDragOver={dragOverCol === activeCol.id}
                  onDragOver={handleDragOverCol}
                  onDragLeave={handleDragLeaveCol}
                  onDrop={handleDropOnCol}
                  dragOverCardId={dragOverCardId}
                  onDragOverCard={handleDragOverCard}
                  onDragLeaveCard={handleDragLeaveCard}
                  onDropOnCard={handleDropOnCard}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onAddTask={null}
                  cardProps={{
                    ...cardProps,
                    isSelected: (id) => selectedTaskIds.includes(id),
                  }}
                />
              );
            })()}
          </div>
        </div>
      ) : (
        /* Classic Table View with Drag & Drop Reordering */
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-muted-foreground">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {isAdmin && !debouncedSearch && (
                    <th className="w-10 px-2 py-4 text-center">
                      <span className="sr-only">Reorder</span>
                    </th>
                  )}
                  <th className="px-6 py-4 font-bold text-foreground">Task Details</th>
                  <th className="px-6 py-4 font-bold text-foreground">Project / Group</th>
                  <th className="px-6 py-4 font-bold text-foreground">Assigned User</th>
                  <th className="px-6 py-4 font-bold text-foreground">Delivery Date</th>
                  <th className="px-6 py-4 font-bold text-foreground">Importance</th>
                  <th className="px-6 py-4 font-bold text-foreground">Status</th>
                  <th className="px-6 py-4 font-bold text-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableTasksLoading && tableTaskList.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin && !debouncedSearch ? 8 : 7} className="px-6 py-12 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground font-medium">Loading tasks...</p>
                    </td>
                  </tr>
                ) : (tableTaskList.length > 0 ? tableTaskList : tableTasks).length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin && !debouncedSearch ? 8 : 7} className="px-6 py-12 text-center">
                      <p className="text-base font-semibold text-foreground">No tasks found</p>
                      <p className="text-sm text-muted-foreground">There are no tasks matching this filter.</p>
                    </td>
                  </tr>
                ) : (
                  (tableTaskList.length > 0 ? tableTaskList : tableTasks).map((task, index) => {
                    const style = getStatusStyles(task.status);
                    const isUrgent = (
                      task.importanc_status?.toLowerCase?.() === 'urgent' ||
                      task.importance?.toLowerCase?.() === 'urgent' ||
                      (task.date_urgent && String(task.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
                    ) && task.status !== 'approve';

                    const isBeingDraggedOver = dragOverTableIndex === index;

                    return (
                      <tr 
                        key={task.id} 
                        draggable={isAdmin && !debouncedSearch}
                        onDragStart={(e) => handleTableDragStart(e, index)}
                        onDragOver={(e) => handleTableDragOver(e, index)}
                        onDragLeave={handleTableDragLeave}
                        onDragEnd={handleTableDragEnd}
                        onDrop={(e) => handleTableDrop(e, index)}
                        onClick={() => navigate(`/admin/tasks/${task.id}/view`)}
                        className={`group cursor-pointer transition-all ${
                          isBeingDraggedOver ? 'border-t-2 border-primary bg-primary/10' : ''
                        } ${
                          isUrgent ? 'urgent-row-glow' : 'hover:bg-muted/50'
                        }`}
                      >
                        {isAdmin && !debouncedSearch && (
                          <td 
                            className="w-10 px-2 py-5 text-center cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            title="اسحب لإعادة الترتيب (Drag to reorder)"
                          >
                            <GripVertical className="w-4 h-4 mx-auto" />
                          </td>
                        )}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                                {task.name}
                              </span>
                              {task.user_role && (
                                <ProjectRoleBadge role={task.user_role} />
                              )}
                            </div>
                            <span className="mt-1 text-sm text-muted-foreground line-clamp-2 max-w-md">{task.description || <span className="italic">No description</span>}</span>
                            {task.documentation && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDoc(e, task.documentation);
                                }} 
                                className="mt-2 inline-flex w-fit items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded hover:bg-primary/20 transition-colors cursor-pointer border-none"
                              >
                                Documentation
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{task.project_name || 'N/A'}</span>
                            <span className="text-xs text-muted-foreground">{task.project_group || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            {task.user_image ? (
                              <img 
                                src={task.user_image} 
                                alt={task.user_name} 
                                className="h-9 w-9 rounded-full object-cover border border-border" 
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold border border-primary/20">
                                {task.user_name ? task.user_name.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">{task.user_name || 'Unassigned'}</span>
                              <span className="text-xs text-muted-foreground">{task.user_phone || getRoleName('engineer')}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center text-foreground font-medium text-xs sm:text-sm">
                              <Calendar className="w-4 h-4 mr-1.5 text-muted-foreground shrink-0" />
                              {task.delivery_date ? (typeof task.delivery_date === 'string' ? dayjs(task.delivery_date.split('T')[0]).format('MMM DD, YYYY') : dayjs(task.delivery_date).format('MMM DD, YYYY')) : 'Not Set'}
                            </div>
                            {task.date_urgent && (
                              <span 
                                title={`Urgent from: ${dayjs(task.date_urgent).format('MMM DD, YYYY')}`}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 rounded-md w-fit"
                              >
                                <AlarmClock className="w-3 h-3 text-rose-600" />
                                Urgent: {dayjs(task.date_urgent).format('MMM DD')}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {isUrgent && (
                              <span className="relative flex h-2.5 w-2.5 shrink-0" title="Urgent Task">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                              </span>
                            )}
                            <select
                              value={task.importanc_status || 'medium'}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleImportanceChange(task.id, e.target.value)}
                            disabled={!isAdmin}
                            className={`inline-flex appearance-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${!isAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer focus:ring-2 focus:ring-primary/50'} focus:outline-none border transition-all ${getImportanceStyles(task.importanc_status || 'medium')}`}
                            style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                          >
                            <option value="low" className="bg-card text-foreground">Low</option>
                            <option value="medium" className="bg-card text-foreground">Medium</option>
                            <option value="high" className="bg-card text-foreground">High</option>
                            <option value="urgent" className="bg-card text-foreground">Urgent</option>
                          </select>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {task.status === 'approve' && !isAdmin ? (
                            <span 
                              title="Approved task: Locked (Only Leader or Admin can request revision)"
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 select-none cursor-not-allowed"
                            >
                              <Lock className="w-3 h-3 text-purple-600" />
                              Approved (Locked)
                            </span>
                          ) : (
                            <select
                              value={task.status}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => handleMoveTaskStatus(task.id, e.target.value)}
                              className={`inline-flex appearance-none items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 ${style.badge}`}
                              style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
                            >
                              <option value="pending" className="bg-card text-foreground">Pending</option>
                              <option value="inprogress" className="bg-card text-foreground">In Progress</option>
                              <option value="done" className="bg-card text-foreground">Completed</option>
                              <option 
                                value="edit" 
                                disabled={!isAdmin}
                                className="bg-card text-foreground"
                              >
                                {!isAdmin ? 'Need to Revision (Leader 🔒)' : 'Need to Revision'}
                              </option>
                              <option 
                                value="approve" 
                                disabled={!isAdmin}
                                className="bg-card text-foreground"
                              >
                                {!isAdmin ? 'Approved (Leader 🔒)' : 'Approved'}
                              </option>
                            </select>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/admin/tasks/${task.id}/view`)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                title="Delete Task"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Table Pagination */}
          {tablePagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4 rounded-b-2xl">
              <span className="text-sm text-muted-foreground font-medium">Showing page {tablePage} of {tablePagination.totalPages}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={tablePage === 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="rounded-xl"
                >
                  Previous
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={tablePage === tablePagination.totalPages}
                  onClick={() => setTablePage(p => Math.min(tablePagination.totalPages, p + 1))}
                  className="rounded-xl"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Summary Stats Cards */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KANBAN_COLUMNS.map((col) => {
          const count = columnsData[col.id]?.total || 0;
          return (
            <div 
              key={col.id} 
              onClick={() => {
                setViewMode('kanban');
                setMobileActiveTab(col.id);
              }}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  {col.label}
                </span>
                <span className={`h-2.5 w-2.5 rounded-full ${col.dotColor}`} />
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-foreground tracking-tight">
                  {count}
                </span>
                <span className="text-[11px] font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FilteredTasks;
