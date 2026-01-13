
import { MobileLayout } from "@/components/layouts/MobileLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function AppShellLoader() {
    return (
        <MobileLayout showBottomNav={true}>
            <div className="p-4 space-y-4">
                {/* Header Skeleton */}
                <div>
                    <Skeleton className="h-8 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </div>

                {/* Search Bar Skeleton */}
                <div className="flex flex-col gap-3">
                    <Skeleton className="h-10 w-full rounded-md" />
                    <div className="flex gap-2 pb-1">
                        <Skeleton className="h-8 w-20 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full" />
                        <Skeleton className="h-8 w-20 rounded-full" />
                    </div>
                </div>

                {/* Section Header */}
                <Skeleton className="h-6 w-24 mt-4" />

                {/* Grid Skeletons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="overflow-hidden border-border/50">
                            <Skeleton className="aspect-square w-full" />
                            <div className="p-3 space-y-3">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-3/4 mx-auto" />
                                    <Skeleton className="h-3 w-1/2 mx-auto" />
                                </div>
                                <div className="flex gap-2">
                                    <Skeleton className="h-9 flex-1" />
                                    <Skeleton className="h-9 w-9" />
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </MobileLayout>
    );
}
