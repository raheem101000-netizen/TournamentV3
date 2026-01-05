/**
 * Admin Account Setup Guide
 * 
 * Since there's no default admin account, follow these steps:
 */

// OPTION 1: Register and promote via database
// ============================================
// 1. Go to your site and register a new account (e.g., admin@example.com)
// 2. Connect to your Neon database and run:
/*
UPDATE users 
SET is_admin = 1 
WHERE email = 'admin@example.com';
*/

// OPTION 2: Use the admin promotion endpoint
// ==========================================
// There's an endpoint at /api/admin/users/:userId/make-admin
// But it requires an existing admin, so use Option 1 first

// OPTION 3: Create admin via SQL directly
// ========================================
/*
INSERT INTO users (
  id, 
  username, 
  email, 
  password, 
  display_name, 
  is_admin,
  created_at
) VALUES (
  'admin-' || gen_random_uuid()::text,
  'admin',
  'admin@tournament.com',
  '$2b$10$YourHashedPasswordHere',  -- You'll need to hash this
  'Admin User',
  1,
  NOW()
);
*/

// To hash a password in Node.js:
import bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const hash = await bcrypt.hash(password, 10);
  console.log('Hashed password:', hash);
  return hash;
}

// Example usage:
// hashPassword('admin123').then(console.log);

export const RECOMMENDED_APPROACH = `
1. Register normally through the UI with credentials you'll remember
2. Get your user ID from the response or database
3. Run this SQL in your Neon database console:
   
   UPDATE users SET is_admin = 1 WHERE email = 'your-email@example.com';
   
4. Log out and log back in
5. You should now have admin access
`;

// Quick test to check if you're admin:
// GET /api/admin/check
// Response: { isAdmin: true } if you're an admin
