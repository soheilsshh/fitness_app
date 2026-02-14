"use client";

import { useState } from "react";
import Swal from "sweetalert2";
import { defaultSiteSettings } from "./siteMock";
import ImageUploader from "./ImageUploader";
import FeatureBulletsEditor from "./FeatureBulletsEditor";
import StatsEditor from "./StatsEditor";
import StepsEditor from "./StepsEditor";
import SaveBar from "./SaveBar";
import ContactInfoEditor from "./ContactInfoEditor";


export default function SiteSettingsClient() {
    const [settings, setSettings] = useState(defaultSiteSettings);
    const [saving, setSaving] = useState(false);

    const onSave = async () => {

        try {
            setSaving(true);
            await Swal.fire({
                icon: "success",
                title: "آماده اتصال به API",
                text: "فعلاً فقط UI است. بعداً همینجا به API وصل می‌شود.",
                confirmButtonText: "باشه",
                background: "#0a0a0a",
                color: "#fff",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Top header */}
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                    <div className="text-lg font-extrabold text-white">سایت</div>
                    <div className="mt-1 text-sm text-zinc-300">
                        تنظیمات بخش‌های صفحه اصلی را مدیریت کنید
                    </div>
                </div>

                <SaveBar saving={saving} onSave={onSave} />
            </div>

            {/* 1) Image upload */}
            <ImageUploader
                value={settings.heroImage}
                onChange={(heroImage) => setSettings((p) => ({ ...p, heroImage }))}
            />

            {/* 2) Feature bullets */}
            <FeatureBulletsEditor
                value={settings.featureBullets}
                onChange={(featureBullets) => setSettings((p) => ({ ...p, featureBullets }))}
            />

            {/* 3) Stats */}
            <StatsEditor
                value={settings.stats}
                onChange={(stats) => setSettings((p) => ({ ...p, stats }))}
            />

            {/* 4) Steps cards */}
            <StepsEditor
                value={settings.steps}
                onChange={(steps) => setSettings((p) => ({ ...p, steps }))}
            />
            
            <ContactInfoEditor
                value={settings.contactInfo}
                onChange={(contactInfo) => setSettings((p) => ({ ...p, contactInfo }))}
            />


        </div>
    );
}
