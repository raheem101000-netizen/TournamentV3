import { ReactNode } from "react";
import { BottomNavigation } from "@/components/BottomNavigation";
import Particles from "@/components/ui/particles";

interface MobileLayoutProps {
    children: ReactNode;
    showBottomNav?: boolean;
    showParticles?: boolean;
}

export function MobileLayout({
    children,
    showBottomNav = true,
    showParticles = true
}: MobileLayoutProps) {
    return (
        <>
            <div className="min-h-screen pb-20 relative z-10">
                {children}
            </div>

            {showParticles && (
                <Particles
                    particleCount={100}
                    particleSpread={15}
                    speed={0.03}
                    particleColors={['#8b5cf6', '#3b82f6', '#06b6d4']}
                    alphaParticles={true}
                    particleBaseSize={60}
                    sizeRandomness={0.5}
                    cameraDistance={25}
                    disableRotation={false}
                    className="fixed inset-0 z-0 pointer-events-none"
                />
            )}

            {showBottomNav && <BottomNavigation />}
        </>
    );
}
