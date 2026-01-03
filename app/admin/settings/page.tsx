// app/admin/settings/page.tsx
import {
    getEmployeeMode,
    getAdminDefaultSeason,
    getSettingsLandmarks,
    getSettingsVillages,
    getSettingsDestinationCompanies, // Used for Partners & Seed Sources
    getSettingsSeedVarieties,
    getSettingsShipmentCompanies,
    getSettingsEmployees
} from './data';
import SettingsClientPage from './SettingsClientPage';

export default async function SettingsPage() {
    // Parallel data fetching for maximum performance
    const [
        employeeMode,
        adminSeason,
        landmarks,
        villages,
        destCompanies,
        seedVarieties,
        shipmentCompanies,
        employees
    ] = await Promise.all([
        getEmployeeMode(),
        getAdminDefaultSeason(),
        getSettingsLandmarks(),
        getSettingsVillages(),
        getSettingsDestinationCompanies(),
        getSettingsSeedVarieties(),
        getSettingsShipmentCompanies(),
        getSettingsEmployees()
    ]);

    return (
        <SettingsClientPage
            initialEmployeeMode={employeeMode}
            initialAdminSeason={adminSeason}
            landmarks={landmarks}
            villages={villages}
            destCompanies={destCompanies} // Passes to Client for both "Partners" list and "Seed Form" dropdown
            seedVarieties={seedVarieties}
            shipmentCompanies={shipmentCompanies}
            employees={employees}
        />
    );
}