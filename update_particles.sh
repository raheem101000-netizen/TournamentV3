#!/bin/bash
# Script to update Particles config in all files

FILES=(
  "client/src/pages/preview-account.tsx"
  "client/src/pages/preview-server-detail.tsx"
  "client/src/pages/preview-messages.tsx"
  "client/src/pages/preview-create-team.tsx"
  "client/src/pages/preview-organizer-award.tsx"
  "client/src/pages/preview-poster-builder.tsx"
  "client/src/pages/preview-templates.tsx"
)

for FILE in "${FILES[@]}"; do
  echo "Updating $FILE..."
  
  # Replace the old Particles config with new one
  sed -i '' 's/particleCount={100}/particleCount={200}/g' "$FILE"
  sed -i '' 's/particleSpread={15}/particleSpread={10}/g' "$FILE"
  sed -i '' "s/speed={0.03}/speed={0.1}/g" "$FILE"
  sed -i '' "s/particleColors={\['#8b5cf6', '#3b82f6', '#06b6d4'\]}/particleColors={['#ffffff', '#ffffff']}/g" "$FILE"
  sed -i '' 's/alphaParticles={true}/alphaParticles={false}/g' "$FILE"
  sed -i '' 's/particleBaseSize={60}/particleBaseSize={100}/g' "$FILE"
  
  # Remove old props and add new ones
  sed -i '' '/sizeRandomness/d' "$FILE"
  sed -i '' '/cameraDistance/d' "$FILE"
  
  echo "  ✓ Updated"
done

echo "All files updated!"
