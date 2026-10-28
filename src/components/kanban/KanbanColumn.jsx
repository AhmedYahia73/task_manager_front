import React from 'react';
import { KanbanCard } from './KanbanCard';
import { Plus, Loader2, Inbox, Lock } from 'lucide-react';

export const KanbanColumn = ({
  column,
  tasks = [],
  total = 0,
  loading = false,
  loadingMore = false,
  hasMore = false,
  onScroll,
  isDragOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onAddTask,
  cardProps
}) => {
  const isLeaderOrAdmin = cardProps?.isLeaderOrAdmin;
  const isColumnRestricted = !isLeaderOrAdmin && (column.id === 'approve' || column.id === 'edit');

  return (
    <div
      onDragOver={(e) => onDragOver(e, column.id)}
      onDragLeave={(e) => onDragLeave(e, column.id)}
      onDrop={(e) => onDrop(e, column.id)}
      className={`flex flex-col rounded-2xl border bg-muted/30 backdrop-blur-xs transition-all duration-200 overflow-hidden min-w-[280px] max-w-full flex-1 ${
        isDragOver
          ? isColumnRestricted
            ? 'ring-2 ring-red-400 bg-red-50/40 dark:bg-red-950/20 border-red-400/50 shadow-lg'
            : `${column.dropHighlight} border-primary/50 shadow-lg scale-[1.01]`
          : isColumnRestricted
            ? 'border-border/60 bg-muted/15'
            : 'border-border/70 hover:border-border'
      }`}
      style={{ height: 'calc(100vh - 240px)', minHeight: '520px' }}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between border-b border-border/60 bg-card/80 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className={`flex h-3 w-3 rounded-full ${column.dotColor}`} />
          <h3 className="font-plus-jakarta text-sm font-bold text-foreground">
            {column.label}
          </h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs font-semibold text-muted-foreground">
            {total}
          </span>
        </div>

        {/* Quick Add Task to this Column or Locked indicator */}
        {isColumnRestricted ? (
          <span 
            title="Only Leaders and Admins can create tasks in or move tasks to this status"
            className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/80 bg-muted/60 px-2 py-0.5 rounded-md border border-border/50 select-none"
          >
            <Lock className="w-2.5 h-2.5 text-amber-500" />
            <span>Leader Only</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onAddTask(column.id)}
            title={`Add task in ${column.label}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Drop Zone Banner indicator when dragging over */}
      {isDragOver && (
        <div className={`px-3 py-2 border-b text-center animate-pulse ${
          isColumnRestricted 
            ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
            : 'bg-primary/10 border-primary/20 text-primary'
        }`}>
          <p className="text-xs font-semibold flex items-center justify-center gap-1">
            {isColumnRestricted ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted: Only Leaders & Admins can move tasks here</span>
              </>
            ) : (
              <span>Drop here to move to {column.label}</span>
            )}
          </p>
        </div>
      )}

      {/* Scrollable Tasks Container with Infinite Scroll */}
      <div
        onScroll={(e) => onScroll(column.id, e)}
        className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar"
      >
        {/* Initial Loading Skeletons */}
        {loading && tasks.length === 0 ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="animate-pulse rounded-xl border border-border/50 bg-card p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="h-4 w-16 bg-muted rounded" />
                  <div className="h-4 w-8 bg-muted rounded" />
                </div>
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
                <div className="flex justify-between items-center pt-2">
                  <div className="h-5 w-5 bg-muted rounded-full" />
                  <div className="h-3 w-16 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-3">
              <Inbox className="w-6 h-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              No tasks in {column.label}
            </p>
            <p className="text-[11px] text-muted-foreground/80 mt-1 max-w-[180px]">
              Drag a task here or click + to create one
            </p>
          </div>
        ) : (
          /* Task Cards List */
          <>
            {tasks.map((task) => (
              <KanbanCard
                key={task.id}
                task={task}
                {...cardProps}
              />
            ))}

            {/* Loading More Spinner (Infinite Scroll Bottom Indicator) */}
            {loadingMore && (
              <div className="py-3 flex items-center justify-center gap-2 text-xs text-primary font-medium animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Loading more tasks...</span>
              </div>
            )}

            {/* End of list badge if all loaded and more than 1 page */}
            {!hasMore && tasks.length > 5 && (
              <div className="pt-2 pb-1 text-center">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                  All {total} tasks loaded
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
