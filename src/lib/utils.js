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

  // المقارنة تعتمد حصراً على تاريخ الإنجاز (done_date) مقارنة بموعد التسليم (delivery_date).
  // تأخر الموافقة (approve) لا يعتبر تأخيراً في إنجاز المهمة.
  // في حال عدم توفر تاريخ done_date، لا يمكن اعتبار المهمة متأخرة.
  if (!task.done_date) return false;

  const toDateOnly = (val) => {
    if (!val) return null;
    if (typeof val === 'string') {
      const match = val.match(/^\d{4}-\d{2}-\d{2}/);
      return match ? match[0] : null;
    }
    const d = dayjs(val);
    return d.isValid() ? d.format('YYYY-MM-DD') : null;
  };

  const deliveryDateOnly = toDateOnly(task.delivery_date);
  const doneDateOnly = toDateOnly(task.done_date);

  if (!deliveryDateOnly || !doneDateOnly) return false;

  return doneDateOnly > deliveryDateOnly;
};
