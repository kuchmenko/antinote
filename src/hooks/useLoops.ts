import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loop } from "@/lib/services/types";
import { useAuth } from "@clerk/nextjs";

export function useLoops(date?: Date) {
    const { userId } = useAuth();
    const queryClient = useQueryClient();

    const loopsQuery = useQuery<Loop[]>({
        queryKey: ["loops", date?.toISOString().split("T")[0], userId],
        queryFn: async () => {
            if (!userId) {
                return [];
            }

            const url = date ? `/api/loops?date=${date.toISOString().split("T")[0]}` : "/api/loops";

            const response = await fetch(url);

            if (!response.ok) {
                throw new Error("Failed to fetch loops");
            }

            const data = await response.json();
            return data;
        },
        enabled: !!userId,
    });

    const markDoneMutation = useMutation({
        mutationFn: async (loopId: string) => {
            const response = await fetch(`/api/loops/${loopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "done" }),
            });

            if (!response.ok) {
                throw new Error("Failed to mark loop as done");
            }

            queryClient.setQueryData(["loops", date?.toISOString().split("T")[0], userId], (old: Loop[] | undefined) => {
                if (!old) return [];
                const updated = old.map(l => l.id === loopId ? { ...l, status: "done" as const, doneAt: new Date().toISOString() } : l);
                return updated;
            });

            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
    });

    const snoozeMutation = useMutation({
        mutationFn: async ({ loopId, until }: { loopId: string; until: Date }) => {
            const response = await fetch(`/api/loops/${loopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snoozedUntil: until.toISOString() }),
            });

            if (!response.ok) {
                throw new Error("Failed to snooze loop");
            }

            queryClient.setQueryData(["loops", date?.toISOString().split("T")[0], userId], (old: Loop[] | undefined) => {
                if (!old) return [];
                const updated = old.map(l => l.id === loopId ? { ...l, status: "snoozed" as const, snoozedUntil: until.toISOString() } : l);
                return updated;
            });

            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
    });

    const unsnoozeMutation = useMutation({
        mutationFn: async (loopId: string) => {
            const response = await fetch(`/api/loops/${loopId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snoozedUntil: null }),
            });

            if (!response.ok) {
                throw new Error("Failed to unsnooze loop");
            }

            queryClient.setQueryData(["loops", date?.toISOString().split("T")[0], userId], (old: Loop[] | undefined) => {
                if (!old) return [];
                const updated = old.map(l => l.id === loopId ? { ...l, status: "open" as const, snoozedUntil: null } : l);
                return updated;
            });

            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["loops"] });
        },
    });

    return {
        loops: loopsQuery.data || [],
        isLoading: loopsQuery.isLoading,
        error: loopsQuery.error,
        markDone: markDoneMutation.mutate,
        snooze: snoozeMutation.mutate,
        unsnooze: unsnoozeMutation.mutate,
    };
}

export function useLoopsByStatus(date?: Date) {
    const { loops } = useLoops(date);

    const loopsArray = Array.isArray(loops) ? loops : [];

    const open = loopsArray.filter(l => l.status === "open");
    const done = loopsArray.filter(l => l.status === "done");
    const snoozed = loopsArray.filter(l => l.status === "snoozed");

    return { open, done, snoozed, total: loopsArray.length };
}
