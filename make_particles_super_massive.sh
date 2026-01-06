#!/bin/bash
# Script to max out particle size to 2000

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
  echo "Updating $FILE to SUPER MASSIVE particles (2000)..."
  
  # Change size to 2000
  sed -i '' 's/particleBaseSize={500}/particleBaseSize={2000}/g' "$FILE"
  
  # Restore randomness for 3D effect
  sed -i '' 's/sizeRandomness={0}/sizeRandomness={0.5}/g' "$FILE"
  
  # Ensure count is reasonable
  sed -i '' 's/particleCount={100}/particleCount={80}/g' "$FILE"
  
  # Speed up slightly for visibility
  sed -i '' 's/speed={0.03}/speed={0.1}/g' "$FILE"
  
  # Relax spread
  sed -i '' 's/particleSpread={8}/particleSpread={10}/g' "$FILE"
  
  echo "  ✓ SUPER MASSIVE particles (2000 size)"
done

echo "All files updated to SUPER MASSIVE particles!"
