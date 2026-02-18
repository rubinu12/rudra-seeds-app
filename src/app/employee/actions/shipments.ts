"use server";

import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

// ==============================================================================
// 1. TYPE DEFINITIONS
// ==============================================================================

export type ActiveShipment = {
  shipment_id: number;
  vehicle_number: string;
  status: string;
  total_bags: number;
  target_bag_capacity: number;
  allowed_seed_ids: number[];
  seed_varieties: string[];
  location: string;
  village_name?: string; 
  company_name: string;
};

export type FarmerStock = {
  crop_cycle_id: number;
  farmer_name: string;
  village_name: string;
  
  // [FIX] Calculated field to handle cases where 'bags_remaining' wasn't init
  bags_remaining: number; 
  
  seed_id: number;
  seed_variety: string;
  color_code: string;
  
  // [FIX] Fields for UI Filters
  collection_loc: string;
  is_assigned: boolean;
  lot_no: string; 
};

// ==============================================================================
// 2. MASTER DATA FETCHERS (Unchanged)
// ==============================================================================

export async function getAllVillages() {
  try {
    const res = await sql`SELECT village_name FROM villages WHERE is_active = TRUE ORDER BY village_name ASC`;
    return res.rows.map((r) => r.village_name);
  } catch (_e) { return []; }
}

