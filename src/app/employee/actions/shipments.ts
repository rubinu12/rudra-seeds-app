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
  // NEW: Added village_name to display in UI
  village_name?: string; 
  company_name: string;
};

export type FarmerStock = {
  crop_cycle_id: number;
  farmer_name: string;
  village_name: string;
  bags_remaining: number;
  seed_id: number;
  seed_variety: string;
  color_code: string;
  collection_loc: string;
  is_assigned: boolean;
};

// ==============================================================================
// 2. MASTER DATA FETCHERS
// ==============================================================================

// --- NEW: FETCH ALL VILLAGES (For Dropdowns) ---
export async function getAllVillages() {
  try {
    const res = await sql`
      SELECT village_name 
      FROM villages 
      WHERE is_active = TRUE 
      ORDER BY village_name ASC
    `;
    return res.rows.map((r) => r.village_name);
  } catch (e) {
    return [];
  }
}

// --- FETCH ALL MASTER DATA FOR MODAL ---
export async function getShipmentMasterData() {
  try {
    // Run all queries in parallel for performance
    const [seeds, transportCos, destCos, landmarks, villages] = await Promise.all([
      sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`,
      sql`SELECT company_id as id, company_name as name FROM shipment_companies WHERE is_active = TRUE ORDER BY company_name`,
      sql`SELECT dest_company_id as id, company_name as name FROM destination_companies WHERE is_active = TRUE ORDER BY company_name`,
      sql`SELECT landmark_id as id, landmark_name as name FROM landmarks WHERE is_active = TRUE ORDER BY landmark_name`,
      // Fetch Villages with ID and Name
      sql`SELECT village_id as id, village_name as name FROM villages WHERE is_active = TRUE ORDER BY village_name`
    ]);

    return {
      seeds: seeds.rows,
      transportCos: transportCos.rows,
      destCos: destCos.rows,
      landmarks: landmarks.rows,
      villages: villages.rows
    };
  } catch (e) {
    console.error("Master Data Fetch Error:", e);
    return { seeds: [], transportCos: [], destCos: [], landmarks: [], villages: [] };
  }
}

// ==============================================================================
// 3. SHIPMENT CREATION
// ==============================================================================

export async function createShipment(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) {
    return { success: false, message: "Unauthorized: Employee ID missing" };
  }

  // --- Extract Data ---
  const capacityTonnes = Number(formData.get("capacity"));
  const vehicleNo = formData.get("vehicleNo");
  const transportId = formData.get("transportId");
  const destId = formData.get("destId");
  const location = formData.get("location") as string;
  
  // Landmark (Optional)
  const landmarkIdRaw = formData.get("landmarkId");
  const landmarkId = landmarkIdRaw ? Number(landmarkIdRaw) : null;

  // Village (Conditional based on location)
  const villageIdRaw = formData.get("villageId");
  const villageId = villageIdRaw ? Number(villageIdRaw) : null;

  const driverName = formData.get("driverName");
  const driverMobile = formData.get("driverMobile");

  // --- Process Seeds ---
  let seedIds: number[] = [];
  const rawSeeds = formData.get("seedIds");
  try {
    if (typeof rawSeeds === "string" && rawSeeds.startsWith("[")) {
      seedIds = JSON.parse(rawSeeds);
    } else {
      seedIds = formData.getAll("seedIds").map((id) => Number(id));
    }
  } catch (e) {
    return { success: false, message: "Invalid seed selection" };
  }

  if (seedIds.length === 0) {
    return { success: false, message: "Select at least one seed variety" };
  }

  // Format array for SQL: e.g., "{101,102}"
  const seedArrayLiteral = `{${seedIds.join(",")}}`;
  const targetBags = Math.ceil(capacityTonnes * 20);

  // --- Insert into Database ---
  try {
    // Debug Log
    console.log(`🚚 Creating Shipment [${vehicleNo}] at ${location}. VillageID: ${villageId}`);

    await sql`
            INSERT INTO shipments (
                vehicle_number, capacity_in_tonnes, target_bag_capacity, allowed_seed_ids, 
                shipment_company_id, dest_company_id, location, landmark_id, village_id, -- Added Column
                driver_name, driver_mobile, status, total_bags, creation_date, 
                is_company_payment_received, created_by
            ) VALUES (
                ${vehicleNo as string}, ${capacityTonnes}, ${targetBags}, ${seedArrayLiteral}::int[], 
                ${Number(transportId)}, ${Number(destId)}, ${location}, 
                ${landmarkId}, ${villageId}, -- Added Value
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
// 4. SHIPMENT RETRIEVAL (READ)
// ==============================================================================

// --- GET ACTIVE SHIPMENTS (For Dashboard) ---
export async function getActiveShipments(): Promise<ActiveShipment[]> {
  try {
    const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                
                -- NEW: Fetch Village Name
                v.village_name,

                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            LEFT JOIN villages v ON s.village_id = v.village_id -- JOIN to get Name
            WHERE s.status = 'Loading'
            ORDER BY s.creation_date DESC
        `;
    return res.rows as ActiveShipment[];
  } catch (e) {
    console.error("Fetch Active Error:", e);
    return [];
  }
}

// --- GET SINGLE SHIPMENT (For Details Page) ---
export async function getShipmentById(id: number): Promise<ActiveShipment | null> {
  try {
    const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                
                -- NEW: Fetch Village Name
                v.village_name,

                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            LEFT JOIN villages v ON s.village_id = v.village_id -- JOIN to get Name
            WHERE s.shipment_id = ${id}
        `;
    return res.rows[0] as ActiveShipment;
  } catch (e) {
    return null;
  }
}

// --- GET MANIFEST (Loaded Items List) ---
export async function getShipmentManifest(shipmentId: number) {
  try {
    const res = await sql`
      SELECT 
        si.item_id,
        si.bags_loaded,
        si.added_at,
        f.name as farmer_name,
        COALESCE(v.village_name, 'Unknown') as village_name,
        s.variety_name,
        s.color_code,
        cc.crop_cycle_id
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
  } catch (e) {
    return [];
  }
}

// ==============================================================================
// 5. LOADING OPERATIONS (WRITE)
// ==============================================================================

// --- GET AVAILABLE FARMER STOCK ---
export async function getFarmersForLoading(): Promise<FarmerStock[]> {
  try {
    const res = await sql`
            SELECT 
                cc.crop_cycle_id, 
                f.name as farmer_name, 
                COALESCE(v.village_name, 'Unknown') as village_name,
                COALESCE(cc.bags_remaining_to_load, 0) as bags_remaining,
                cc.seed_id,
                s.variety_name as seed_variety,
                s.color_code,
                COALESCE(cc.goods_collection_method, 'Farm') as collection_loc, 
                true as is_assigned 
            FROM crop_cycles cc
            JOIN farmers f ON cc.farmer_id = f.farmer_id
            JOIN farms fm ON cc.farm_id = fm.farm_id
            LEFT JOIN villages v ON fm.village_id = v.village_id
            JOIN seeds s ON cc.seed_id = s.seed_id
            WHERE (cc.status = 'Weighed' OR cc.status = 'Loading') 
            AND COALESCE(cc.bags_remaining_to_load, 0) > 0
            ORDER BY cc.crop_cycle_id DESC
        `;
    return res.rows as FarmerStock[];
  } catch (e) {
    return [];
  }
}

// --- ADD BAGS TO SHIPMENT (Transaction) ---
export async function addBagsToShipment(
  shipmentId: number,
  cycleId: number,
  bagsToAdd: number
) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId) return { success: false, message: "Unauthorized" };

  try {
    // 1. Verify Stock
    const check =
      await sql`SELECT bags_remaining_to_load FROM crop_cycles WHERE crop_cycle_id = ${cycleId}`;
    if (bagsToAdd > (check.rows[0]?.bags_remaining_to_load || 0)) {
      return { success: false, message: "Not enough bags available" };
    }

    await sql`BEGIN`;

    // 2. Create Shipment Item Record
    await sql`
            INSERT INTO shipment_items (shipment_id, crop_cycle_id, bags_loaded, added_at, loaded_by) 
            VALUES (${shipmentId}, ${cycleId}, ${bagsToAdd}, NOW(), ${userId})
        `;

    // 3. Update Shipment Total
    await sql`UPDATE shipments SET total_bags = total_bags + ${bagsToAdd} WHERE shipment_id = ${shipmentId}`;

    // 4. Update Farmer Stock Status
    const newRem = check.rows[0].bags_remaining_to_load - bagsToAdd;
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
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false, message: "Transaction Failed" };
  }
}

// --- UNDO LAST LOAD (Revert Transaction) ---
export async function undoLastLoad(
  shipmentId: number,
  cycleId: number,
  bagsToRevert: number
) {
  try {
    await sql`BEGIN`;

    // 1. Find and Delete the specific item
    await sql`
            DELETE FROM shipment_items 
            WHERE item_id = (
                SELECT item_id FROM shipment_items 
                WHERE shipment_id = ${shipmentId} AND crop_cycle_id = ${cycleId} AND bags_loaded = ${bagsToRevert}
                ORDER BY added_at DESC 
                LIMIT 1
            )
        `;

    // 2. Revert Shipment Total
    await sql`UPDATE shipments SET total_bags = total_bags - ${bagsToRevert} WHERE shipment_id = ${shipmentId}`;

    // 3. Return Stock to Farmer
    await sql`
            UPDATE crop_cycles 
            SET bags_remaining_to_load = bags_remaining_to_load + ${bagsToRevert}, status = 'Weighed'
            WHERE crop_cycle_id = ${cycleId}
        `;

    await sql`COMMIT`;
    revalidatePath(`/employee/shipment/${shipmentId}`);
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false, message: "Undo failed" };
  }
}

// --- REMOVE SPECIFIC ITEM (By Item ID) ---
export async function removeShipmentItem(itemId: number, shipmentId: number, cycleId: number, bags: number) {
  try {
    await sql`BEGIN`;

    // 1. Delete the item
    await sql`DELETE FROM shipment_items WHERE item_id = ${itemId}`;

    // 2. Reduce Shipment Total
    await sql`UPDATE shipments SET total_bags = total_bags - ${bags} WHERE shipment_id = ${shipmentId}`;

    // 3. Return Stock to Farmer & Revert Status
    await sql`
      UPDATE crop_cycles 
      SET bags_remaining_to_load = bags_remaining_to_load + ${bags}, 
          status = 'Weighed' 
      WHERE crop_cycle_id = ${cycleId}
    `;

    await sql`COMMIT`;
    revalidatePath(`/employee/shipment/${shipmentId}`);
    return { success: true };
  } catch (e) {
    await sql`ROLLBACK`;
    return { success: false, message: "Failed to remove item" };
  }
}

// ==============================================================================
// 6. CONFIRMATION
// ==============================================================================

export async function markShipmentAsFilled(shipmentId: number) {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  if (!userId)
    return { success: false, message: "Unauthorized: Missing Employee ID" };

  try {
    const s =
      await sql`SELECT total_bags, target_bag_capacity FROM shipments WHERE shipment_id = ${shipmentId}`;
    const { total_bags, target_bag_capacity } = s.rows[0];

    const diff = total_bags - target_bag_capacity;

    // Validation (Can be adjusted)
    if (diff < -50) {
      return {
        success: false,
        message: `Cannot Confirm: Underfilled by ${Math.abs(diff)} bags.`,
      };
    }
    if (diff > 50) {
      return {
        success: false,
        message: `Cannot Confirm: Overfilled by ${diff} bags.`,
      };
    }

    await sql`
            UPDATE shipments 
            SET 
                status = 'Filled', 
                confirmation_date = NOW(),
                dispatch_by = ${userId} 
            WHERE shipment_id = ${shipmentId}
        `;

    revalidatePath("/employee/dashboard");
    return { success: true };
  } catch (e) {
    console.error(e);
    return { success: false, message: "Failed to confirm shipment." };
  }
}