// app/admin/dashboard/page.tsx
import { getAdminDefaultSeason } from '@/app/admin/settings/data'; // <--- Change import
import DashboardClientView from './DashboardClientView';

export default async function AdminDashboardPage() {
    // Fetch the ADMIN'S preferred view
    const initialSeason = await getAdminDefaultSeason();

    return <DashboardClientView initialSeason={initialSeason} />;
}