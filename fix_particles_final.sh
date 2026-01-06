#!/bin/bash
# Script to standardize particles based on working Login config
# Key factor: cameraDistance={10} !

FILES=(
  "client/src/components/layouts/MobileLayout.tsx"
  "client/src/pages/preview-account.tsx"
  "client/src/pages/preview-server-detail.tsx"
  "client/src/pages/preview-messages.tsx"
  "client/src/pages/preview-create-team.tsx"
  "client/src/pages/preview-organizer-award.tsx"
  "client/src/pages/preview-poster-builder.tsx"
  "client/src/pages/preview-templates.tsx"
)

for FILE in "${FILES[@]}"; do
  echo "Updating $FILE to match Login profile (dist=10)..."
  
  # Set cameraDistance (add if missing, replace if exists)
  if grep -q "cameraDistance" "$FILE"; then
    sed -i '' 's/cameraDistance={[0-9]*}/cameraDistance={10}/g' "$FILE"
  else
    # Add cameraDistance after particleBaseSize
    sed -i '' 's/particleBaseSize={[0-9]*}/particleBaseSize={200}\n                    cameraDistance={10}/g' "$FILE"
  fi
  
  # Reset size to 200 (Login uses 100, but let's be safe with 200)
  sed -i '' 's/particleBaseSize={[0-9]*}/particleBaseSize={200}/g' "$FILE"
  
  # Increase count to 150
  sed -i '' 's/particleCount={[0-9]*}/particleCount={150}/g' "$FILE"
  
  # Increase spread to 15
  sed -i '' 's/particleSpread={[0-9]*}/particleSpread={15}/g' "$FILE"
  
  # Set speed to 0.05
  sed -i '' 's/speed={[0-9.]*}/speed={0.05}/g' "$FILE"
  
  # Ensure randomness is 0.5
  sed -i '' 's/sizeRandomness={[0-9.]*}/sizeRandomness={0.5}/g' "$FILE"
  
  echo "  ✓ Updated to dist=10, size=200"
done

echo "All files standardized to working profile!"
