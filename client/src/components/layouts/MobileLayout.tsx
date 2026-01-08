import { ReactNode, useState, useEffect } from "react";
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
    const [mountParticles, setMountParticles] = useState(false);

    useEffect(() => {
        // Defer particles loading to improve initial page load performance (LCP)
        const timer = setTimeout(() => {
            setMountParticles(true);
        }, 1500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            {showParticles && mountParticles && (
                <div className="fixed inset-0 z-50 pointer-events-none animate-fade-in duration-1000">
                    <Particles
                        particleColors={['#ffffff', '#ffffff', '#ffffff']}
                        particleCount={150}
                        particleSpread={15}
                        speed={0.05}
                        particleBaseSize={100}
                        cameraDistance={20}
                        sizeRandomness={0.3}
                        moveParticlesOnHover={false}
                        alphaParticles={false}
                        disableRotation={false}
                        className="w-full h-full"
                    />
                </div>
            )}

            <div className={`min-h-screen relative z-10 ${showBottomNav ? 'pb-20' : ''}`}>
                {children}
            </div>

            {showBottomNav && <BottomNavigation />}
        </>
    );
}
