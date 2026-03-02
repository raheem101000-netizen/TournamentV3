import { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";

interface MobileLayoutProps {
    children: ReactNode;
    showBottomNav?: boolean;
    showParticles?: boolean;
    disableContentBottomPadding?: boolean;
}

export function MobileLayout({
    children,
    showBottomNav = true,
    showParticles = true, // Enabled by default for visual polish
    disableContentBottomPadding = false,
}: MobileLayoutProps) {
    return (
        <>


            <div className={`min-h-screen relative z-10 ${showBottomNav && !disableContentBottomPadding ? 'pb-20' : ''}`}>
                {children}
            </div>

            {showBottomNav && <BottomNavigation />}
        </>
    );
}
