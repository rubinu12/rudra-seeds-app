"use server";

import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth'; // Ensure this path matches your auth configuration

// --- Types ---
export type ActiveShipment = {
    shipment_id: number;
    vehicle_number: string;
    status: string;
    total_bags: number;
    target_bag_capacity: number;
    allowed_seed_ids: number[];
    seed_varieties: string[]; 
    location: string;
    company_name: string;
};

export type FarmerStock = {
    crop_cycle_id: number;
    farmer_name: string;
    village_name: string;
    bags_remaining: number;
    seed_id: number;
    seed_variety: string;
    color_code: string; // New Field
    collection_loc: string;
    is_assigned: boolean;
};

// --- 1. FETCH MASTER DATA ---
export async function getShipmentMasterData() {
    try {
        const [seeds, transportCos, destCos, landmarks] = await Promise.all([
            sql`SELECT seed_id, variety_name FROM seeds WHERE is_active = TRUE ORDER BY variety_name`,
            sql`SELECT company_id as id, company_name as name FROM shipment_companies WHERE is_active = TRUE ORDER BY company_name`, 
            sql`SELECT dest_company_id as id, company_name as name FROM destination_companies WHERE is_active = TRUE ORDER BY company_name`,
            sql`SELECT landmark_id as id, landmark_name as name FROM landmarks WHERE is_active = TRUE ORDER BY landmark_name`
        ]);

        return { 
            seeds: seeds.rows, 
            transportCos: transportCos.rows, 
            destCos: destCos.rows,
            landmarks: landmarks.rows 
        };
    } catch (e) { 
        return { seeds: [], transportCos: [], destCos: [], landmarks: [] }; 
    }
}

// --- 2. CREATE SHIPMENT (Tracks Employee) ---
export async function createShipment(formData: FormData) {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) return { success: false, message: "Unauthorized: Employee ID missing" };

    const capacityTonnes = Number(formData.get('capacity'));
    const vehicleNo = formData.get('vehicleNo');
    const transportId = formData.get('transportId');
    const destId = formData.get('destId');
    const location = formData.get('location') as string;
    const landmarkId = formData.get('landmarkId'); 
    const driverName = formData.get('driverName');
    const driverMobile = formData.get('driverMobile');

    let seedIds: number[] = [];
    const rawSeeds = formData.get('seedIds');
    try {
        if (typeof rawSeeds === 'string' && rawSeeds.startsWith('[')) {
            seedIds = JSON.parse(rawSeeds);
        } else {
            seedIds = formData.getAll('seedIds').map(id => Number(id));
        }
    } catch (e) {
        return { success: false, message: "Invalid seed selection" };
    }

    if (seedIds.length === 0) return { success: false, message: "Select at least one seed variety" };

    const seedArrayLiteral = `{${seedIds.join(',')}}`;
    const targetBags = Math.ceil(capacityTonnes * 20);

    try {
        await sql`
            INSERT INTO shipments (
                vehicle_number, capacity_in_tonnes, target_bag_capacity, allowed_seed_ids, 
                shipment_company_id, dest_company_id, location, landmark_id,    
                driver_name, driver_mobile, status, total_bags, creation_date, 
                is_company_payment_received, created_by
            ) VALUES (
                ${vehicleNo as string}, ${capacityTonnes}, ${targetBags}, ${seedArrayLiteral}::int[], 
                ${Number(transportId)}, ${Number(destId)}, ${location}, ${landmarkId ? Number(landmarkId) : null}, 
                ${driverName as string}, ${driverMobile as string}, 'Loading', 0, NOW(), 
                FALSE, ${userId}
            )
        `;
        revalidatePath('/employee-v2/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Create Shipment Error:", error);
        return { success: false, message: "Database Error" };
    }
}

