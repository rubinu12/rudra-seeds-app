import DashboardController from "@/app/admin-v2/dashboard/DashboardController";

export const metadata = {
  title: "Admin Dashboard | RudraSeeds",
  description: "Operational overview for sowing, growing, and harvesting.",
};

export default function AdminDashboardPage() {
  return (
    // Pass any server-side initial data here if needed in the future
    <DashboardController />
  );
}