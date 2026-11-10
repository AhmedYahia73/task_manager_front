import React, { useEffect, useRef } from 'react';
import { KanbanCard } from './KanbanCard';
import { 
  ChevronDown, 
  FolderKanban, 
  Loader2, 
  Inbox,
  Layers,
  ArrowDown
} from 'lucide-react';

export const KanbanProjectGroup = ({
  project,
  column,
  isOpen = false,
  onToggle,
  onLoadMore,
  dragOverCardId,
  onDragOverCard,
  onDragLeaveCard,
  onDropOnCard,
  onDragStart,
  onDragEnd,
  cardProps,
  isDragOver = false,
  onDragOverProject,
  onDragLeaveProject,
  onDropOnProject
}) => {
  const sentinelRef = useRef(null);
  const tasks = project.tasks || [];
  const loading = project.loading;
  const loadingMore = project.loadingMore;
  const hasMore = project.hasMore;
  const total = project.total || 0;

  // Infinite scroll observer: triggers onLoadMore when sentinel is visible
  useEffect(() => {
    if (!isOpen || !hasMore || loading || loadingMore) return;

    const sentinelEl = sentinelRef.current;
    if (!sentinelEl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          onLoadMore?.();
        }
      },
      {
        root: null,
        rootMargin: '120px',
        threshold: 0.1
      }
    );

    observer.observe(sentinelEl);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, hasMore, loading, loadingMore, onLoadMore]);

  return (
    <div
      onDragOver={(e) => onDragOverProject?.(e, column.id, project.id)}
      onDragLeave={(e) => onDragLeaveProject?.(e, column.id, project.id)}
      onDrop={(e) => onDropOnProject?.(e, column.id, project.id)}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-card/60 backdrop-blur-xs ${
        isDragOver
          ? 'ring-2 ring-primary/80 border-primary bg-primary/5 shadow-md scale-[1.01]'
          : 'border-border/60 hover:border-border/90 shadow-2xs'
      }`}
    >
      {/* Project Accordion Header */}
      <button
        type="button"
        onClick={onToggle}
        title={isOpen ? "Click to collapse tasks" : "Click to expand tasks"}
        className={`w-full px-3.5 py-2.5 flex items-center justify-between gap-2.5 text-left transition-colors cursor-pointer select-none border-none ${
          isOpen
            ? 'bg-muted/40 hover:bg-muted/60 border-b border-border/50'
            : 'bg-card hover:bg-muted/30'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Animated Down Arrow */}
          <div className={`flex h-6 w-6 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-primary bg-primary/10' : ''
          }`}>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>

          {/* Project Icon */}
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
            <FolderKanban className="w-3.5 h-3.5" />
          </div>

          {/* Project Title */}
          <span className="text-xs sm:text-sm font-bold text-foreground truncate" title={project.name}>
            {project.name}
          </span>
        </div>

        {/* Task Count Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
            total > 0
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-muted text-muted-foreground'
          }`}>
            {total} {total === 1 ? 'task' : 'tasks'}
          </span>
        </div>
      </button>

      {/* Expanded Content: Tasks List */}
      {isOpen && (
        <div className="p-2.5 space-y-2.5 bg-muted/10">
          {/* Initial Loading Skeletons */}
          {loading && tasks.length === 0 ? (
            <div className="space-y-2.5 pt-1">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="animate-pulse rounded-xl border border-border/50 bg-card p-3 space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <div className="h-3.5 w-20 bg-muted rounded" />
                    <div className="h-3.5 w-10 bg-muted rounded" />
                  </div>
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/2 bg-muted rounded" />
                  <div className="flex justify-between items-center pt-1">
                    <div className="h-5 w-5 bg-muted rounded-full" />
                    <div className="h-3 w-16 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            /* Empty State for Project */
            <div className="flex flex-col items-center justify-center py-6 px-3 text-center rounded-xl border border-dashed border-border/50 bg-background/50">
              <Inbox className="w-5 h-5 text-muted-foreground/60 mb-1.5" />
              <p className="text-xs font-semibold text-muted-foreground">
                No tasks for this project in {column.label}
              </p>
            </div>
          ) : (
            /* Tasks List */
            <>
              {tasks.map((task, index) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  index={index}
                  columnId={column.id}
                  dragOverCardId={dragOverCardId}
                  onDragStart={onDragStart || cardProps?.onDragStart}
                  onDragEnd={onDragEnd || cardProps?.onDragEnd}
                  onDragOverCard={onDragOverCard}
                  onDragLeaveCard={onDragLeaveCard}
                  onDropOnCard={onDropOnCard}
                  showProjectInfo={false}
                  {...cardProps}
                />
              ))}

              {/* Infinite Scroll Sentinel element */}
              <div ref={sentinelRef} className="h-1 w-full pointer-events-none" />

              {/* Loading More Spinner */}
              {loadingMore && (
                <div className="py-2 flex items-center justify-center gap-2 text-xs text-primary font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  <span>Loading more tasks...</span>
                </div>
              )}

              {/* Fallback button when more tasks are available */}
              {hasMore && !loadingMore && !loading && (
                <button
                  type="button"
                  onClick={onLoadMore}
                  className="w-full py-1.5 rounded-xl border border-dashed border-primary/30 hover:border-primary/60 text-[11px] font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>Load more ({tasks.length} of {total})</span>
                </button>
              )}

              {/* End of tasks list indicator */}
              {!hasMore && tasks.length >= 5 && (
                <div className="pt-1.5 pb-0.5 text-center">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 font-semibold">
                    All {total} tasks loaded
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
