// app/admin/settings/page.tsx
import {
    getEmployeeMode,
    getSettingsLandmarks,
    getSettingsVillages,
    getSettingsDestinationCompanies,
    getSettingsSeedVarieties,
    getSettingsShipmentCompanies
} from './data';
import { SettingsClientPage } from './SettingsClientPage';
import { Cog } from 'lucide-react';

export default async function SettingsPage() {
    // Fetch all necessary data in parallel on the server
    const [
        currentMode,
        landmarks,
        villages,
        destCompanies,
        seedVarieties,
        shipmentCompanies,
    ] = await Promise.all([
        getEmployeeMode(),
        getSettingsLandmarks(),
        getSettingsVillages(),
        getSettingsDestinationCompanies(),
        getSettingsSeedVarieties(),
        getSettingsShipmentCompanies(),
    ]);

    return (
        <>
            <header className="flex items-center gap-4 mb-8">
                <Cog className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-normal text-on-surface">
                        Admin Control Panel
                    </h1>
                    <p className="text-on-surface-variant mt-1">
                        Manage master data and control application settings.
                    </p>
                </div>
            </header>

            <SettingsClientPage
                initialMode={currentMode}
                landmarks={landmarks}
                villages={villages}
                destCompanies={destCompanies}
                seedVarieties={seedVarieties}
                shipmentCompanies={shipmentCompanies}
            />
        </>
    );
}