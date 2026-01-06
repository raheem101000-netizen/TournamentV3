#!/bin/bash
# Batch script to add Particles to remaining pages

PAGES=(
  "account-settings.tsx"
  "create-server.tsx"
  "create-tournament.tsx"
  "preview-create-team.tsx"
  "preview-organizer-award.tsx"
  "preview-poster-builder.tsx"
  "preview-templates.tsx"
  "preview-admin-templates.tsx"
  "server-settings.tsx"
  "tournament-register.tsx"
  "tournament-match.tsx"
  "server-preview.tsx"
)

for PAGE in "${PAGES[@]}"; do
  FILE="client/src/pages/$PAGE"
  echo "Processing $PAGE..."
  
  # Check if file exists and has BottomNavigation
  if [ -f "$FILE" ] && grep -q "BottomNavigation" "$FILE"; then
    echo "  - Has BottomNavigation, needs Particles"
  else
    echo "  - No BottomNavigation or file not found"
  fi
done
