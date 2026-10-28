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
  ChevronDown
} from 'lucide-react';
import dayjs from 'dayjs';
import { ProjectRoleBadge } from '@/components/ProjectRoleBadge';

export const KanbanCard = ({
  task,
  projectId,
  groupId,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onDragStart,
  onDragEnd,
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

  // Status helper styles
  const getStatusStyles = (status) => {
    switch (status) {
      case 'done': return { color: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800', label: 'Done' };
      case 'inprogress': return { color: 'bg-blue-500', badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-800', label: 'In Progress' };
      case 'pending': return { color: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800', label: 'Pending' };
      case 'edit': return { color: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 border-orange-200 dark:border-orange-800', label: 'Needs Revision' };
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

  return (
    <div
      draggable={!isSelectionMode}
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={handleCardClick}
      className={`group relative rounded-xl border bg-card p-3.5 shadow-xs transition-all duration-200 select-none ${
        isSelected 
          ? 'ring-2 ring-primary border-primary bg-primary/5 shadow-md' 
          : 'border-border/80 hover:border-primary/40 hover:shadow-md'
      } ${
        task.importanc_status === 'urgent' && task.status !== 'approve'
          ? 'border-l-4 border-l-red-500'
          : `border-l-4 ${statusStyle.color.replace('bg-', 'border-l-')}`
      } ${
        isSelectionMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'
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
              {isSelected ? (
                <CheckSquare className="w-5 h-5 text-primary fill-primary/20" />
              ) : (
                <Square className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors p-0.5">
              <GripVertical className="w-4 h-4" />
            </div>
          )}

          {/* Importance Badge */}
          <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md uppercase tracking-wider border ${getImportanceStyles(task.importanc_status || 'medium')}`}>
            {task.importanc_status || 'medium'}
          </span>

          {/* Role Badge */}
          {task.user_role && <ProjectRoleBadge role={task.user_role} />}
        </div>

        {/* Quick Actions Dropdown / Menu */}
        <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            title="View Details"
            onClick={() => navigate(`/admin/projects/${projectId}/groups/${groupId}/tasks/${task.id}`)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          <button
            type="button"
            title="Edit Task"
            onClick={() => onOpenModal(task)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            title="Delete Task"
            onClick={() => onDelete(task.id)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <div className="mb-1.5">
        <Link
          to={`/admin/projects/${projectId}/groups/${groupId}/tasks/${task.id}`}
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

        {/* Delivery Date */}
        {task.delivery_date && (
          <div className={`flex items-center gap-1 shrink-0 font-medium text-[11px] ${
            isOverdue 
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
            </span>
          </div>
        )}
      </div>

      {/* Quick Move Status Picker Button ("By Selection" for mobile & desktop) */}
      <div className="mt-2.5 pt-1.5 border-t border-border/40 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Move to:
        </span>

        <div className="relative">
          <button
            type="button"
            onClick={() => setShowStatusMenu(!showStatusMenu)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all hover:scale-105 ${statusStyle.badge}`}
          >
            <span>{statusStyle.label}</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {/* Status Selection Popover */}
          {showStatusMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowStatusMenu(false)} 
              />
              <div className="absolute right-0 bottom-full mb-1 z-50 w-44 rounded-xl border border-border bg-popover p-1.5 shadow-xl animate-in fade-in zoom-in-95">
                <p className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Status
                </p>
                {availableColumns.map((col) => {
                  const allowed = isStatusAllowed(col.id);
                  const isCurrent = task.status === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      disabled={!allowed || isCurrent}
                      onClick={() => {
                        setShowStatusMenu(false);
                        onStatusChange(task.id, col.id);
                      }}
                      className={`flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-xs rounded-lg text-left transition-colors font-medium ${
                        isCurrent
                          ? 'bg-muted text-foreground cursor-default'
                          : allowed
                            ? 'hover:bg-primary/10 hover:text-primary cursor-pointer text-foreground'
                            : 'opacity-40 cursor-not-allowed text-muted-foreground'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                        {col.label}
                      </span>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
