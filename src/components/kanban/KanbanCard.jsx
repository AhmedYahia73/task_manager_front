import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GripVertical, 
  Calendar, 
  Eye, 
  Edit, 
  Trash2, 
  FileText, 
  CheckSquare, 
  Square,
  AlertCircle,
  MoreVertical,
  Check,
  ChevronDown,
  Lock,
  AlarmClock
} from 'lucide-react';
import dayjs from 'dayjs';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';
import { isTaskDelayedCompleted } from '@/lib/utils';

export const KanbanCard = ({
  task,
  index,
  columnId,
  dragOverCardId,
  projectId,
  groupId,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onDragStart,
  onDragEnd,
  onDragOverCard,
  onDragLeaveCard,
  onDropOnCard,
  onOpenModal,
  onDelete,
  onStatusChange,
  onImportanceChange,
  onViewDoc,
  isLeaderOrAdmin,
  isAdmin,
  getRoleName,
  availableColumns = []
}) => {
  const navigate = useNavigate();
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const isCardSelected = typeof isSelected === 'function' ? isSelected(task.id) : Boolean(isSelected);

  // Permission: if task is approved, only Leader or Admin can modify its status
  const taskProjectId = projectId || task.project_id;
  const taskGroupId = groupId || task.group_id;
  const detailsUrl = taskProjectId && taskGroupId 
    ? `/admin/projects/${taskProjectId}/groups/${taskGroupId}/tasks/${task.id}` 
    : `/admin/tasks/${task.id}/view`;

  const isApproved = task.status === 'approve';
  const canModifyThisTask = isLeaderOrAdmin || !isApproved;

  // Status helper styles
  const getStatusStyles = (status) => {
    switch (status) {
      case 'done': return { color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'Completed' };
      case 'inprogress': return { color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', label: 'In Progress' };
      case 'pending': return { color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', label: 'Pending' };
      case 'edit': return { color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800', label: 'Need to Revision' };
      case 'approve': return { color: 'bg-purple-500', badge: 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-800', label: 'Approved' };
      default: return { color: 'bg-muted', badge: 'bg-muted text-muted-foreground border-border', label: status };
    }
  };

  const getImportanceStyles = (importance) => {
    switch (importance) {
      case 'urgent': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800 shadow-[0_0_8px_rgba(239,68,68,0.35)]';
      case 'high': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  const statusStyle = getStatusStyles(task.status);
  const isOverdue = task.delivery_date && dayjs(task.delivery_date).isBefore(dayjs(), 'day') && task.status !== 'done' && task.status !== 'approve';
  const isToday = task.delivery_date && dayjs(task.delivery_date).isSame(dayjs(), 'day');
  const isDelayedComplete = isTaskDelayedCompleted(task);
  const isInDelayCol = columnId === 'delay';

  // Handle card click
  const handleCardClick = (e) => {
    if (isSelectionMode) {
      e.stopPropagation();
      onToggleSelect(task.id);
    }
  };

  // Check if status option is allowed for current user
  const isStatusAllowed = (targetStatus) => {
    if (task.status === targetStatus) return false;
    if (task.status === 'approve') {
      if (!isLeaderOrAdmin) return false;
      return targetStatus === 'edit';
    }
    if (!isLeaderOrAdmin && (targetStatus === 'approve' || targetStatus === 'edit')) {
      return false;
    }
    return true;
  };

  const isUrgent = (
    task.importanc_status?.toLowerCase?.() === 'urgent' ||
    task.importance?.toLowerCase?.() === 'urgent' ||
    (task.date_urgent && String(task.date_urgent).split('T')[0] <= new Date().toISOString().split('T')[0])
  ) && task.status !== 'approve';

  const isBeingDraggedOver = dragOverCardId === task.id;

  return (
    <div
      draggable={!isSelectionMode && canModifyThisTask}
      onDragStart={(e) => onDragStart && onDragStart(e, task, columnId, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOverCard && onDragOverCard(e, task, columnId, index)}
      onDragLeave={(e) => onDragLeaveCard && onDragLeaveCard(e, task, columnId, index)}
      onDrop={(e) => onDropOnCard && onDropOnCard(e, task, columnId, index)}
      onClick={handleCardClick}
      className={`group relative rounded-xl border bg-card p-3.5 shadow-xs transition-all duration-200 select-none overflow-hidden ${
        isCardSelected 
          ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md' 
          : isBeingDraggedOver
            ? 'ring-2 ring-primary border-primary bg-primary/10 shadow-lg scale-[1.02] z-10'
            : isUrgent
              ? 'urgent-card-glow border-red-300 dark:border-red-900/60'
              : 'border-border/80 hover:border-primary/40 hover:shadow-md'
      } ${
        isUrgent || isInDelayCol || isDelayedComplete
          ? 'border-l-4 border-l-red-500'
          : `border-l-4 ${statusStyle.color.replace('bg-', 'border-l-')}`
      } ${
        isSelectionMode 
          ? 'cursor-pointer' 
          : canModifyThisTask 
            ? 'cursor-grab active:cursor-grabbing' 
            : 'cursor-default opacity-90'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Selection Checkbox */}
          {isSelectionMode ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleSelect(task.id);
              }}
              className="text-primary hover:scale-110 transition-transform p-0.5"
            >
              {isCardSelected ? (
                <CheckSquare className="w-5 h-5 text-primary fill-primary/20" />
              ) : (
                <Square className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          ) : canModifyThisTask ? (
            <div 
              className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors p-0.5" 
              title={isLeaderOrAdmin ? "اسحب لإعادة الترتيب أو تغيير الحالة" : "اسحب لتغيير الحالة"}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          ) : (
            <div className="text-purple-600 dark:text-purple-400 p-0.5" title="Approved Task: Locked (Only Leader or Admin can modify)">
              <Lock className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Importance Badge */}
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wider border ${getImportanceStyles(task.importanc_status || 'medium')}`}>
            {isUrgent && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
            {task.importanc_status || 'medium'}
          </span>

          {/* Role Badge */}
          {task.user_role && <ProjectRoleBadge role={task.user_role} />}

          {/* Locked Badge if not authorized */}
          {!canModifyThisTask && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Lock className="w-2.5 h-2.5" />
              Locked
            </span>
          )}
        </div>

        {/* Quick Actions Menu */}
        <div className="flex items-center gap-0.5 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="View Details"
            onClick={() => navigate(detailsUrl)}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            title="Edit Task"
            onClick={() => onOpenModal(task)}
            className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          {isLeaderOrAdmin && (
            <button
              type="button"
              title="Delete Task"
              onClick={() => onDelete(task.id)}
              className="flex h-6.5 w-6.5 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Delayed Completed Alert Note */}
      {isDelayedComplete && (
        <div className="mb-2.5 flex items-center justify-between gap-1.5 rounded-lg bg-red-500/10 dark:bg-red-950/40 p-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-500/30">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600 dark:text-red-400" />
            <span className="truncate">Delay: Completed after deadline</span>
          </div>
          {task.done_date && (
            <span className="text-[10px] font-normal opacity-85 shrink-0">
              Done: {dayjs(task.done_date).format('MMM D')}
            </span>
          )}
        </div>
      )}

      {/* Delayed Active Task in Delay Column */}
      {isInDelayCol && (
        <div className="mb-2.5 flex items-center justify-between gap-1.5 rounded-lg bg-rose-500/10 dark:bg-rose-950/40 p-2 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/30">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlarmClock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">Delayed / متأخر عن الموعد</span>
          </div>
          {task.delivery_date && (
            <span className="text-[10px] font-normal opacity-85 shrink-0">
              Due: {dayjs(task.delivery_date).format('MMM D')}
            </span>
          )}
        </div>
      )}

      {/* Task Title */}
      <div className="mb-1.5">
        <Link
          to={detailsUrl}
          onClick={(e) => {
            if (isSelectionMode) {
              e.preventDefault();
              onToggleSelect(task.id);
            } else {
              e.stopPropagation();
            }
          }}
          className={`font-plus-jakarta text-sm font-bold text-foreground hover:text-primary transition-colors line-clamp-2 ${
            task.status === 'done' || task.status === 'approve' ? 'line-through text-muted-foreground' : ''
          }`}
        >
          {task.name}
        </Link>
      </div>

      {/* Task Description Snippet */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Tester QA Note */}
      {task.tester_note && (
        <div className="mb-2.5 flex items-start gap-1.5 rounded-lg bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300 border border-amber-500/20">
          <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">speaker_notes</span>
          <span className="line-clamp-2">
            <strong className="font-semibold">{getRoleName ? getRoleName('tester') : 'Tester'}:</strong> {task.tester_note}
          </span>
        </div>
      )}

      {/* Documentation Link */}
      {task.documentation && (
        <div className="mb-2.5">
          <button
            type="button"
            onClick={(e) => onViewDoc(e, task.documentation)}
            className="inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2 py-1 rounded-md transition-colors cursor-pointer border-none font-medium"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Attached</span>
          </button>
        </div>
      )}

      {/* Divider */}
      <div className="my-2 border-t border-border/60" />

      {/* Footer Info: User Avatar & Delivery Date */}
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground pt-0.5">
        {/* Assignee */}
        <div className="flex items-center gap-1.5 min-w-0" title={task.user_name || 'Unassigned'}>
          {task.user_image ? (
            <img
              src={task.user_image}
              alt={task.user_name || ''}
              className="h-6 w-6 rounded-full object-cover border border-border shrink-0"
            />
          ) : (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] border border-primary/20">
              {task.user_name ? task.user_name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <span className="truncate text-foreground font-medium text-[11.5px]">
            {task.user_name || 'Unassigned'}
          </span>
        </div>

        {/* Delivery Date & Urgent Trigger Date */}
        <div className="flex items-center gap-1.5 shrink-0">
          {task.date_urgent && (
            <div 
              title={`Urgent Trigger Date: ${typeof task.date_urgent === 'string' ? task.date_urgent.split('T')[0] : dayjs(task.date_urgent).format('YYYY-MM-DD')}`}
              className="flex items-center gap-1 font-semibold text-[10.5px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800"
            >
              <AlarmClock className="w-3 h-3 text-red-500" />
              <span>
                {typeof task.date_urgent === 'string'
                  ? dayjs(task.date_urgent.split('T')[0]).format('MMM D')
                  : dayjs(task.date_urgent).format('MMM D')}
              </span>
            </div>
          )}

          {task.delivery_date && (
            <div className={`flex items-center gap-1 shrink-0 font-medium text-[11px] ${
              isDelayedComplete || isOverdue || isInDelayCol
                ? 'text-red-600 dark:text-red-400 font-semibold' 
                : isToday 
                  ? 'text-amber-600 dark:text-amber-400 font-semibold' 
                  : 'text-muted-foreground'
            }`}>
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {typeof task.delivery_date === 'string'
                  ? dayjs(task.delivery_date.split('T')[0]).format('MMM D')
                  : dayjs(task.delivery_date).format('MMM D')}
                {isDelayedComplete && ' (Delay)'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Move Status Picker Button ("By Selection" for mobile & desktop) */}
      <div className="mt-2.5 pt-1.5 border-t border-border/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          {canModifyThisTask ? 'Move to:' : 'Status:'}
        </span>

        {/* If user CANNOT modify this task (e.g. Approved task and user is Engineer) -> Locked Badge */}
        {!canModifyThisTask ? (
          <div 
            title="Approved tasks are locked. Only Leader or Admin can request revision."
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800 cursor-not-allowed select-none"
          >
            <Lock className="w-3 h-3 text-purple-600" />
            <span>Approved (Locked)</span>
          </div>
        ) : (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu(!showStatusMenu)}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border transition-all hover:scale-105 cursor-pointer shadow-xs ${statusStyle.badge}`}
            >
              <span>{statusStyle.label}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {/* Status Selection Popover with Permission-Differentiated Styles */}
            {showStatusMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowStatusMenu(false)} 
                />
                <div className="absolute right-0 bottom-full mb-1 z-50 w-52 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                  <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select New Status
                  </p>
                  {availableColumns.filter(c => c.id !== 'delay').map((col) => {
                    const allowed = isStatusAllowed(col.id);
                    const isCurrent = task.status === col.id;

                    if (allowed) {
                      return (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            setShowStatusMenu(false);
                            onStatusChange(task.id, col.id);
                          }}
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium hover:bg-primary/10 hover:text-primary cursor-pointer text-foreground"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                            {col.label}
                          </span>
                          <span className="text-[10px] text-primary font-semibold">Change</span>
                        </button>
                      );
                    } else if (isCurrent) {
                      return (
                        <div
                          key={col.id}
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left font-medium bg-muted text-foreground cursor-default"
                        >
                          <span className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                            {col.label}
                          </span>
                          <Check className="w-3.5 h-3.5 text-primary" />
                        </div>
                      );
                    } else {
                      // Disallowed: Distinct Restricted Appearance with Lock
                      return (
                        <div
                          key={col.id}
                          title="Requires Leader or Admin permission"
                          className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left text-muted-foreground/60 bg-muted/30 border border-dashed border-border/40 cursor-not-allowed my-0.5 select-none"
                        >
                          <span className="flex items-center gap-1.5">
                            <Lock className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                            <span className="line-through">{col.label}</span>
                          </span>
                          <span className="text-[9px] font-bold text-amber-600/80 dark:text-amber-400/80 bg-amber-500/10 px-1 rounded">
                            Leader only
                          </span>
                        </div>
                      );
                    }
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

