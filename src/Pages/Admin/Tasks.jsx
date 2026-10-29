import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGet } from '@/hooks/useGet';
import { useMutation } from '@/hooks/useMutation';
import { 
  Loader2, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  X, 
  Calendar, 
  Eye, 
  GripVertical,
  CheckSquare,
  Square,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  ArrowRight,
  Check,
  ChevronDown,
  Lock,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';
import { isAdminRole } from '@/utils/auth';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';
import { isTaskDelayedCompleted } from '@/lib/utils';

// Column definitions for the Kanban Board (Order: Pending, In Progress, Completed, Need to Revision, Approved)
const KANBAN_COLUMNS = [
  {
    id: 'pending',
    label: 'Pending',
    labelAr: 'قيد الانتظار',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200',
    headerBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dotColor: 'bg-amber-500',
    dropHighlight: 'ring-2 ring-amber-400 bg-amber-50/40 dark:bg-amber-950/20',
  },
  {
    id: 'inprogress',
    label: 'In Progress',
    labelAr: 'جاري التنفيذ',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200',
    headerBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    dotColor: 'bg-blue-500',
    dropHighlight: 'ring-2 ring-blue-400 bg-blue-50/40 dark:bg-blue-950/20',
  },
  {
    id: 'delay',
    label: 'Delay',
    labelAr: 'المتأخرة',
    badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    headerBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    dotColor: 'bg-rose-500',
    dropHighlight: 'ring-2 ring-rose-400 bg-rose-50/40 dark:bg-rose-950/20',
    isDelayColumn: true,
  },
  {
    id: 'done',
    label: 'Completed',
    labelAr: 'مكتمل',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200',
    headerBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dotColor: 'bg-emerald-500',
    dropHighlight: 'ring-2 ring-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20',
  },
  {
    id: 'edit',
    label: 'Need to Revision',
    labelAr: 'بحاجة لتعديل',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200',
    headerBg: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    dotColor: 'bg-orange-500',
    dropHighlight: 'ring-2 ring-orange-400 bg-orange-50/40 dark:bg-orange-950/20',
  },
  {
    id: 'approve',
    label: 'Approved',
    labelAr: 'معتمد',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200',
    headerBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    dotColor: 'bg-purple-500',
    dropHighlight: 'ring-2 ring-purple-400 bg-purple-50/40 dark:bg-purple-950/20',
  },
];

const initialColumnsState = {
  pending: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
  inprogress: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
  delay: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
  done: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
  edit: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
  approve: { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false },
};

const Tasks = () => {
  const { getRoleName, getRoleNamePlural } = useRoleNames();
  const { projectId, groupId } = useParams();
  const navigate = useNavigate();
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role?.toLowerCase?.() || '';
  const isAdmin = isAdminRole(userRole);
  const { data: projectDetailsData } = useGet(projectId ? `/api/admin/project/${projectId}` : null);
  const projectUserRole = projectDetailsData?.Project?.user_role || (isAdmin ? 'admin' : 'engineer');
  const isLeaderOrAdmin = projectUserRole === 'leader' || isAdmin;
  
  // View mode: 'kanban' (default) or 'table'
  const [viewMode, setViewMode] = useState('kanban');

  // Status Filter state ('all', 'pending', 'inprogress', 'done', 'edit', 'approve')
  const [statusFilter, setStatusFilter] = useState('all');

  // Kanban Column Width preference ('compact', 'normal', 'wide')
  const [columnWidth, setColumnWidth] = useState(() => {
    return localStorage.getItem('kanban_column_width') || 'normal';
  });

  const handleWidthChange = (val) => {
    setColumnWidth(val);
    localStorage.setItem('kanban_column_width', val);
  };

  // Search state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Mobile active tab for column view
  const [mobileActiveTab, setMobileActiveTab] = useState('pending');

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setTablePage(1);
    if (status !== 'all') {
      setMobileActiveTab(status);
    }
  };

  // Selection mode & multi-select state ("by selection")
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('inprogress');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Kanban Columns Data state (each status has independent tasks, page, and pagination)
  const [columnsData, setColumnsData] = useState(initialColumnsState);

  // Filtered columns list based on statusFilter
  const filteredColumns = statusFilter && statusFilter !== 'all'
    ? KANBAN_COLUMNS.filter(c => c.id === statusFilter)
    : KANBAN_COLUMNS;

  // Responsive dynamic width class for columns based on preset & number of visible columns
  const getColumnWidthClass = () => {
    if (filteredColumns.length === 1) {
      return 'w-full max-w-3xl flex-1 mx-auto md:mx-0';
    }
    if (filteredColumns.length === 2) {
      return 'min-w-[360px] md:min-w-[420px] flex-1';
    }
    switch (columnWidth) {
      case 'compact':
        return 'min-w-[290px] sm:min-w-[310px] flex-1';
      case 'wide':
        return 'min-w-[400px] sm:min-w-[440px] lg:min-w-[480px] flex-1';
      case 'normal':
      default:
        return 'min-w-[340px] sm:min-w-[360px] lg:min-w-[380px] flex-1';
    }
  };

  // Kanban Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromCol, setDraggedFromCol] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // Table View state & drag and drop reordering
  const [tablePage, setTablePage] = useState(1);
  const tableLimit = 50;
  const statusParam = statusFilter && statusFilter !== 'all' ? `&status=${statusFilter}` : '';
  const { data: tableTasksData, loading: tableTasksLoading, refresh: refreshTableTasks } = useGet(
    viewMode === 'table' && groupId
      ? `/api/admin/tasks?group_id=${groupId}&page=${tablePage}&limit=${tableLimit}&search=${debouncedSearch}${statusParam}`
      : null
  );
  const [tableTaskList, setTableTaskList] = useState([]);
  const [draggedTableIndex, setDraggedTableIndex] = useState(null);
  const [dragOverTableIndex, setDragOverTableIndex] = useState(null);

  useEffect(() => {
    if (tableTasksData?.tasks) {
      setTableTaskList(tableTasksData.tasks);
    }
  }, [tableTasksData?.tasks]);

  const tablePagination = tableTasksData?.pagination || { totalPages: 1, page: 1, total: 0 };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch initial page 1 for a single column
  const fetchColumnPage = useCallback(async (statusKey, pageNum = 1, append = false) => {
    if (!groupId) return;

    setColumnsData(prev => ({
      ...prev,
      [statusKey]: {
        ...prev[statusKey],
        loading: !append,
        loadingMore: append
      }
    }));

    try {
      const queryParams = {
        group_id: groupId,
        status: statusKey,
        page: pageNum,
        limit: 12,
        search: debouncedSearch
      };
      if (statusKey !== 'delay' && statusKey !== 'done' && statusKey !== 'approve') {
        queryParams.exclude_delayed = true;
      }

      const res = await apiClient.get('/api/admin/tasks', {
        params: queryParams
      });

      const data = res?.data?.data || res?.data || {};
      const fetchedTasks = data.tasks || [];
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
  }, [groupId, debouncedSearch]);

  // Fetch all columns initial data
  const refreshAllColumns = useCallback(() => {
    KANBAN_COLUMNS.forEach(col => {
      fetchColumnPage(col.id, 1, false);
    });
  }, [fetchColumnPage]);

  // Trigger loading when groupId or debouncedSearch changes
  useEffect(() => {
    refreshAllColumns();
  }, [refreshAllColumns]);

  // Handle Infinite Scroll within a Column container
  const handleColumnScroll = useCallback((statusKey, e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const col = columnsData[statusKey];

    // Check if scrolled near bottom (within 80px)
    if (scrollHeight - scrollTop - clientHeight < 80) {
      if (col && !col.loading && !col.loadingMore && col.hasMore) {
        fetchColumnPage(statusKey, col.page + 1, true);
      }
    }
  }, [columnsData, fetchColumnPage]);

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

  // Dropping on another card: Reorders tasks inside the column or places task at specific index
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

    if (targetColId === 'delay') {
      toast.error('لا يمكن نقل المهام إلى خانة التأخير يدويًا - تظهر المهام هنا تلقائيًا عند تجاوز موعد التسليم');
      setDraggedTask(null);
      return;
    }

    // Permissions check
    if (!isSameColumn) {
      if (!isLeaderOrAdmin && (targetColId === 'approve' || targetColId === 'edit')) {
        toast.error("You don't have permission to approve tasks or request revision");
        setDraggedTask(null);
        return;
      }
      if (taskToMove.status === 'approve' && !isLeaderOrAdmin) {
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

      // Optimistic update
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

      // Persist reorder if Leader or Admin
      if (isLeaderOrAdmin) {
        const payload = colTasks.map((t, idx) => ({
          id: t.id,
          sort: idx + 1
        }));
        try {
          await apiClient.put('/api/admin/tasks/reorder', { tasks: payload });
          toast.success('تم تحديث ترتيب المهام بنجاح');
          if (refreshTableTasks) refreshTableTasks();
        } catch (err) {
          console.error('Failed to reorder tasks:', err);
          toast.error('فشل في حفظ ترتيب المهام');
          setColumnsData(previousColumnsData);
        }
      }
    } else {
      // Move from sourceStatus to targetColId at exact targetIndex
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

      if (isLeaderOrAdmin) {
        const payload = targetTasks.map((t, idx) => ({
          id: t.id,
          sort: idx + 1,
          status: targetColId
        }));
        try {
          await apiClient.put('/api/admin/tasks/reorder', { tasks: payload });
          const targetColInfo = KANBAN_COLUMNS.find(c => c.id === targetColId);
          toast.success(`Task moved to ${targetColInfo?.label || targetColId}`);
          if (refreshTableTasks) refreshTableTasks();
        } catch (err) {
          console.error('Failed to move and reorder task:', err);
          toast.error('فشل في نقل وترتيب المهمة');
          setColumnsData(previousColumnsData);
        }
      } else {
        try {
          await apiClient.put(`/api/admin/tasks/${taskToMove.id}`, { status: targetColId });
          const targetColInfo = KANBAN_COLUMNS.find(c => c.id === targetColId);
          toast.success(`Task moved to ${targetColInfo?.label || targetColId}`);
          if (refreshTableTasks) refreshTableTasks();
        } catch (err) {
          console.error('Failed to move task:', err);
          toast.error('فشل في نقل المهمة');
          setColumnsData(previousColumnsData);
        }
      }
    }
  };

  // Move task to a new status (used by Status picker and Column Dropzone)
  const handleMoveTaskStatus = async (taskId, newStatus) => {
    let targetTask = draggedTask;
    let sourceStatus = draggedFromCol || targetTask?.status;

    if (!targetTask) {
      for (const col of Object.keys(columnsData)) {
        const found = columnsData[col].tasks.find(t => t.id === taskId);
        if (found) {
          targetTask = found;
          sourceStatus = col;
          break;
        }
      }
    }

    if (!targetTask && viewMode === 'table') {
      targetTask = tableTaskList.find(t => t.id === taskId);
      sourceStatus = targetTask?.status;
    }

    if (!targetTask || sourceStatus === newStatus) {
      setDragOverCol(null);
      setDragOverCardId(null);
      setDraggedTask(null);
      return;
    }

    if (newStatus === 'delay') {
      toast.error('لا يمكن نقل المهام إلى خانة التأخير يدويًا - تظهر المهام هنا تلقائيًا عند تجاوز موعد التسليم');
      setDragOverCol(null);
      setDragOverCardId(null);
      setDraggedTask(null);
      return;
    }

    // Permission validations
    if (!isLeaderOrAdmin && (newStatus === 'approve' || newStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      setDragOverCol(null);
      setDragOverCardId(null);
      setDraggedTask(null);
      return;
    }

    if (targetTask.status === 'approve') {
      if (!isLeaderOrAdmin) {
        toast.error("You don't have permission to modify approved tasks");
        setDragOverCol(null);
        setDragOverCardId(null);
        setDraggedTask(null);
        return;
      }
      if (newStatus !== 'edit' && newStatus !== 'approve') {
        toast.error("Approved tasks can only be changed to Needs Revision");
        setDragOverCol(null);
        setDragOverCardId(null);
        setDraggedTask(null);
        return;
      }
    }

    // Snapshot for rollback
    const previousColumnsData = { ...columnsData };
    const previousTableList = [...tableTaskList];

    // Optimistic UI update in columns
    setColumnsData(prev => {
      const sourceList = prev[sourceStatus]?.tasks || [];
      const targetList = prev[newStatus]?.tasks || [];

      const updatedSourceList = sourceList.filter(t => t.id !== taskId);
      const updatedTask = { ...targetTask, status: newStatus };
      const updatedTargetList = [updatedTask, ...targetList.filter(t => t.id !== taskId)];

      return {
        ...prev,
        [sourceStatus]: {
          ...prev[sourceStatus],
          tasks: updatedSourceList,
          total: Math.max(0, (prev[sourceStatus]?.total || 0) - 1)
        },
        [newStatus]: {
          ...prev[newStatus],
          tasks: updatedTargetList,
          total: (prev[newStatus]?.total || 0) + 1
        }
      };
    });

    if (viewMode === 'table') {
      setTableTaskList(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    }

    setDragOverCol(null);
    setDragOverCardId(null);
    setDraggedTask(null);
    setDraggedFromCol(null);
    setDraggedFromIndex(null);

    // Call API
    try {
      await apiClient.put(`/api/admin/tasks/${taskId}`, { status: newStatus });
      const targetColInfo = KANBAN_COLUMNS.find(c => c.id === newStatus);
      toast.success(`Task moved to ${targetColInfo?.label || newStatus}`);
      if (refreshTableTasks) refreshTableTasks();
    } catch (err) {
      console.error('Failed to update task status:', err);
      toast.error(err.response?.data?.message || 'Failed to move task');
      setColumnsData(previousColumnsData);
      setTableTaskList(previousTableList);
    }
  };

  // Dropping on a column area (empty space or bottom)
  const handleDropOnCol = async (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDragOverCardId(null);
    if (!draggedTask) return;
    if (targetStatus === 'delay') {
      toast.error('لا يمكن نقل المهام إلى خانة التأخير يدويًا - تظهر المهام هنا تلقائيًا عند تجاوز موعد التسليم');
      setDraggedTask(null);
      return;
    }
    await handleMoveTaskStatus(draggedTask.id, targetStatus);
  };

  // =========================================================================
  // TABLE VIEW DRAG AND DROP REORDER (Leader / Admin)
  // =========================================================================
  const handleTableDragStart = (e, index) => {
    if (!isLeaderOrAdmin || debouncedSearch) return;
    setDraggedTableIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleTableDragOver = (e, index) => {
    if (!isLeaderOrAdmin || debouncedSearch) return;
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
    if (!isLeaderOrAdmin || debouncedSearch) return;
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
      sort: (tablePage - 1) * tableLimit + idx + 1
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

  // Selection Mode handlers ("by selection" for mobile and multi-select)
  const toggleSelectTask = (taskId) => {
    setSelectedTaskIds(prev => 
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSelectAllInCurrentTab = () => {
    const currentTasks = columnsData[mobileActiveTab]?.tasks || [];
    const currentIds = currentTasks.map(t => t.id);
    const allSelected = currentIds.every(id => selectedTaskIds.includes(id));

    if (allSelected) {
      setSelectedTaskIds(prev => prev.filter(id => !currentIds.includes(id)));
    } else {
      setSelectedTaskIds(prev => Array.from(new Set([...prev, ...currentIds])));
    }
  };

  const handleClearSelection = () => {
    setSelectedTaskIds([]);
  };

  // Bulk Move Tasks by Selection
  const handleBulkMove = async () => {
    if (selectedTaskIds.length === 0) return;

    if (!isLeaderOrAdmin && (bulkTargetStatus === 'approve' || bulkTargetStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      return;
    }

    setIsBulkUpdating(true);
    try {
      const res = await apiClient.put('/api/admin/tasks/bulk-status', {
        taskIds: selectedTaskIds,
        status: bulkTargetStatus
      });

      const count = res?.data?.data?.updatedCount || selectedTaskIds.length;
      toast.success(`Successfully moved ${count} task${count > 1 ? 's' : ''} to ${bulkTargetStatus}`);
      setSelectedTaskIds([]);
      setIsSelectionMode(false);
      refreshAllColumns();
    } catch (err) {
      console.error('Bulk status update failed:', err);
      toast.error(err.response?.data?.message || 'Failed to move selected tasks');
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Fetch Users assigned to Group for Dropdown / Multi-assign
  const { data: groupUsersData } = useGet(groupId ? `/api/admin/projectGroup/${groupId}/users` : null);
  const engineersList = groupUsersData?.users || groupUsersData?.data?.users || [];

  // Fetch Project and Group details for documentation links
  const { data: projectRes } = useGet(`/api/admin/project/${projectId}`);
  const project = projectRes?.Project || projectRes?.data?.Project || projectRes?.project || projectRes?.data?.project;

  const { data: groupRes } = useGet(`/api/admin/projectGroup/${groupId}`);
  const group = groupRes?.group || groupRes?.data?.group;

  const { mutate, loading: mutationLoading } = useMutation();

  // Create / Edit Task Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    delivery_date: '',
    date_urgent: '',
    status: 'pending',
    importanc_status: 'medium',
    tester_note: '',
    documentation: '',
    users_ids: []
  });
  const [selectedDocFile, setSelectedDocFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedDocFile(file || null);
  };

  const openModal = async (task = null, defaultStatus = 'pending') => {
    if (task) {
      setEditingId(task.id);

      const allLoadedTasks = Object.values(columnsData).flatMap(c => c.tasks);
      const matchingFromList = allLoadedTasks
        .filter(t => t.name?.trim().toLowerCase() === task.name?.trim().toLowerCase())
        .map(t => t.user_id)
        .filter(Boolean);
      const initialUsers = Array.from(new Set([task.user_id, ...matchingFromList].filter(Boolean)));

      setFormData({
        name: task.name,
        description: task.description || '',
        delivery_date: task.delivery_date ? (typeof task.delivery_date === 'string' ? task.delivery_date.split('T')[0] : dayjs(task.delivery_date).format('YYYY-MM-DD')) : '',
        date_urgent: task.date_urgent ? (typeof task.date_urgent === 'string' ? task.date_urgent.split('T')[0] : dayjs(task.date_urgent).format('YYYY-MM-DD')) : '',
        status: task.status,
        importanc_status: task.importanc_status || 'medium',
        tester_note: task.tester_note || '',
        documentation: task.documentation || '',
        users_ids: initialUsers
      });
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsModalOpen(true);

      try {
        const res = await apiClient.get(`/api/admin/tasks/${task.id}`);
        const taskDetail = res?.data?.data?.task || res?.data?.task;
        if (taskDetail) {
          setFormData(prev => ({
            ...prev,
            date_urgent: taskDetail.date_urgent ? (typeof taskDetail.date_urgent === 'string' ? taskDetail.date_urgent.split('T')[0] : dayjs(taskDetail.date_urgent).format('YYYY-MM-DD')) : prev.date_urgent,
            users_ids: (taskDetail.users_ids && Array.isArray(taskDetail.users_ids)) ? taskDetail.users_ids : prev.users_ids
          }));
        }
      } catch (err) {
        console.error('Error fetching task details:', err);
      }
    } else {
      if (!isLeaderOrAdmin) {
        toast.error("You don't have permission to add tasks to this project");
        return;
      }
      setEditingId(null);
      setFormData({ 
        name: '', 
        description: '', 
        delivery_date: '', 
        date_urgent: '',
        status: defaultStatus || 'pending', 
        importanc_status: 'medium', 
        tester_note: '', 
        documentation: '', 
        users_ids: [] 
      });
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsModalOpen(true);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setSelectedDocFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleUserSelection = (userId) => {
    setFormData(prev => {
      const isSelected = prev.users_ids.includes(userId);
      return {
        ...prev,
        users_ids: isSelected
          ? prev.users_ids.filter(id => id !== userId)
          : [...prev.users_ids, userId]
      };
    });
  };

  const handleSelectAllUsers = () => {
    if (formData.users_ids.length === engineersList.length) {
      setFormData(prev => ({ ...prev, users_ids: [] }));
    } else {
      setFormData(prev => ({ ...prev, users_ids: engineersList.map(u => u.id) }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('project_id', projectId);
    data.append('group_id', groupId);
    if (formData.description) data.append('description', formData.description);
    if (formData.delivery_date) data.append('delivery_date', formData.delivery_date);
    if (formData.date_urgent) {
      data.append('date_urgent', formData.date_urgent);
    } else if (editingId) {
      data.append('date_urgent', '');
    }
    if (formData.status) data.append('status', formData.status);
    if (formData.importanc_status) data.append('importanc_status', formData.importanc_status);
    if (formData.tester_note) data.append('tester_note', formData.tester_note);

    if (!isLeaderOrAdmin && user?.id) {
      data.append('users_ids', user.id);
      data.append('user_id', user.id);
    } else if (formData.users_ids && formData.users_ids.length > 0) {
      formData.users_ids.forEach((uid) => {
        data.append('users_ids', uid);
      });
      data.append('user_id', formData.users_ids[0]);
    }

    if (selectedDocFile) {
      data.append('documentation', selectedDocFile);
    } else if (editingId && !formData.documentation) {
      data.append('delete_documentation', 'true');
      data.append('documentation', '');
    }

    const response = await mutate({
      method: editingId ? 'PUT' : 'POST',
      url: editingId ? `/api/admin/tasks/${editingId}` : '/api/admin/tasks',
      data
    });

    if (response?.success) {
      closeModal();
      refreshAllColumns();
      if (refreshTableTasks) refreshTableTasks();
    }
  };

  const handleDeleteDoc = async () => {
    if (!window.confirm("Are you sure you want to delete this documentation? It will be deleted permanently.")) return;
    if (editingId) {
      const res = await mutate({
        method: 'DELETE',
        url: `/api/admin/tasks/${editingId}/documentation`
      });
      if (res?.success) {
        setFormData(prev => ({ ...prev, documentation: '' }));
        setSelectedDocFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        refreshAllColumns();
        if (refreshTableTasks) refreshTableTasks();
      }
    } else {
      setFormData(prev => ({ ...prev, documentation: '' }));
      setSelectedDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    
    const response = await mutate({
      method: 'DELETE',
      url: `/api/admin/tasks/${id}`
    });

    if (response?.success) {
      // Remove deleted task locally
      setColumnsData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(col => {
          const beforeLen = next[col].tasks.length;
          next[col].tasks = next[col].tasks.filter(t => t.id !== id);
          if (next[col].tasks.length < beforeLen) {
            next[col].total = Math.max(0, next[col].total - 1);
          }
        });
        return next;
      });
      setTableTaskList(prev => prev.filter(t => t.id !== id));
      if (refreshTableTasks) refreshTableTasks();
      toast.success("Task deleted successfully");
    }
  };

  const handleImportanceChange = async (taskId, newImportance) => {
    const response = await mutate({
      method: 'PUT',
      url: `/api/admin/tasks/${taskId}`,
      data: { importanc_status: newImportance }
    });
    if (response?.success) {
      setColumnsData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(col => {
          next[col].tasks = next[col].tasks.map(t => 
            t.id === taskId ? { ...t, importanc_status: newImportance } : t
          );
        });
        return next;
      });
      setTableTaskList(prev => prev.map(t => t.id === taskId ? { ...t, importanc_status: newImportance } : t));
    }
  };

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
        else if(mime.includes('image')) ext = 'img';
        
        link.download = `document_${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else {
        fetch(docString)
          .then(res => res.blob())
          .then(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = docString.split('/').pop() || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(url), 10000);
          })
          .catch(() => {
            window.open(docString, '_blank');
          });
      }
    } catch(err) {
      console.error("Error viewing document:", err);
      toast.error("Could not open this document");
    }
  };

  // Card Props passed down
  const cardProps = {
    projectId,
    groupId,
    isSelectionMode,
    selectedTaskIds,
    onToggleSelect: toggleSelectTask,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onOpenModal: (task) => openModal(task),
    onDelete: handleDelete,
    onStatusChange: handleMoveTaskStatus,
    onImportanceChange: handleImportanceChange,
    onViewDoc: handleViewDoc,
    isLeaderOrAdmin,
    isAdmin,
    getRoleName,
    availableColumns: KANBAN_COLUMNS
  };

  // Total tasks count across all columns
  const grandTotal = Object.values(columnsData).reduce((sum, col) => sum + (col.total || 0), 0);

  return (
    <div className="admin-tasks-page min-h-screen bg-background p-4 md:p-8 font-inter text-foreground">
      {/* Header Section */}
      <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <nav className="mb-2 text-sm text-muted-foreground flex items-center">
            <Link to="/admin/projects" className="hover:underline hover:text-primary">Projects</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <Link to={`/admin/projects/${projectId}`} className="hover:underline hover:text-primary">Details</Link>
            <span className="material-symbols-outlined mx-1 text-[16px]">chevron_right</span>
            <span className="font-semibold text-foreground">Tasks Kanban Board</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="font-plus-jakarta text-3xl md:text-4xl font-bold tracking-tight text-primary">
              Task Board
            </h1>
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
              {grandTotal} Tasks
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, drag & drop, and track tasks across status columns with infinite scroll.
          </p>
          
          {/* Quick Docs Links */}
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            {project?.documentation && (
              <button 
                onClick={(e) => handleViewDoc(e, project.documentation)} 
                className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors cursor-pointer border-none font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">folder</span>
                Project Docs
              </button>
            )}
            {group?.documentation && (
              <button 
                onClick={(e) => handleViewDoc(e, group.documentation)} 
                className="inline-flex items-center gap-1.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-200 transition-colors cursor-pointer border-none font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">topic</span>
                Group Docs
              </button>
            )}
          </div>
        </div>

        {/* Toolbar: Search, Status Filter, Width Toggle, Refresh, Select Mode, View Toggle, Add Task */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-56 min-w-[180px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..." 
              className="pl-9 h-10 border-border bg-card rounded-xl shadow-xs text-sm"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="h-10 rounded-xl border border-border bg-card pl-8 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs cursor-pointer appearance-none"
              title="Filter tasks by status"
            >
              <option value="all">All Statuses ({grandTotal})</option>
              {KANBAN_COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label} ({columnsData[col.id]?.total || 0})
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Column Width Selector (Kanban only) */}
          {viewMode === 'kanban' && (
            <div className="hidden xl:flex items-center rounded-xl border border-border bg-card p-1 shadow-xs" title="Kanban Column Width">
              <button
                type="button"
                onClick={() => handleWidthChange('compact')}
                title="Compact Width (~310px)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  columnWidth === 'compact'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('normal')}
                title="Normal Width (~360px)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  columnWidth === 'normal'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => handleWidthChange('wide')}
                title="Wide Width (~440px)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  columnWidth === 'wide'
                    ? 'bg-primary text-white font-semibold shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Wide
              </button>
            </div>
          )}

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={refreshAllColumns}
            title="Refresh Board"
            className="h-10 w-10 rounded-xl bg-card border-border hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </Button>

          {/* Selection Mode Button ("by selection") */}
          <Button
            variant={isSelectionMode ? "default" : "outline"}
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              if (isSelectionMode) setSelectedTaskIds([]);
            }}
            className={`h-10 rounded-xl px-3.5 text-xs font-semibold gap-1.5 transition-all shadow-xs ${
              isSelectionMode 
                ? 'bg-primary text-white hover:bg-primary/90 ring-2 ring-primary/40' 
                : 'bg-card border-border hover:bg-muted text-foreground'
            }`}
          >
            {isSelectionMode ? (
              <CheckSquare className="w-4 h-4" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
            <span>{isSelectionMode ? 'Selection Active' : 'Select Mode'}</span>
          </Button>

          {/* View Mode Toggle: Kanban vs Table */}
          <div className="flex items-center rounded-xl border border-border bg-card p-1 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              title="Kanban Board View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'kanban' 
                  ? 'bg-primary text-white font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Table View"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-primary text-white font-semibold shadow-xs' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>

          {/* Add Task Button (Only for Leader or Admin at this project) */}
          {isLeaderOrAdmin && (
            <Button 
              onClick={() => openModal()} 
              className="h-10 flex items-center gap-2 rounded-xl bg-primary px-4 text-xs md:text-sm font-semibold text-white transition-all hover:bg-primary/90 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Status Filter Pills (Desktop & Mobile) */}
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
        <button
          type="button"
          onClick={() => handleStatusFilterChange('all')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-primary text-white border-primary shadow-xs'
              : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          <span>All Statuses</span>
          <span className={`rounded-full px-1.5 py-0.2 text-[10px] font-semibold ${
            statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'
          }`}>
            {grandTotal}
          </span>
        </button>

        {KANBAN_COLUMNS.map((col) => {
          const count = columnsData[col.id]?.total || 0;
          const isActive = statusFilter === col.id;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => handleStatusFilterChange(isActive ? 'all' : col.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                isActive
                  ? `${col.badgeClass} ring-2 ring-primary/40 shadow-xs scale-102 font-extrabold`
                  : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
              <span>{col.label}</span>
              <span className="rounded-full bg-muted/60 px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                {count}
              </span>
            </button>
          );
        })}

        {statusFilter !== 'all' && (
          <button
            type="button"
            onClick={() => handleStatusFilterChange('all')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-1 cursor-pointer"
            title="Reset status filter"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Floating Bulk Selection Action Bar ("by selection" mode) */}
      {isSelectionMode && selectedTaskIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md p-4 shadow-2xl animate-in slide-in-from-bottom-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
                  {selectedTaskIds.length}
                </span>
                <span className="text-xs font-bold text-foreground">
                  Task{selectedTaskIds.length > 1 ? 's' : ''} Selected
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllInCurrentTab}
                  className="text-xs text-primary hover:underline font-semibold"
                >
                  Select Tab
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={handleClearSelection}
                  className="text-xs text-muted-foreground hover:text-destructive font-semibold"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
                Move to:
              </span>
              <select
                value={bulkTargetStatus}
                onChange={(e) => setBulkTargetStatus(e.target.value)}
                className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="pending">Pending</option>
                <option value="inprogress">In Progress</option>
                <option value="done">Completed</option>
                <option value="edit" disabled={!isLeaderOrAdmin}>
                  {isLeaderOrAdmin ? 'Need to Revision' : 'Need to Revision (Leader 🔒)'}
                </option>
                <option value="approve" disabled={!isLeaderOrAdmin}>
                  {isLeaderOrAdmin ? 'Approved' : 'Approved (Leader 🔒)'}
                </option>
              </select>

              <Button
                size="sm"
                onClick={handleBulkMove}
                disabled={isBulkUpdating}
                className="h-9 rounded-xl bg-primary text-white px-4 text-xs font-bold shadow-md hover:bg-primary/90"
              >
                {isBulkUpdating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Apply Move</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main View: Kanban Board */}
      {viewMode === 'kanban' ? (
        <div>
          {/* Desktop Kanban: Responsive columns side by side with customizable & spacious width */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
            {filteredColumns.map((col) => {
              const colState = columnsData[col.id] || { tasks: [], total: 0, loading: false, loadingMore: false, hasMore: false };
              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  widthClass={getColumnWidthClass()}
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
                  onAddTask={isLeaderOrAdmin ? (status) => openModal(null, status) : null}
                  cardProps={{
                    ...cardProps,
                    isSelected: (id) => selectedTaskIds.includes(id),
                  }}
                />
              );
            })}
          </div>

          {/* Mobile Kanban: Single active column selected via filter pills or tabs */}
          <div className="block md:hidden">
            {(() => {
              const activeCol = (statusFilter !== 'all' ? KANBAN_COLUMNS.find(c => c.id === statusFilter) : null)
                || KANBAN_COLUMNS.find(c => c.id === mobileActiveTab) 
                || KANBAN_COLUMNS[0];
              const colState = columnsData[activeCol.id] || { tasks: [], total: 0, loading: false, loadingMore: false, hasMore: false };
              return (
                <KanbanColumn
                  column={activeCol}
                  widthClass="w-full"
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
                  onAddTask={isLeaderOrAdmin ? (status) => openModal(null, status) : null}
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
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  {isLeaderOrAdmin && !debouncedSearch && (
                    <th scope="col" className="w-10 px-2 py-5 text-center">
                      <span className="sr-only">Reorder</span>
                    </th>
                  )}
                  <th scope="col" className="px-6 py-5 font-semibold">Task Details</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Importance</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tableTasksLoading && tableTaskList.length === 0 ? (
                  <tr>
                    <td colSpan={isLeaderOrAdmin && !debouncedSearch ? 7 : 6} className="py-12 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span>Loading tasks...</span>
                      </div>
                    </td>
                  </tr>
                ) : (tableTaskList.length > 0 ? tableTaskList : Object.values(columnsData).flatMap(c => c.tasks)).length === 0 ? (
                  <tr>
                    <td colSpan={isLeaderOrAdmin && !debouncedSearch ? 7 : 6} className="py-12 text-center text-muted-foreground">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  (tableTaskList.length > 0 ? tableTaskList : Object.values(columnsData).flatMap(c => c.tasks)).map((task, index) => {
                    const isUrgent = (
                      task.importanc_status?.toLowerCase?.() === 'urgent' ||
                      task.importance?.toLowerCase?.() === 'urgent' ||
                      (task.date_urgent && String(task.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
                    ) && task.status !== 'approve';

                    const isBeingDraggedOver = dragOverTableIndex === index;

                    return (
                      <tr 
                        key={task.id}
                        draggable={isLeaderOrAdmin && !debouncedSearch}
                        onDragStart={(e) => handleTableDragStart(e, index)}
                        onDragOver={(e) => handleTableDragOver(e, index)}
                        onDragLeave={handleTableDragLeave}
                        onDragEnd={handleTableDragEnd}
                        onDrop={(e) => handleTableDrop(e, index)}
                        className={`transition-all ${
                          isBeingDraggedOver ? 'border-t-2 border-primary bg-primary/10' : ''
                        } ${
                          isUrgent ? 'urgent-row-glow cursor-pointer' : 'hover:bg-muted/60 transition-colors cursor-pointer'
                        }`}
                        onClick={() => navigate(`/admin/projects/${projectId}/groups/${groupId}/tasks/${task.id}`)}
                      >
                        {isLeaderOrAdmin && !debouncedSearch && (
                          <td 
                            className="w-10 px-2 py-4 text-center cursor-grab active:cursor-grabbing text-muted-foreground/60 hover:text-foreground"
                            onClick={(e) => e.stopPropagation()}
                            title="اسحب لإعادة الترتيب (Drag to reorder)"
                          >
                            <GripVertical className="w-4 h-4 mx-auto" />
                          </td>
                        )}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground hover:text-primary">
                              {task.name}
                            </span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {task.description || 'No description'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold text-foreground">
                            {task.user_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                          {task.delivery_date ? dayjs(task.delivery_date).format('MMM DD, YYYY') : 'Not Set'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase ${
                            isUrgent ? 'text-red-600 dark:text-red-400 font-extrabold' : ''
                          }`}>
                            {isUrgent && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                              </span>
                            )}
                            {task.importanc_status || 'medium'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {task.status === 'approve' && !isLeaderOrAdmin ? (
                              <span 
                                title="Approved task: Locked (Only Leader or Admin can request revision)"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 select-none cursor-not-allowed"
                              >
                                <Lock className="w-3 h-3 text-purple-600" />
                                Approved (Locked)
                              </span>
                            ) : (
                              <select
                                value={task.status}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => handleMoveTaskStatus(task.id, e.target.value)}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border cursor-pointer focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                              >
                                <option value="pending">Pending</option>
                                <option value="inprogress">In Progress</option>
                                <option value="done">Completed</option>
                                <option value="edit" disabled={!isLeaderOrAdmin}>
                                  {isLeaderOrAdmin ? 'Need to Revision' : 'Need to Revision (Leader 🔒)'}
                                </option>
                                <option value="approve" disabled={!isLeaderOrAdmin}>
                                  {isLeaderOrAdmin ? 'Approved' : 'Approved (Leader 🔒)'}
                                </option>
                              </select>
                            )}
                            {isTaskDelayedCompleted(task) && (
                              <span 
                                title="Completed after delivery deadline"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-800"
                              >
                                Delay
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => openModal(task)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {isLeaderOrAdmin && (
                              <button
                                onClick={() => handleDelete(task.id)}
                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
            <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-card">
              <span className="text-xs text-muted-foreground">
                Page {tablePagination.page} of {tablePagination.totalPages} ({tablePagination.total} tasks)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tablePage <= 1}
                  onClick={() => setTablePage(p => Math.max(1, p - 1))}
                  className="rounded-lg text-xs"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={tablePage >= tablePagination.totalPages}
                  onClick={() => setTablePage(p => p + 1)}
                  className="rounded-lg text-xs"
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
          const totalCount = columnsData[col.id]?.total || 0;
          const isActive = statusFilter === col.id;
          return (
            <div 
              key={col.id} 
              onClick={() => {
                handleStatusFilterChange(isActive ? 'all' : col.id);
              }}
              className={`flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-xs transition-all cursor-pointer ${
                isActive 
                  ? 'ring-2 ring-primary border-primary shadow-md bg-primary/5' 
                  : 'border-border hover:border-primary/40'
              }`}
              title={`Click to filter by ${col.label}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${col.headerBg}`}>
                <span className={`h-3 w-3 rounded-full ${col.dotColor}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground truncate">{col.label}</p>
                <p className="text-xl font-bold text-foreground">{totalCount}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Form Modal (Create & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-card rounded-2xl w-full max-w-2xl shadow-xl flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border flex justify-between items-center bg-background rounded-t-2xl">
              <h2 className="text-2xl font-bold font-['Plus_Jakarta_Sans'] text-foreground">{editingId ? 'Edit Task' : 'Create New Task'}</h2>
              <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-700 bg-card p-1.5 rounded-md shadow-sm border border-border">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-6 custom-scrollbar">
              <form id="task-form" onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">badge</span>
                      Task Name <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="e.g. Implement Login Page" 
                      required 
                      disabled={!isLeaderOrAdmin && editingId}
                      className="border-border bg-background focus-visible:ring-primary h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">calendar_month</span>
                      Delivery Date <span className="text-red-500">*</span>
                    </label>
                    <Input 
                      type="date" 
                      name="delivery_date" 
                      value={formData.delivery_date} 
                      onChange={handleInputChange} 
                      required 
                      disabled={!isLeaderOrAdmin && editingId}
                      className="border-border bg-background focus-visible:ring-primary h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                        <span className="material-symbols-outlined text-[16px]">alarm</span>
                        Urgent Date (تاريخ التحول لعاجل)
                      </span>
                      {formData.date_urgent && isLeaderOrAdmin && (
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, date_urgent: '' }))}
                          className="text-[11px] text-muted-foreground hover:text-red-500 font-medium"
                        >
                          Clear
                        </button>
                      )}
                    </label>
                    <Input 
                      type="date" 
                      name="date_urgent" 
                      value={formData.date_urgent} 
                      onChange={handleInputChange} 
                      disabled={!isLeaderOrAdmin && editingId}
                      className="border-border bg-background focus-visible:ring-red-500 h-11"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      عند حلول هذا الموعد أو تخطيه تتحول المهمة تلقائياً إلى Urgent (ما لم تكن معتمدة).
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 md:col-span-2 relative z-10">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">description</span>
                      Description
                    </label>
                    <textarea 
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Detailed explanation of the task..."
                      className="w-full min-h-[100px] p-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm custom-scrollbar text-foreground placeholder:text-muted-foreground"
                      disabled={!isLeaderOrAdmin && editingId}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Documentation File</label>
                    <div className="border border-input rounded-xl flex items-center bg-card pr-3 overflow-hidden">
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,image/*" 
                        onChange={handleFileChange} 
                        ref={fileInputRef}
                        className="w-full text-sm file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                      />
                      {selectedDocFile && (
                        <span className="text-xs text-primary font-medium whitespace-nowrap px-2">{selectedDocFile.name}</span>
                      )}
                    </div>
                    {formData.documentation && !selectedDocFile && (
                      <div className="mt-2 flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <span className="material-symbols-outlined text-primary text-base">description</span>
                          <span className="text-xs font-medium text-foreground truncate max-w-[200px]">Current Documentation</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            type="button" 
                            onClick={(e) => handleViewDoc(e, formData.documentation)}
                            className="text-xs text-primary hover:underline px-2 py-1 rounded bg-primary/10 border-none cursor-pointer font-medium"
                          >
                            View
                          </button>
                          <button
                            type="button"
                            onClick={handleDeleteDoc}
                            className="text-xs text-destructive hover:bg-destructive/10 px-2 py-1 rounded border-none cursor-pointer flex items-center gap-1 font-medium transition-colors"
                            title="Delete documentation from server and database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {editingId && !formData.documentation && !selectedDocFile && (
                      <p className="text-xs text-muted-foreground mt-1">No documentation file currently uploaded.</p>
                    )}
                    {editingId && formData.documentation && (
                      <p className="text-xs text-muted-foreground mt-1">Select a new file to replace, or click Delete to remove it.</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Importance</label>
                    <select 
                      name="importanc_status" 
                      value={formData.importanc_status} 
                      onChange={handleInputChange}
                      required
                      disabled={!isLeaderOrAdmin && editingId}
                      className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Status</label>
                    <select 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                      required
                      disabled={formData.status === 'approve' && !isLeaderOrAdmin}
                      className="flex w-full h-11 items-center justify-between rounded-xl border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-75"
                    >
                      {formData.status === 'approve' ? (
                        <>
                          <option value="approve">Approve</option>
                          {isLeaderOrAdmin && <option value="edit">Edit (Needs Revision)</option>}
                        </>
                      ) : (
                        <>
                          <option value="pending">Pending</option>
                          <option value="inprogress">In Progress</option>
                          <option value="done">Done</option>
                          {!isLeaderOrAdmin && formData.status === 'edit' && (
                            <option value="edit" disabled hidden>Edit (Needs Revision)</option>
                          )}
                          {isLeaderOrAdmin && (
                            <>
                              <option value="edit">Edit (Needs Revision)</option>
                              <option value="approve">Approve</option>
                            </>
                          )}
                        </>
                      )}
                    </select>
                  </div>

                  {isLeaderOrAdmin && (
                    <div className="flex flex-col gap-2 md:col-span-2 relative z-20">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-primary">group</span>
                          Assign To
                          <span className="text-xs text-muted-foreground font-normal">
                            (Select one or multiple {getRoleNamePlural('engineer').toLowerCase()})
                          </span>
                        </label>
                        {engineersList.length > 1 && (
                          <button
                            type="button"
                            onClick={handleSelectAllUsers}
                            className="text-xs font-semibold text-primary hover:underline transition-colors"
                          >
                            {formData.users_ids.length === engineersList.length ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </div>

                      {engineersList.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic p-2 bg-muted/40 rounded-lg">
                          No {getRoleNamePlural('engineer').toLowerCase()} assigned to this group yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {engineersList.map(eng => {
                            const isSelected = formData.users_ids.includes(eng.id);
                            return (
                              <div 
                                key={eng.id}
                                onClick={() => toggleUserSelection(eng.id)}
                                className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                  isSelected 
                                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30' 
                                    : 'border-border bg-card hover:border-primary/30'
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-input bg-background'}`}>
                                  {isSelected && <span className="material-symbols-outlined text-[12px] text-white font-bold">check</span>}
                                </div>
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {eng.image ? (
                                    <img src={eng.image} alt={eng.name} className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                      {eng.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-xs font-semibold truncate text-foreground">{eng.name}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {formData.users_ids.length > 1 && (
                        <p className="text-xs text-primary mt-1 flex items-center font-medium bg-primary/5 p-2 rounded-lg border border-primary/20">
                          <span className="material-symbols-outlined text-[16px] mr-1.5">info</span>
                          {editingId
                            ? `This task will be synced across all ${formData.users_ids.length} selected ${getRoleNamePlural('engineer').toLowerCase()} (duplicated for new assignees, removed if unchecked).`
                            : `This task will be created separately for each of the ${formData.users_ids.length} selected ${getRoleNamePlural('engineer').toLowerCase()}.`
                          }
                        </p>
                      )}

                      {formData.users_ids.length === 0 && (
                        <p className="text-xs text-red-500 mt-1 flex items-center font-medium">
                          <span className="material-symbols-outlined text-[16px] mr-1">error</span>
                          Please assign at least one {getRoleName('engineer').toLowerCase()}.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">{getRoleName('tester')} Note (Optional)</label>
                    <textarea 
                      name="tester_note"
                      value={formData.tester_note}
                      onChange={handleInputChange}
                      disabled={!isLeaderOrAdmin}
                      className={`w-full flex min-h-[80px] rounded-xl border border-input bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${!isLeaderOrAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
                      placeholder={isLeaderOrAdmin ? `Add any QA or ${getRoleName('tester').toLowerCase()} feedback here...` : `Only ${getRoleName('tester')} can update this note`}
                      rows={2}
                    />
                  </div>

                </div>
              </form>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-border bg-card rounded-b-2xl">
              <Button type="button" variant="outline" onClick={closeModal} className="px-6 h-11 rounded-xl font-semibold text-muted-foreground">
                Cancel
              </Button>
              <Button 
                type="submit" 
                form="task-form" 
                disabled={mutationLoading || (isLeaderOrAdmin && formData.users_ids.length === 0)} 
                className="bg-primary hover:bg-primary/90 text-white px-8 h-11 rounded-xl font-bold shadow-md"
              >
                {mutationLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  editingId ? 'Update Task' : (formData.users_ids.length > 1 ? `Create ${formData.users_ids.length} Tasks` : 'Create Task')
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
