#!/bin/bash
# Script to force particles to z-50 (overlay) for visibility
# Also ensures cameraDistance=10 is set everywhere.

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
  echo "Updating $FILE to z-50 overlay..."
  
  # Replace z-0 with z-50 in className
  sed -i '' 's/z-0/z-50/g' "$FILE"
  
  # Ensure cameraDistance=10 (redundant check but safe)
  if ! grep -q "cameraDistance={10}" "$FILE"; then
     sed -i '' 's/cameraDistance={[0-9]*}/cameraDistance={10}/g' "$FILE"
  fi

  echo "  ✓ Updated to z-50"
done

echo "All files updated to overlay mode!"
