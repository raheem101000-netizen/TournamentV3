#!/bin/bash
# Auto-add Particles to specified pages

PARTICLE_COMPONENT='
      <Particles
        particleCount={100}
        particleSpread={15}
        speed={0.03}
        particleColors={["'"'"'#8b5cf6'"'"'", "'"'"'#3b82f6'"'"'", "'"'"'#06b6d4'"'"'"]}
        alphaParticles={true}
        particleBaseSize={60}
        sizeRandomness={0.5}
        cameraDistance={25}
        disableRotation={false}
        className="fixed inset-0 z-0 pointer-events-none"
      />'

PAGES=("preview-create-team" "preview-organizer-award" "preview-poster-builder" "preview-templates")

for PAGE in "${PAGES[@]}"; do
  FILE="client/src/pages/$PAGE.tsx"
  echo "Adding Particles to $PAGE..."
  
  # Add import if not exists
  if ! grep -q "import Particles" "$FILE"; then
    # Find BottomNavigation import line and add Particles import after it
    sed -i '' '/import.*BottomNavigation/a\'$'\n''import Particles from "@/components/ui/particles";' "$FILE"
    echo "  - Added Particles import"
  fi
  
  echo "  - Done"
done

echo "All Particles imports added!"
