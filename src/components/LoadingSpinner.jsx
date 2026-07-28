import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // دالة shadcn لدمج الكلاسات

export default function LoadingSpinner({ className, size = 24, label }) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
            <Loader2
                size={size}
                className="animate-spin text-primary"
            />
            {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
        </div>
    );
}