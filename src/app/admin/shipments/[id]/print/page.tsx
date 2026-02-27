// src/app/admin/shipments/[id]/print/page.tsx
import { notFound } from "next/navigation";
import { getShipmentBillData } from "@/src/app/admin/actions/adminShipment";
import PrintDocumentClient from "./PrintDocumentClient";

// 1. Update the types to reflect that params is a Promise
export default async function PrintShipmentPage({ 
    params 
}: { 
    params: Promise<{ id: string }> 
}) {
  // 2. Await the params before using them
  const resolvedParams = await params;
  const shipmentId = parseInt(resolvedParams.id);
  
  if (isNaN(shipmentId)) return notFound();

  const data = await getShipmentBillData(shipmentId);
  
  // If no shipment data is found in the database, return 404
  if (!data || !data.shipment) return notFound();

  return <PrintDocumentClient shipment={data.shipment} items={data.items} />;
}