// --- 3. GET ACTIVE SHIPMENTS ---
export async function getActiveShipments(): Promise<ActiveShipment[]> {
    try {
        const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            WHERE s.status = 'Loading'
            ORDER BY s.creation_date DESC
        `;
        return res.rows as ActiveShipment[];
    } catch (e) { return []; }
}

// --- 4. GET SINGLE SHIPMENT ---
export async function getShipmentById(id: number): Promise<ActiveShipment | null> {
    try {
        const res = await sql`
            SELECT 
                s.shipment_id, s.vehicle_number, s.status, 
                s.total_bags, s.target_bag_capacity, s.allowed_seed_ids, s.location,
                COALESCE(sc.company_name, 'Unknown Transport') as company_name,
                ARRAY(SELECT variety_name FROM seeds WHERE seed_id = ANY(s.allowed_seed_ids)) as seed_varieties
            FROM shipments s
            LEFT JOIN shipment_companies sc ON s.shipment_company_id = sc.company_id
            WHERE s.shipment_id = ${id}
        `;
        return res.rows[0] as ActiveShipment;
    } catch (e) { return null; }
}

// --- 5. GET FARMERS READY TO LOAD (Fetches Color Code) ---
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
                s.color_code, -- New Field for UI Strip
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
    } catch (e) { return []; }
}

// --- 6. ADD BAGS (Tracks Employee) ---
export async function addBagsToShipment(shipmentId: number, cycleId: number, bagsToAdd: number) {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) return { success: false, message: "Unauthorized" };

    try {
        const check = await sql`SELECT bags_remaining_to_load FROM crop_cycles WHERE crop_cycle_id = ${cycleId}`;
        if (bagsToAdd > (check.rows[0]?.bags_remaining_to_load || 0)) {
            return { success: false, message: "Not enough bags available" };
        }

        await sql`BEGIN`;
        
        await sql`
            INSERT INTO shipment_items (shipment_id, crop_cycle_id, bags_loaded, added_at, loaded_by) 
            VALUES (${shipmentId}, ${cycleId}, ${bagsToAdd}, NOW(), ${userId})
        `;
        
        await sql`UPDATE shipments SET total_bags = total_bags + ${bagsToAdd} WHERE shipment_id = ${shipmentId}`;
        
        const newRem = check.rows[0].bags_remaining_to_load - bagsToAdd;
        const newStatus = newRem === 0 ? 'Loaded' : 'Loading';
        
        await sql`
            UPDATE crop_cycles 
            SET bags_remaining_to_load = ${newRem}, status = ${newStatus},
                loading_date = CASE WHEN ${newStatus} = 'Loaded' THEN NOW() ELSE loading_date END
            WHERE crop_cycle_id = ${cycleId}
        `;
        
        await sql`COMMIT`;
        revalidatePath(`/employee-v2/shipment/${shipmentId}`);
        return { success: true };
    } catch (e) {
        await sql`ROLLBACK`;
        return { success: false, message: "Transaction Failed" };
    }
}

// --- 7. UNDO LAST LOAD ---
export async function undoLastLoad(shipmentId: number, cycleId: number, bagsToRevert: number) {
    try {
        await sql`BEGIN`;

        await sql`
            DELETE FROM shipment_items 
            WHERE item_id = (
                SELECT item_id FROM shipment_items 
                WHERE shipment_id = ${shipmentId} AND crop_cycle_id = ${cycleId} AND bags_loaded = ${bagsToRevert}
                ORDER BY added_at DESC 
                LIMIT 1
            )
        `;

        await sql`UPDATE shipments SET total_bags = total_bags - ${bagsToRevert} WHERE shipment_id = ${shipmentId}`;

        await sql`
            UPDATE crop_cycles 
            SET bags_remaining_to_load = bags_remaining_to_load + ${bagsToRevert}, status = 'Weighed'
            WHERE crop_cycle_id = ${cycleId}
        `;

        await sql`COMMIT`;
        revalidatePath(`/employee-v2/shipment/${shipmentId}`);
        return { success: true };
    } catch (e) {
        await sql`ROLLBACK`;
        return { success: false, message: "Undo failed" };
    }
}

// --- 8. MARK FILLED ---
// --- 8. CONFIRM SHIPMENT (Updated) ---
export async function markShipmentAsFilled(shipmentId: number) {
    const session = await auth();
    const userId = session?.user?.id ? Number(session.user.id) : null;

    if (!userId) return { success: false, message: "Unauthorized: Missing Employee ID" };

    try {
        // 1. Fetch current stats
        const s = await sql`SELECT total_bags, target_bag_capacity FROM shipments WHERE shipment_id = ${shipmentId}`;
        const { total_bags, target_bag_capacity } = s.rows[0];
        
        // 2. Calculate Difference
        const diff = total_bags - target_bag_capacity;
        
        // 3. Strict Server-Side Validation (+/- 50 Bags)
        if (diff < -50) {
            return { success: false, message: `Cannot Confirm: Underfilled by ${Math.abs(diff)} bags.` };
        }
        if (diff > 50) {
            return { success: false, message: `Cannot Confirm: Overfilled by ${diff} bags.` };
        }

        // 4. Update Status & Log Employee
        await sql`
            UPDATE shipments 
            SET 
                status = 'Filled', 
                confirmation_date = NOW(),
                dispatch_by = ${userId} 
            WHERE shipment_id = ${shipmentId}
        `;
        
        revalidatePath('/employee-v2/dashboard');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, message: "Failed to confirm shipment." };
    }
}

