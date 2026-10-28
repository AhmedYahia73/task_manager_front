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
  Lock
} from 'lucide-react';
import dayjs from 'dayjs';
import { useRoleNames } from '@/context/RoleNameContext';
import { isAdminRole } from '@/utils/auth';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';
import { KanbanColumn } from '@/components/kanban/KanbanColumn';
import { toast } from 'sonner';
import { apiClient } from '@/lib/axios';

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

  // Search state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Mobile active tab for column view
  const [mobileActiveTab, setMobileActiveTab] = useState('pending');

  // Selection mode & multi-select state ("by selection")
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('inprogress');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Kanban Columns Data state (each status has independent tasks, page, and pagination)
  const [columnsData, setColumnsData] = useState(initialColumnsState);

  // Drag and drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

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
      const res = await apiClient.get('/api/admin/tasks', {
        params: {
          group_id: groupId,
          status: statusKey,
          page: pageNum,
          limit: 12,
          search: debouncedSearch
        }
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

  // Drag and Drop handlers
  const handleDragStart = (e, task) => {
    if (isSelectionMode) return;
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragOver = (e, statusKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== statusKey) {
      setDragOverCol(statusKey);
    }
  };

  const handleDragLeave = (e, statusKey) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === statusKey) {
      setDragOverCol(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverCol(null);
  };

  // Move task to a new status (used by Drag & Drop and Card status picker)
  const handleMoveTaskStatus = async (taskId, newStatus) => {
    // Find task
    let targetTask = draggedTask;
    let sourceStatus = targetTask?.status;

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

    if (!targetTask || sourceStatus === newStatus) {
      setDragOverCol(null);
      return;
    }

    // Permission validations
    if (!isLeaderOrAdmin && (newStatus === 'approve' || newStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      setDragOverCol(null);
      return;
    }

    if (targetTask.status === 'approve') {
      if (!isLeaderOrAdmin) {
        toast.error("You don't have permission to modify approved tasks");
        setDragOverCol(null);
        return;
      }
      if (newStatus !== 'edit' && newStatus !== 'approve') {
        toast.error("Approved tasks can only be changed to Needs Revision");
        setDragOverCol(null);
        return;
      }
    }

    // Snapshot for rollback
    const previousColumnsData = { ...columnsData };

    // Optimistic UI update
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

    setDragOverCol(null);
    setDraggedTask(null);

    // Call API
    try {
      await apiClient.put(`/api/admin/tasks/${taskId}`, { status: newStatus });
      const targetColInfo = KANBAN_COLUMNS.find(c => c.id === newStatus);
      toast.success(`Task moved to ${targetColInfo?.label || newStatus}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
      toast.error(err.response?.data?.message || 'Failed to move task');
      // Rollback
      setColumnsData(previousColumnsData);
    }
  };

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault();
    if (!draggedTask) return;
    await handleMoveTaskStatus(draggedTask.id, targetStatus);
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

        {/* Toolbar: Search, Select Mode Toggle, View Toggle, Add Task */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-60 min-w-[200px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..." 
              className="pl-9 h-10 border-border bg-card rounded-xl shadow-xs text-sm"
            />
          </div>

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
                  type="button"
                  onClick={() => setMobileActiveTab(col.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    isActive 
                      ? `${col.badgeClass} ring-2 ring-primary/30 shadow-xs scale-102` 
                      : 'bg-card border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span>{col.label}</span>
                  <span className="ml-0.5 rounded-full bg-muted/60 px-1.5 py-0.2 text-[10px] font-semibold text-foreground">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

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
          {/* Desktop Kanban: 5 Columns side by side with responsive scroll */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onAddTask={isLeaderOrAdmin ? (status) => openModal(null, status) : null}
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
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
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
        /* Classic Table View Fallback */
        <div className="mb-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th scope="col" className="px-6 py-5 font-semibold">Task Details</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Assigned To</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Delivery Date</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Importance</th>
                  <th scope="col" className="px-6 py-5 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Object.values(columnsData).flatMap(c => c.tasks).length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-muted-foreground">
                      No tasks found.
                    </td>
                  </tr>
                ) : (
                  Object.values(columnsData).flatMap(c => c.tasks).map((task) => (
                    <tr 
                      key={task.id}
                      className="hover:bg-muted/60 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/projects/${projectId}/groups/${groupId}/tasks/${task.id}`)}
                    >
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
                        <span className="text-xs font-bold uppercase">
                          {task.importanc_status || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openModal(task)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Summary Stats Cards */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {KANBAN_COLUMNS.map((col) => {
          const totalCount = columnsData[col.id]?.total || 0;
          return (
            <div 
              key={col.id} 
              onClick={() => {
                setViewMode('kanban');
                setMobileActiveTab(col.id);
              }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs hover:border-primary/40 transition-colors cursor-pointer"
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
