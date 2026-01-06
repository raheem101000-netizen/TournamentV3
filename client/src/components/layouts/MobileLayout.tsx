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
            {showParticles && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <Particles
                        particleColors={['#8b5cf6', '#a78bfa', '#c4b5fd']}
                        particleCount={150}
                        particleSpread={15}
                        speed={0.05}
                        particleBaseSize={200}
                        cameraDistance={10}
                        sizeRandomness={0.5}
                        moveParticlesOnHover={false}
                        alphaParticles={false}
                        disableRotation={false}
                        className="w-full h-full"
                    />
                </div>
            )}

            <div className="min-h-screen pb-20 relative z-10">
                {children}
            </div>

            {showBottomNav && <BottomNavigation />}
        </>
    );
}
