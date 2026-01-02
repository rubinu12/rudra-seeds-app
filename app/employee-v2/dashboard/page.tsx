import { sql } from '@vercel/postgres';
import DashboardClient from './DashboardClient';

// Ensure this matches your user ID for now
const CURRENT_USER_ID = 10;

async function getUserDefaultLocation() {
  try {
    // Fetch directly from DB on the server
    const result = await sql`
      SELECT default_location FROM users WHERE user_id = ${CURRENT_USER_ID}
    `;
    return result.rows[0]?.default_location || 'Farm';
  } catch (error) {
    console.error('Failed to fetch default location:', error);
    return 'Farm';
  }
}

export default async function Page() {
  // This runs on the server, so it's fast and has direct DB access
  const initialLocation = await getUserDefaultLocation();

  return <DashboardClient initialLocation={initialLocation} />;
}