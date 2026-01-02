// app/admin/settings/page.tsx
import {
    getEmployeeMode,
    getAdminDefaultSeason,
    getSettingsLandmarks,
    getSettingsVillages,
    getSettingsDestinationCompanies,
    getSettingsSeedVarieties,
    getSettingsShipmentCompanies,
    getSettingsEmployees // <--- IMPORT THIS
} from './data';
import { SettingsClientPage } from './SettingsClientPage';

export default async function SettingsPage() {
    const [
        employeeMode,
        adminSeason,
        landmarks,
        villages,
        destCompanies,
        seedVarieties,
        shipmentCompanies,
        employees // <--- NEW DATA
    ] = await Promise.all([
        getEmployeeMode(),
        getAdminDefaultSeason(),
        getSettingsLandmarks(),
        getSettingsVillages(),
        getSettingsDestinationCompanies(),
        getSettingsSeedVarieties(),
        getSettingsShipmentCompanies(),
        getSettingsEmployees() // <--- FETCH CALL
    ]);

    return (
        <SettingsClientPage
            initialEmployeeMode={employeeMode}
            initialAdminSeason={adminSeason}
            landmarks={landmarks}
            villages={villages}
            destCompanies={destCompanies}
            seedVarieties={seedVarieties}
            shipmentCompanies={shipmentCompanies}
            employees={employees} // <--- PASS PROP
        />
    );
}