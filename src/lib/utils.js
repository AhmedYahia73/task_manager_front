import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs from "dayjs";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const isTaskDelayedCompleted = (task) => {
  if (!task) return false;
  if (task.status !== 'done' && task.status !== 'approve') return false;
  if (!task.delivery_date) return false;

  const dateOnly = typeof task.delivery_date === 'string' ? task.delivery_date.split('T')[0] : task.delivery_date;
  const deadlineEnd = dayjs(dateOnly).endOf('day');

  const completionDate = task.done_date || task.updatedAt;
  if (completionDate) {
    return dayjs(completionDate).isAfter(deadlineEnd);
  }

  // Fallback if timestamps are missing: check if delivery_date is before today
  return dayjs(dateOnly).isBefore(dayjs(), 'day');
};
