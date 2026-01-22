-- Add profileId to team_profiles table
ALTER TABLE "team_profiles" ADD COLUMN "profile_id" text UNIQUE;

-- Add teamId to achievements table
ALTER TABLE "achievements" ADD COLUMN "team_id" varchar;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_team_profiles_profile_id" ON "team_profiles"("profile_id");
CREATE INDEX IF NOT EXISTS "idx_achievements_team_id" ON "achievements"("team_id");
