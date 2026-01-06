#!/bin/bash
# Update all particles to be MUCH bigger and purple/blue

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
  echo "Updating $FILE to LARGE purple particles..."
  
  # Change colors to purple/blue gradient
  sed -i '' "s/particleColors={\['#ffffff', '#ffffff'\]}/particleColors={['#8b5cf6', '#a78bfa', '#c4b5fd']}/g" "$FILE"
  
  # Reduce count
  sed -i '' 's/particleCount={200}/particleCount={150}/g' "$FILE"
  
  # Slow down speed
  sed -i '' 's/speed={0.1}/speed={0.05}/g' "$FILE"
  
  # INCREASE size to 250
  sed -i '' 's/particleBaseSize={100}/particleBaseSize={250}/g' "$FILE"
  
  # Add sizeRandomness=0 after particleBaseSize to make them all same size
  sed -i '' 's/particleBaseSize={250}/particleBaseSize={250}\n        sizeRandomness={0}/g' "$FILE"
  
  echo "  ✓ Updated to LARGE purple particles"
done

echo "All files updated to LARGE visible particles!"
