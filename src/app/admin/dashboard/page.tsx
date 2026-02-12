export const dynamic = 'force-dynamic';
import DashboardController from "./DashboardController";

export const metadata = {
  title: "Admin Dashboard | RudraSeeds",
  description: "Operational overview for sowing, growing, and harvesting.",
};

export default function AdminDashboardPage() {
  return (
    <div className="animate-in fade-in duration-700">
      <DashboardController />
    </div>
  );
}