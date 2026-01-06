#!/bin/bash
# Make particles MASSIVE (500 size)

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
  echo "Making particles MASSIVE in $FILE..."
  
  # Change size to 500
  sed -i '' 's/particleBaseSize={250}/particleBaseSize={500}/g' "$FILE"
  
  # Reduce count to 100
  sed -i '' 's/particleCount={150}/particleCount={100}/g' "$FILE"
  
  # Reduce spread
  sed -i '' 's/particleSpread={10}/particleSpread={8}/g' "$FILE"
  
  # Slow down
  sed -i '' 's/speed={0.05}/speed={0.03}/g' "$FILE"
  
  echo "  ✓ MASSIVE particles (500 size)"
done

echo "All files updated to MASSIVE particles!"
