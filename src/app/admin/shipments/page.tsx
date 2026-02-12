// 1. Force Dynamic (Fixes the build error)
export const dynamic = "force-dynamic";

import ShipmentClient from "./ShipmentClient";

export default function ShipmentPage() {
  // 2. Render the Client Component
  return <ShipmentClient />;
}