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
                    particleColors={['#8b5cf6', '#a78bfa', '#c4b5fd']}
                    particleCount={150}
                    particleSpread={10}
                    speed={0.05}
                    particleBaseSize={250}
                    sizeRandomness={0}
                    moveParticlesOnHover={false}
                    alphaParticles={false}
                    disableRotation={false}
                    className="fixed inset-0 z-0 pointer-events-none"
                />
            )}

            {showBottomNav && <BottomNavigation />}
        </>
    );
}
