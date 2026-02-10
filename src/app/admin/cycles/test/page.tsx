// app/admin/cycles/test/page.tsx
import { getLandmarks, getSeedVarieties } from '@/src/lib/data';
import { TestForm } from './TestForm'; // We will create this client component next

// This is a SERVER component. It runs on the server.
export default async function TestPage() {
  console.log(`[SERVER LOG] Test Page rendering on the server. Fetching data...`);
  
  // Fetch data ONCE on the server. This is efficient.
  const landmarks = await getLandmarks();
  const seedVarieties = await getSeedVarieties();
  
  console.log(`[SERVER LOG] Data fetched successfully. Passing ${landmarks.length} landmarks and ${seedVarieties.length} varieties to the client form.`);

  // Pass the server-fetched data as props to the client component.
  return <TestForm landmarks={landmarks} seedVarieties={seedVarieties} />;
}