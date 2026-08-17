import React from 'react';
import TaskCard from './TaskCard';
import EmptyState from './EmptyState';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

/**
 * KanbanBoard Component
 * Implements a 3-column enterprise Kanban layout
 * - Pending Verification
 * - Under Review / In Progress
 * - Completed / Resolved (Approved & Rejected)
 */
export default function KanbanBoard({
  tasks,
  onStatusChange,
  isSocketOpen,
  isMutating,
  onResetTasks,
}) {
  const pendingTasks = tasks.filter((t) => t.status === 'PENDING');
  const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = tasks.filter((t) => t.status === 'APPROVED' || t.status === 'REJECTED');

  const totalTasks = tasks.length;
  const isAllCaughtUp = pendingTasks.length === 0 && inProgressTasks.length === 0 && totalTasks > 0;

  const columns = [
    {
      id: 'pending',
      title: 'Pending Verification',
      subtitle: 'Awaiting analyst triage or authorization',
      count: pendingTasks.length,
      icon: Clock,
      tasks: pendingTasks,
      emptyMessage: 'No pending tickets in queue.',
      emptyActionText: 'Reset Sample Queue',
    },
    {
      id: 'in_progress',
      title: 'Under Review',
      subtitle: 'Currently in active deep-dive investigation',
      count: inProgressTasks.length,
      icon: ShieldAlert,
      tasks: inProgressTasks,
      emptyMessage: 'No items currently in active review.',
    },
    {
      id: 'completed',
      title: 'Completed & Resolved',
      subtitle: 'Approved authorizations and rejected risk items',
      count: completedTasks.length,
      icon: CheckCircle2,
      tasks: completedTasks,
      emptyMessage: 'No completed tickets yet.',
    },
  ];

  return (
    <div className="kanban-layout" role="region" aria-label="Verification Workflow Kanban Board">
      {/* Global celebratory banner when all pending work is cleared */}
      {isAllCaughtUp && (
        <div className="kanban-celebration-banner" role="status" aria-live="polite">
          <div className="celebration-content">
            <span className="celebration-badge">Workflow In Sync</span>
            <h3>✨ All Operational Queues Cleared!</h3>
            <p>100% of incoming verification tickets have been processed and broadcasted via WebSocket.</p>
          </div>
          {onResetTasks && (
            <button
              type="button"
              onClick={onResetTasks}
              className="btn-celebration-reset"
              aria-label="Reload sample verification tickets"
            >
              Load Fresh Queue
            </button>
          )}
        </div>
      )}

      {/* 3-Column Grid */}
      <div className="kanban-columns-grid">
        {columns.map((column) => {
          const ColumnIcon = column.icon;

          return (
            <section
              key={column.id}
              className={`kanban-column kanban-column-${column.id}`}
              aria-labelledby={`col-header-${column.id}`}
            >
              {/* Column Header */}
              <div className="kanban-column-header">
                <div className="col-header-left">
                  <div className="col-icon-wrapper">
                    <ColumnIcon size={16} aria-hidden="true" />
                  </div>
                  <h3 id={`col-header-${column.id}`} className="col-title">
                    {column.title}
                  </h3>
                </div>
                <span
                  className="col-count-badge"
                  aria-label={`${column.count} tickets in ${column.title}`}
                >
                  {column.count}
                </span>
              </div>

              <p className="col-subtitle">{column.subtitle}</p>

              {/* Task List / Column Items */}
              <div className="kanban-column-body">
                {column.tasks.length === 0 ? (
                  <EmptyState
                    title={column.id === 'pending' ? 'All caught up!' : column.emptyMessage}
                    subtitle={
                      column.id === 'pending'
                        ? 'Zero pending tickets waiting in this operations lane.'
                        : 'Tickets will appear here when moved into this state.'
                    }
                    onReset={column.id === 'pending' ? onResetTasks : undefined}
                    isGlobal={false}
                  />
                ) : (
                  <ul className="task-list" role="list">
                    {column.tasks.map((task) => (
                      <li key={task.id} className="task-list-item">
                        <TaskCard
                          task={task}
                          onStatusChange={onStatusChange}
                          isSocketOpen={isSocketOpen}
                          isMutating={isMutating}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
