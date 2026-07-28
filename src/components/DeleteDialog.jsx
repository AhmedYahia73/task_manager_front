import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const DeleteDialog = ({ isOpen, onClose, onConfirm, loading }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-zinc-500 my-4">
                    Are you sure you want to delete this item? This action cannot be undone.
                </p>
                <DialogFooter className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                        {loading ? "Deleting..." : "Delete"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};