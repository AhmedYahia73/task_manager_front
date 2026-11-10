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
  Layers,
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

const DONE_KANBAN_COLUMNS = [
  { id: 'done', label: 'Completed', dotColor: 'bg-emerald-500', dropHighlight: 'ring-2 ring-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/20' },
  { id: 'edit', label: 'Need to Revision', dotColor: 'bg-orange-500', dropHighlight: 'ring-2 ring-orange-400 bg-orange-50/40 dark:bg-orange-950/20' },
  { id: 'approve', label: 'Approved', dotColor: 'bg-purple-500', dropHighlight: 'ring-2 ring-purple-400 bg-purple-50/40 dark:bg-purple-950/20' },
  { id: 'inprogress', label: 'In Progress', dotColor: 'bg-blue-500', dropHighlight: 'ring-2 ring-blue-400 bg-blue-50/40 dark:bg-blue-950/20' },
  { id: 'pending', label: 'Pending', dotColor: 'bg-amber-500', dropHighlight: 'ring-2 ring-amber-400 bg-amber-50/40 dark:bg-amber-950/20' }
];

const FilteredTasks = () => {
  const navigate = useNavigate();
  const { getRoleName } = useRoleNames();
  const { type } = useParams(); // 'pending', 'delay', 'today', 'all', 'done'
  
  const activeKanbanColumns = type === 'done' ? DONE_KANBAN_COLUMNS : KANBAN_COLUMNS;

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
  const [mobileActiveTab, setMobileActiveTab] = useState(type === 'done' ? 'done' : 'pending');

  useEffect(() => {
    setMobileActiveTab(type === 'done' ? 'done' : 'pending');
  }, [type]);

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
                 : type === 'done' ? '/api/admin/tasks/doneTasks'
                 : '/api/admin/tasks';
                 
  const pageTitle = type === 'pending' ? 'Pending Tasks' 
                  : type === 'delay' ? 'Delayed Tasks' 
                  : type === 'today' ? "Today's Tasks"
                  : type === 'done' ? 'Done Tasks'
                  : 'All Tasks';

  // Fetch Lists for Filters (projects, users)
  const { data: listsData } = useGet('/api/admin/tasks/lists');
  const projectsList = listsData?.projects_list || [];
  const usersList = listsData?.users_list || [];

  // =========================================================================
  // KANBAN STATUS & PROJECT STATE
  // =========================================================================
  // Projects summary per status: { [status]: [{ project_id, project_name, total }] }
  const [projectsSummary, setProjectsSummary] = useState({});
  // Overall task totals per status
  const [statusTotals, setStatusTotals] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Loaded tasks per project in each status:
  // projectsData[statusKey][projKey] = { tasks: [], page: 1, totalPages: 1, total: 0, loading: false, loadingMore: false, hasMore: false, initialLoaded: false }
  const [projectsData, setProjectsData] = useState({});

  // Accordion expanded state: { [`${statusKey}_${projKey}`]: boolean }
  const [expandedProjects, setExpandedProjects] = useState({});

  // Drag and Drop state
  const [draggedTask, setDraggedTask] = useState(null);
  const [draggedFromCol, setDraggedFromCol] = useState(null);
  const [draggedFromProj, setDraggedFromProj] = useState(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const [dragOverProjectId, setDragOverProjectId] = useState(null);
  const [dragOverCardId, setDragOverCardId] = useState(null);

  // Fetch tasks for a specific project inside a specific status column
  const fetchProjectTasks = useCallback(async (statusKey, projKey, pageNum = 1, append = false) => {
    setProjectsData(prev => {
      const colData = prev[statusKey] || {};
      const current = colData[projKey] || { tasks: [], page: 1, total: 0 };
      return {
        ...prev,
        [statusKey]: {
          ...colData,
          [projKey]: {
            ...current,
            loading: !append,
            loadingMore: append
          }
        }
      };
    });

    try {
      const res = await apiClient.get(endpoint, {
        params: {
          status: statusKey,
          project_id: projKey === 'unassigned' ? 'unassigned' : projKey,
          page: pageNum,
          limit: 8,
          search: debouncedSearch,
          user_id: userIdFilter || undefined
        }
      });

      const data = res?.data?.data || res?.data || {};
      const fetchedTasks = data.tasks || data.Tasks || [];
      const pagination = data.pagination || { total: fetchedTasks.length, totalPages: 1, page: pageNum };

      setProjectsData(prev => {
        const colData = prev[statusKey] || {};
        const current = colData[projKey] || { tasks: [] };
        const currentTasks = current.tasks || [];
        let combined = append
          ? [...currentTasks, ...fetchedTasks.filter(item => !currentTasks.some(existing => existing.id === item.id))]
          : fetchedTasks;

        if (type === 'done') {
          combined = [...combined].sort((a, b) => {
            const aUrgent = (
              a.importanc_status?.toLowerCase?.() === 'urgent' ||
              a.importance?.toLowerCase?.() === 'urgent' ||
              (a.date_urgent && String(a.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
            ) && a.status !== 'approve';

            const bUrgent = (
              b.importanc_status?.toLowerCase?.() === 'urgent' ||
              b.importance?.toLowerCase?.() === 'urgent' ||
              (b.date_urgent && String(b.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
            ) && b.status !== 'approve';

            if (aUrgent && !bUrgent) return -1;
            if (!aUrgent && bUrgent) return 1;
            return 0;
          });
        }

        return {
          ...prev,
          [statusKey]: {
            ...colData,
            [projKey]: {
              tasks: combined,
              page: pageNum,
              totalPages: pagination.totalPages || 1,
              total: Number(pagination.total || combined.length),
              loading: false,
              loadingMore: false,
              hasMore: pageNum < (pagination.totalPages || 1),
              initialLoaded: true
            }
          }
        };
      });
    } catch (err) {
      console.error(`Failed to load tasks for status ${statusKey} project ${projKey}:`, err);
      setProjectsData(prev => {
        const colData = prev[statusKey] || {};
        const current = colData[projKey] || { tasks: [] };
        return {
          ...prev,
          [statusKey]: {
            ...colData,
            [projKey]: {
              ...current,
              loading: false,
              loadingMore: false
            }
          }
        };
      });
    }
  }, [endpoint, debouncedSearch, userIdFilter, type]);

  // Fetch summary of projects & task counts per status
  const fetchProjectsSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await apiClient.get('/api/admin/tasks/status-projects', {
        params: {
          type,
          search: debouncedSearch,
          project_id: projectId || undefined,
          user_id: userIdFilter || undefined
        }
      });
      const data = res?.data?.data || res?.data || {};
      const byStatus = data.projectsByStatus || {};
      const totals = data.statusTotals || {};

      setProjectsSummary(byStatus);
      setStatusTotals(totals);

      // Auto-expand the first project that has tasks in each column
      setExpandedProjects(prevExpanded => {
        const nextExpanded = { ...prevExpanded };
        activeKanbanColumns.forEach(col => {
          const projsInCol = byStatus[col.id] || [];
          const hasAnyOpen = projsInCol.some(p => Boolean(nextExpanded[`${col.id}_${p.project_id || 'unassigned'}`]));
          if (!hasAnyOpen && projsInCol.length > 0) {
            const firstWithTasks = projsInCol.find(p => p.total > 0) || projsInCol[0];
            const projKey = firstWithTasks.project_id || 'unassigned';
            nextExpanded[`${col.id}_${projKey}`] = true;
          }
        });
        return nextExpanded;
      });

    } catch (err) {
      console.error("Failed to fetch status projects summary:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [type, debouncedSearch, projectId, userIdFilter, activeKanbanColumns]);

  // Refresh summary whenever filters or search change
  useEffect(() => {
    fetchProjectsSummary();
  }, [fetchProjectsSummary]);

  // When an accordion opens, fetch its page 1 if not yet loaded
  useEffect(() => {
    Object.entries(expandedProjects).forEach(([key, isOpen]) => {
      if (!isOpen) return;
      const [statusKey, projKey] = key.split('_');
      if (!statusKey || !projKey) return;
      const projState = projectsData[statusKey]?.[projKey];
      if (!projState?.initialLoaded && !projState?.loading) {
        fetchProjectTasks(statusKey, projKey, 1, false);
      }
    });
  }, [expandedProjects, projectsData, fetchProjectTasks]);

  // Toggle individual project accordion
  const handleToggleProject = useCallback((statusKey, projKey) => {
    const key = `${statusKey}_${projKey}`;
    setExpandedProjects(prev => {
      const isCurrentlyOpen = Boolean(prev[key]);
      const next = { ...prev, [key]: !isCurrentlyOpen };
      if (!isCurrentlyOpen) {
        const projState = projectsData[statusKey]?.[projKey];
        if (!projState?.initialLoaded && !projState?.loading) {
          fetchProjectTasks(statusKey, projKey, 1, false);
        }
      }
      return next;
    });
  }, [projectsData, fetchProjectTasks]);

  // Toggle all projects in a specific status column
  const handleToggleAllProjectsInColumn = useCallback((statusKey) => {
    const projectsInCol = projectsSummary[statusKey] || [];
    if (projectsInCol.length === 0) return;

    const allOpen = projectsInCol.every(p => Boolean(expandedProjects[`${statusKey}_${p.project_id || 'unassigned'}`]));

    setExpandedProjects(prev => {
      const next = { ...prev };
      projectsInCol.forEach(p => {
        const projKey = p.project_id || 'unassigned';
        const key = `${statusKey}_${projKey}`;
        next[key] = !allOpen;
        if (!allOpen) {
          const projState = projectsData[statusKey]?.[projKey];
          if (!projState?.initialLoaded && !projState?.loading) {
            fetchProjectTasks(statusKey, projKey, 1, false);
          }
        }
      });
      return next;
    });
  }, [projectsSummary, expandedProjects, projectsData, fetchProjectTasks]);

  // Load more tasks on infinite scroll
  const handleLoadMoreProject = useCallback((statusKey, projKey) => {
    const projState = projectsData[statusKey]?.[projKey];
    if (projState && !projState.loading && !projState.loadingMore && projState.hasMore) {
      fetchProjectTasks(statusKey, projKey, projState.page + 1, true);
    }
  }, [projectsData, fetchProjectTasks]);

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
    const rawTasks = tableTasksData?.tasks || tableTasksData?.Tasks;
    if (rawTasks) {
      if (type === 'done') {
        const sorted = [...rawTasks].sort((a, b) => {
          const aUrgent = (
            a.importanc_status?.toLowerCase?.() === 'urgent' ||
            a.importance?.toLowerCase?.() === 'urgent' ||
            (a.date_urgent && String(a.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
          ) && a.status !== 'approve';

          const bUrgent = (
            b.importanc_status?.toLowerCase?.() === 'urgent' ||
            b.importance?.toLowerCase?.() === 'urgent' ||
            (b.date_urgent && String(b.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
          ) && b.status !== 'approve';

          if (aUrgent && !bUrgent) return -1;
          if (!aUrgent && bUrgent) return 1;
          return 0;
        });
        setTableTaskList(sorted);
      } else {
        setTableTaskList(rawTasks);
      }
    }
  }, [tableTasksData, type]);

  const { mutate } = useMutation();

  // =========================================================================
  // KANBAN DRAG AND DROP HANDLERS (Card reorder within column & across columns)
  // =========================================================================
  const handleDragStart = (e, task, colId, index) => {
    if (isSelectionMode) return;
    setDraggedTask(task);
    setDraggedFromCol(colId || task.status);
    setDraggedFromProj(task.project_id || 'unassigned');
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

  const handleDragOverProject = (e, statusKey, projKey) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== statusKey) setDragOverCol(statusKey);
    if (dragOverProjectId !== projKey) setDragOverProjectId(projKey);
  };

  const handleDragLeaveProject = (e, statusKey, projKey) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverProjectId === projKey) {
      setDragOverProjectId(null);
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
    const tProj = targetTask.project_id || 'unassigned';
    if (dragOverProjectId !== tProj) {
      setDragOverProjectId(tProj);
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
    setDraggedFromProj(null);
    setDraggedFromIndex(null);
    setDragOverCol(null);
    setDragOverProjectId(null);
    setDragOverCardId(null);
  };

  // Dropping on another card in Kanban: Reorders within project or moves across columns
  const handleDropOnCard = async (e, targetTask, targetColId, targetIndex) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCardId(null);
    setDragOverCol(null);
    setDragOverProjectId(null);

    const taskToMove = draggedTask;
    if (!taskToMove || taskToMove.id === targetTask.id) {
      setDraggedTask(null);
      return;
    }

    const sourceStatus = draggedFromCol || taskToMove.status;
    const sourceProj = draggedFromProj || taskToMove.project_id || 'unassigned';
    const targetProj = targetTask.project_id || 'unassigned';

    if (sourceStatus === targetColId && sourceProj === targetProj) {
      // Reorder within the same project
      const projTasks = [...(projectsData[sourceStatus]?.[sourceProj]?.tasks || [])];
      const fromIdx = projTasks.findIndex(t => t.id === taskToMove.id);
      if (fromIdx === -1) {
        setDraggedTask(null);
        return;
      }

      const [removed] = projTasks.splice(fromIdx, 1);
      projTasks.splice(targetIndex, 0, removed);

      setProjectsData(prev => ({
        ...prev,
        [sourceStatus]: {
          ...(prev[sourceStatus] || {}),
          [sourceProj]: {
            ...(prev[sourceStatus]?.[sourceProj] || {}),
            tasks: projTasks
          }
        }
      }));

      setDraggedTask(null);

      if (isAdmin) {
        const payload = projTasks.map((t, idx) => ({
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
          fetchProjectTasks(sourceStatus, sourceProj, 1, false);
        }
      }
    } else {
      // Moving across columns or across projects
      handleMoveTaskStatus(taskToMove.id, targetColId, targetProj);
    }
  };

  // Move task status handler (supports targetProjectId)
  const handleMoveTaskStatus = async (taskId, newStatus, targetProjId = null) => {
    let targetTask = null;
    let oldStatus = null;
    let oldProjKey = null;

    for (const st of Object.keys(projectsData)) {
      const projs = projectsData[st] || {};
      for (const pk of Object.keys(projs)) {
        const tList = projs[pk]?.tasks || [];
        const found = tList.find(t => t.id === taskId);
        if (found) {
          targetTask = found;
          oldStatus = st;
          oldProjKey = pk;
          break;
        }
      }
      if (targetTask) break;
    }

    if (!targetTask && viewMode === 'table') {
      targetTask = tableTaskList.find(t => t.id === taskId);
      oldStatus = targetTask?.status;
      oldProjKey = targetTask?.project_id || 'unassigned';
    }

    if (!targetTask) return;
    if (oldStatus === newStatus && (!targetProjId || targetProjId === oldProjKey)) return;

    // Permissions check
    if (!isAdmin && (newStatus === 'approve' || newStatus === 'edit')) {
      toast.error("You don't have permission to approve tasks or request revision");
      setDragOverCol(null);
      setDragOverProjectId(null);
      return;
    }

    if (targetTask.status === 'approve' && !isAdmin) {
      toast.error("You don't have permission to modify approved tasks");
      setDragOverCol(null);
      setDragOverProjectId(null);
      return;
    }

    const destProjKey = targetProjId || targetTask.project_id || 'unassigned';

    const updatedTask = { 
      ...targetTask, 
      status: newStatus,
      done_date: (newStatus === 'done' || newStatus === 'approve')
        ? (targetTask.done_date || new Date().toISOString().split('T')[0])
        : targetTask.done_date
    };

    // Optimistic UI updates
    setProjectsData(prev => {
      const next = { ...prev };
      const sourceCol = { ...(next[oldStatus] || {}) };
      const sourceProjData = { ...(sourceCol[oldProjKey] || { tasks: [], total: 0 }) };

      sourceCol[oldProjKey] = {
        ...sourceProjData,
        tasks: sourceProjData.tasks.filter(t => t.id !== taskId),
        total: Math.max(0, (sourceProjData.total || 0) - 1)
      };
      next[oldStatus] = sourceCol;

      const destCol = { ...(next[newStatus] || {}) };
      const destProjData = { ...(destCol[destProjKey] || { tasks: [], total: 0, initialLoaded: true }) };

      destCol[destProjKey] = {
        ...destProjData,
        tasks: [updatedTask, ...(destProjData.tasks || []).filter(t => t.id !== taskId)],
        total: (destProjData.total || 0) + 1,
        initialLoaded: true
      };
      next[newStatus] = destCol;

      return next;
    });

    setProjectsSummary(prev => {
      const next = { ...prev };
      const srcList = [...(next[oldStatus] || [])];
      const srcIdx = srcList.findIndex(p => (p.project_id || 'unassigned') === oldProjKey);
      if (srcIdx >= 0) {
        srcList[srcIdx] = { ...srcList[srcIdx], total: Math.max(0, srcList[srcIdx].total - 1) };
      }
      next[oldStatus] = srcList;

      const destList = [...(next[newStatus] || [])];
      const destIdx = destList.findIndex(p => (p.project_id || 'unassigned') === destProjKey);
      if (destIdx >= 0) {
        destList[destIdx] = { ...destList[destIdx], total: (destList[destIdx].total || 0) + 1 };
      } else {
        destList.push({
          project_id: destProjKey === 'unassigned' ? null : destProjKey,
          project_name: targetTask.project_name || 'General / No Project',
          total: 1
        });
      }
      next[newStatus] = destList;
      return next;
    });

    setStatusTotals(prev => ({
      ...prev,
      [oldStatus]: Math.max(0, (prev[oldStatus] || 0) - 1),
      [newStatus]: (prev[newStatus] || 0) + 1
    }));

    // Auto-expand destination project so the user sees the card
    setExpandedProjects(prev => ({
      ...prev,
      [`${newStatus}_${destProjKey}`]: true
    }));

    if (viewMode === 'table') {
      setTableTaskList(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    }

    try {
      const res = await mutate({
        method: 'PUT',
        url: `/api/admin/tasks/${taskId}`,
        data: { status: newStatus }
      });

      if (res?.success) {
        const targetColInfo = activeKanbanColumns.find(c => c.id === newStatus);
        toast.success(`Task moved to ${targetColInfo?.label || newStatus}`);
        if (viewMode === 'table') refreshTableTasks?.();
      } else {
        toast.error(res?.message || 'Failed to update task status');
        fetchProjectsSummary();
      }
    } catch (err) {
      console.error('Status update failed:', err);
      toast.error('An error occurred while updating status');
      fetchProjectsSummary();
    } finally {
      setDragOverCol(null);
      setDragOverProjectId(null);
      setDraggedTask(null);
      setDraggedFromCol(null);
      setDraggedFromProj(null);
      setDraggedFromIndex(null);
    }
  };

  const handleDropOnCol = (e, targetStatus) => {
    e.preventDefault();
    setDragOverCol(null);
    setDragOverProjectId(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTask?.id;
    if (!taskId) return;

    handleMoveTaskStatus(taskId, targetStatus);
  };

  const handleDropOnProject = (e, targetStatus, targetProjKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverCol(null);
    setDragOverProjectId(null);

    const taskId = e.dataTransfer.getData('text/plain') || draggedTask?.id;
    if (!taskId) return;

    handleMoveTaskStatus(taskId, targetStatus, targetProjKey);
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
      handleRefresh();
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
        setProjectsData(prev => {
          const next = { ...prev };
          Object.keys(next).forEach(st => {
            const colProjs = { ...(next[st] || {}) };
            Object.keys(colProjs).forEach(pk => {
              colProjs[pk] = {
                ...colProjs[pk],
                tasks: (colProjs[pk].tasks || []).map(t => t.id === taskId ? { ...t, importanc_status: newImportance } : t)
              };
            });
            next[st] = colProjs;
          });
          return next;
        });
        if (viewMode === 'table') refreshTableTasks?.();
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
      setProjectsData(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(st => {
          const colProjs = { ...(next[st] || {}) };
          Object.keys(colProjs).forEach(pk => {
            const hasTask = (colProjs[pk].tasks || []).some(t => t.id === id);
            if (hasTask) {
              colProjs[pk] = {
                ...colProjs[pk],
                tasks: colProjs[pk].tasks.filter(t => t.id !== id),
                total: Math.max(0, (colProjs[pk].total || 0) - 1)
              };
            }
          });
          next[st] = colProjs;
        });
        return next;
      });
      fetchProjectsSummary();
      if (viewMode === 'table') refreshTableTasks?.();
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
          taskIds: selectedTaskIds,
          status: bulkTargetStatus
        }
      });

      if (res?.success) {
        toast.success(`Successfully moved ${selectedTaskIds.length} tasks to ${activeKanbanColumns.find(c => c.id === bulkTargetStatus)?.label || bulkTargetStatus}`);
        setSelectedTaskIds([]);
        setIsSelectionMode(false);
        handleRefresh();
        if (viewMode === 'table') refreshTableTasks?.();
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

  // Manual refresh all columns & projects
  const handleRefresh = useCallback(() => {
    fetchProjectsSummary();
    Object.entries(expandedProjects).forEach(([key, isOpen]) => {
      if (isOpen) {
        const [st, pk] = key.split('_');
        if (st && pk) fetchProjectTasks(st, pk, 1, false);
      }
    });
    if (viewMode === 'table') refreshTableTasks?.();
  }, [fetchProjectsSummary, expandedProjects, fetchProjectTasks, viewMode, refreshTableTasks]);

  const cardProps = {
    showProjectInfo: false,
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
    availableColumns: activeKanbanColumns
  };

  const totalTasksCount = Object.values(statusTotals).reduce((acc, curr) => acc + (curr || 0), 0);

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
            onClick={handleRefresh}
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
            {activeKanbanColumns.map((col) => {
              const count = statusTotals[col.id] || 0;
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
          {/* Desktop Kanban: scrollable columns side-by-side with Status & Project grouping */}
          <div className="hidden md:flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-start">
            {activeKanbanColumns.map((col) => {
              const projectSummaries = projectsSummary[col.id] || [];
              const columnProjectGroups = projectSummaries.map((p) => {
                const projKey = p.project_id || 'unassigned';
                const projData = projectsData[col.id]?.[projKey] || {
                  tasks: [],
                  loading: false,
                  loadingMore: false,
                  hasMore: false,
                  total: p.total || 0,
                  page: 1
                };
                const isOpen = Boolean(expandedProjects[`${col.id}_${projKey}`]);

                return {
                  id: projKey,
                  name: p.project_name || 'General / No Project',
                  total: p.total ?? 0,
                  tasks: projData.tasks || [],
                  loading: projData.loading || false,
                  loadingMore: projData.loadingMore || false,
                  hasMore: projData.hasMore || false,
                  isOpen,
                  onToggle: () => handleToggleProject(col.id, projKey),
                  onLoadMore: () => handleLoadMoreProject(col.id, projKey)
                };
              });

              return (
                <KanbanColumn
                  key={col.id}
                  column={col}
                  total={statusTotals[col.id] || 0}
                  loading={summaryLoading}
                  projectGroups={columnProjectGroups}
                  allProjectsOpen={columnProjectGroups.length > 0 && columnProjectGroups.every(g => g.isOpen)}
                  onToggleAllProjects={() => handleToggleAllProjectsInColumn(col.id)}
                  isDragOver={dragOverCol === col.id}
                  onDragOver={handleDragOverCol}
                  onDragLeave={handleDragLeaveCol}
                  onDrop={handleDropOnCol}
                  dragOverProjectId={dragOverProjectId}
                  onDragOverProject={handleDragOverProject}
                  onDragLeaveProject={handleDragLeaveProject}
                  onDropOnProject={handleDropOnProject}
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
              const activeCol = activeKanbanColumns.find(c => c.id === mobileActiveTab) || activeKanbanColumns[0];
              const projectSummaries = projectsSummary[activeCol.id] || [];
              const columnProjectGroups = projectSummaries.map((p) => {
                const projKey = p.project_id || 'unassigned';
                const projData = projectsData[activeCol.id]?.[projKey] || {
                  tasks: [],
                  loading: false,
                  loadingMore: false,
                  hasMore: false,
                  total: p.total || 0,
                  page: 1
                };
                const isOpen = Boolean(expandedProjects[`${activeCol.id}_${projKey}`]);

                return {
                  id: projKey,
                  name: p.project_name || 'General / No Project',
                  total: p.total ?? 0,
                  tasks: projData.tasks || [],
                  loading: projData.loading || false,
                  loadingMore: projData.loadingMore || false,
                  hasMore: projData.hasMore || false,
                  isOpen,
                  onToggle: () => handleToggleProject(activeCol.id, projKey),
                  onLoadMore: () => handleLoadMoreProject(activeCol.id, projKey)
                };
              });

              return (
                <KanbanColumn
                  column={activeCol}
                  total={statusTotals[activeCol.id] || 0}
                  loading={summaryLoading}
                  projectGroups={columnProjectGroups}
                  allProjectsOpen={columnProjectGroups.length > 0 && columnProjectGroups.every(g => g.isOpen)}
                  onToggleAllProjects={() => handleToggleAllProjectsInColumn(activeCol.id)}
                  isDragOver={dragOverCol === activeCol.id}
                  onDragOver={handleDragOverCol}
                  onDragLeave={handleDragLeaveCol}
                  onDrop={handleDropOnCol}
                  dragOverProjectId={dragOverProjectId}
                  onDragOverProject={handleDragOverProject}
                  onDragLeaveProject={handleDragLeaveProject}
                  onDropOnProject={handleDropOnProject}
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
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5" title={`Project: ${task.project_name || 'N/A'}`}>
                              <FolderKanban className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span className="font-semibold text-foreground truncate max-w-[180px]">
                                {task.project_name || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5" title={`Group: ${task.group_name || task.project_group || 'N/A'}`}>
                              <Layers className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="text-xs font-medium text-muted-foreground truncate max-w-[180px]">
                                {task.group_name || task.project_group || 'N/A'}
                              </span>
                            </div>
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
        {activeKanbanColumns.map((col) => {
          const count = statusTotals[col.id] || 0;
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