export async function getShipmentMasterData() {
  try {
    const [seeds, transportCos, destCos, landmarks, villages] = await Promise.all([
      sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`,
      sql`SELECT company_id as id, company_name as name FROM shipment_companies WHERE is_active = TRUE ORDER BY company_name`,
      sql`SELECT dest_company_id as id, company_name as name FROM destination_companies WHERE is_active = TRUE ORDER BY company_name`,
      sql`SELECT landmark_id as id, landmark_name as name FROM landmarks WHERE is_active = TRUE ORDER BY landmark_name`,
      sql`SELECT village_id as id, village_name as name FROM villages WHERE is_active = TRUE ORDER BY village_name`
    ]);

    return {
      seeds: seeds.rows,
      transportCos: transportCos.rows,
      destCos: destCos.rows,
      landmarks: landmarks.rows,
      villages: villages.rows
    };
  } catch (error) {
    console.error("Master Data Fetch Error:", error);
    return { seeds: [], transportCos: [], destCos: [], landmarks: [], villages: [] };
  }
}

// ==============================================================================
// 3. SHIPMENT CREATION (Unchanged Logic)
// ==============================================================================

export async function createShipment(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) return { success: false, message: "Unauthorized: Employee ID missing" };

  const capacityTonnes = Number(formData.get("capacity"));
  const vehicleNo = formData.get("vehicleNo");
  const transportId = formData.get("transportId");
  const destId = formData.get("destId");
  const location = formData.get("location") as string;
  const landmarkId = formData.get("landmarkId") ? Number(formData.get("landmarkId")) : null;
  const villageId = formData.get("villageId") ? Number(formData.get("villageId")) : null;
  const driverName = formData.get("driverName");
  const driverMobile = formData.get("driverMobile");

  let seedIds: number[] = [];
  const rawSeeds = formData.get("seedIds");
  try {
    if (typeof rawSeeds === "string" && rawSeeds.startsWith("[")) {
      seedIds = JSON.parse(rawSeeds);
    } else {
      seedIds = formData.getAll("seedIds").map((id) => Number(id));
    }
  } catch (_e) { return { success: false, message: "Invalid seed selection" }; }

  if (seedIds.length === 0) return { success: false, message: "Select at least one seed variety" };

  const seedArrayLiteral = `{${seedIds.join(",")}}`;
  const targetBags = Math.ceil(capacityTonnes * 20);

  try {
    await sql`
            INSERT INTO shipments (
                vehicle_number, capacity_in_tonnes, target_bag_capacity, allowed_seed_ids, 
                shipment_company_id, dest_company_id, location, landmark_id, village_id, 
                driver_name, driver_mobile, status, total_bags, creation_date, 
                is_company_payment_received, created_by
            ) VALUES (
                ${vehicleNo as string}, ${capacityTonnes}, ${targetBags}, ${seedArrayLiteral}::int[], 
                ${Number(transportId)}, ${Number(destId)}, ${location}, 
                ${landmarkId}, ${villageId}, 
                ${driverName as string}, ${driverMobile as string}, 'Loading', 0, NOW(), 
                FALSE, ${userId}
            )
        `;
    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Create Shipment Error:", error);
    return { success: false, message: "Database Error" };
  }
}

// ==============================================================================
// 4. SHIPMENT RETRIEVAL (READ) - FIXED
// ==============================================================================

export async function getActiveShipments(): Promise<ActiveShipment[]> {
  try {
    const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                v.village_name,
                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            LEFT JOIN villages v ON s.village_id = v.village_id
            
            -- [FIX] Soft Filter: Show everything active (Loading, Filled, etc.)
            -- Hides only completed/billed history
            WHERE s.status NOT IN ('Dispatched', 'Bill Generated')
            
            ORDER BY s.creation_date DESC
        `;
    return res.rows as ActiveShipment[];
  } catch (e) {
    console.error("Fetch Active Error:", e);
    return [];
  }
}

export async function getShipmentById(id: number): Promise<ActiveShipment | null> {
  try {
    const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                v.village_name,
                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            LEFT JOIN villages v ON s.village_id = v.village_id
            WHERE s.shipment_id = ${id}
        `;
    return res.rows[0] as ActiveShipment;
  } catch (_e) { return null; }
}

// ==============================================================================
// 5. LOADING OPERATIONS (WRITE) - FIXED
// ==============================================================================

export async function getFarmersForLoading(): Promise<FarmerStock[]> {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : 0;

  try {
    const res = await sql`
            SELECT 
                cc.crop_cycle_id, 
                f.name as farmer_name, 
                COALESCE(v.village_name, 'Unknown') as village_name,
                
                -- [FIX] Fallback Logic: If bags_remaining is 0/NULL (initial state), use total quantity
                COALESCE(NULLIF(cc.bags_remaining_to_load, 0), cc.quantity_in_bags, 0) as bags_remaining,
                
                cc.seed_id,
                s.variety_name as seed_variety,
                s.color_code,
                
                -- [FIX] Fields required for UI Filtering
                COALESCE(cc.goods_collection_method, 'Farm') as collection_loc, 
                
                -- [FIX] Dynamic Assignment Check
                CASE 
                    WHEN EXISTS (
                        SELECT 1 FROM employee_assignments ea 
                        WHERE ea.user_id = ${userId} AND ea.seed_id = cc.seed_id
                    ) THEN true 
                    ELSE false 
                END as is_assigned,

                -- [FIX] Fetch Multi-Lots
                (
                    SELECT STRING_AGG(lot_number, ', ') 
                    FROM cycle_lots 
                    WHERE crop_cycle_id = cc.crop_cycle_id
                ) as lot_no

            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            
            -- [FIX] Broader Status Check
            WHERE cc.status IN ('Weighed', 'Loading', 'Partially Loaded')
            ORDER BY cc.crop_cycle_id DESC
        `;
        
    // Filter out rows where calculated bags_remaining is 0 (Completed)
    return (res.rows as FarmerStock[]).filter(r => Number(r.bags_remaining) > 0);
  } catch (e) {
    console.error("Fetch Farmers Error", e);
    return [];
  }
}

export async function addBagsToShipment(shipmentId: number, cycleId: number, bagsToAdd: number) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const [shipmentRes, check] = await Promise.all([
      sql`SELECT total_bags, target_bag_capacity FROM shipments WHERE shipment_id = ${shipmentId}`,
      sql`SELECT bags_remaining_to_load, quantity_in_bags FROM crop_cycles WHERE crop_cycle_id = ${cycleId}`
    ]);

    if (shipmentRes.rowCount === 0) return { success: false, message: "Shipment not found" };
    
    // --- Capacity Validation ---
    const { total_bags, target_bag_capacity } = shipmentRes.rows[0];
    const MARGIN = 50; 
    if ((total_bags + bagsToAdd) > (target_bag_capacity + MARGIN)) {
      return { success: false, message: `Capacity Exceeded! Max allowed is ${target_bag_capacity + MARGIN}.` };
    }

    // --- Stock Validation ---
    const cycleRow = check.rows[0];
    // Use same fallback logic as fetcher
    const currentStock = cycleRow.bags_remaining_to_load > 0 ? cycleRow.bags_remaining_to_load : cycleRow.quantity_in_bags;

    if (bagsToAdd > currentStock) {
      return { success: false, message: `Not enough bags. Available: ${currentStock}` };
    }

    await sql`BEGIN`;

    await sql`INSERT INTO shipment_items (shipment_id, crop_cycle_id, bags_loaded, added_at, loaded_by) VALUES (${shipmentId}, ${cycleId}, ${bagsToAdd}, NOW(), ${userId})`;
    await sql`UPDATE shipments SET total_bags = total_bags + ${bagsToAdd} WHERE shipment_id = ${shipmentId}`;

    const newRem = currentStock - bagsToAdd;
    const newStatus = newRem === 0 ? "Loaded" : "Loading";

    await sql`
            UPDATE crop_cycles 
            SET bags_remaining_to_load = ${newRem}, status = ${newStatus},
                loading_date = CASE WHEN ${newStatus} = 'Loaded' THEN NOW() ELSE loading_date END
            WHERE crop_cycle_id = ${cycleId}
        `;

    await sql`COMMIT`;
    revalidatePath(`/employee/shipment/${shipmentId}`);
    return { success: true };
  } catch (_e) {
    await sql`ROLLBACK`;
    return { success: false, message: "Transaction Failed" };
  }
}

// ... [Keep undoLastLoad, removeShipmentItem, markShipmentAsFilled, getShipmentManifest as previously defined] ...
export async function undoLastLoad(shipmentId: number, cycleId: number, bagsToRevert: number) {
  try {
    await sql`BEGIN`;
    await sql`DELETE FROM shipment_items WHERE item_id = (SELECT item_id FROM shipment_items WHERE shipment_id = ${shipmentId} AND crop_cycle_id = ${cycleId} AND bags_loaded = ${bagsToRevert} ORDER BY added_at DESC LIMIT 1)`;
    await sql`UPDATE shipments SET total_bags = total_bags - ${bagsToRevert} WHERE shipment_id = ${shipmentId}`;
    // Fix: We assume if undoing, we add back to stock.
    // If bags_remaining was 0, it becomes bagsToRevert.
    await sql`UPDATE crop_cycles SET bags_remaining_to_load = COALESCE(bags_remaining_to_load, 0) + ${bagsToRevert}, status = 'Weighed' WHERE crop_cycle_id = ${cycleId}`;
    await sql`COMMIT`;
    revalidatePath(`/employee/shipment/${shipmentId}`);
    return { success: true };
  } catch (_e) { await sql`ROLLBACK`; return { success: false, message: "Undo failed" }; }
}

export async function removeShipmentItem(itemId: number, shipmentId: number, cycleId: number, bags: number) {
  try {
    await sql`BEGIN`;
    await sql`DELETE FROM shipment_items WHERE item_id = ${itemId}`;
    await sql`UPDATE shipments SET total_bags = total_bags - ${bags} WHERE shipment_id = ${shipmentId}`;
    await sql`UPDATE crop_cycles SET bags_remaining_to_load = COALESCE(bags_remaining_to_load, 0) + ${bags}, status = 'Weighed' WHERE crop_cycle_id = ${cycleId}`;
    await sql`COMMIT`;
    revalidatePath(`/employee/shipment/${shipmentId}`);
    return { success: true };
  } catch (_e) { await sql`ROLLBACK`; return { success: false, message: "Failed to remove item" }; }
}

export async function markShipmentAsFilled(shipmentId: number) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;
  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    const s = await sql`SELECT total_bags, target_bag_capacity FROM shipments WHERE shipment_id = ${shipmentId}`;
    const { total_bags, target_bag_capacity } = s.rows[0];
    const diff = total_bags - target_bag_capacity;

    if (diff < -50) return { success: false, message: `Underfilled by ${Math.abs(diff)} bags.` };
    if (diff > 50) return { success: false, message: `Overfilled by ${diff} bags.` };

    await sql`UPDATE shipments SET status = 'Filled', confirmation_date = NOW(), dispatch_by = ${userId} WHERE shipment_id = ${shipmentId}`;
    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (e) { return { success: false, message: "Failed to confirm." }; }
}

export async function getShipmentManifest(shipmentId: number) {
  try {
    const res = await sql`
      SELECT 
        si.item_id, si.bags_loaded, si.added_at,
        f.name as farmer_name, COALESCE(v.village_name, 'Unknown') as village_name,
        s.variety_name, s.color_code, cc.crop_cycle_id
      FROM shipment_items si
      JOIN crop_cycles cc ON si.crop_cycle_id = cc.crop_cycle_id
      JOIN farmers f ON cc.farmer_id = f.farmer_id
      JOIN farms fm ON cc.farm_id = fm.farm_id
      LEFT JOIN villages v ON fm.village_id = v.village_id
      JOIN seeds s ON cc.seed_id = s.seed_id
      WHERE si.shipment_id = ${shipmentId}
      ORDER BY si.added_at DESC
    `;
    return res.rows;
  } catch (_e) { return []; }
}