import { getSettings } from "@/lib/actions/admin";
import { SettingsForm } from "./form";

export default async function AdminSettingsPage() {
    const settings = await getSettings();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">
                    Platform Settings
                </h1>
                <p className="text-muted-foreground">
                    Configure global SalaryHub platform settings.
                </p>
            </div>

            <SettingsForm settings={settings} />
        </div>
    );
}
