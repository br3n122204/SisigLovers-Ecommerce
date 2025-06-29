import React from "react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#101828] text-[#60A5FA] flex items-center justify-center">
      <div className="w-full max-w-2xl bg-[#19223a] rounded-2xl shadow-lg p-10">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-[#60A5FA]">Settings</h1>
        <div className="space-y-8">
          {/* Account Settings */}
          <section>
            <h2 className="text-xl font-bold mb-2 text-[#60A5FA]">Account</h2>
            <p className="mb-2">Update your account information, change your email, or reset your password.</p>
            <button className="mt-2 px-5 py-2 rounded-lg border border-[#60A5FA] text-[#60A5FA] font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">Edit Account</button>
          </section>
          {/* Notification Settings */}
          <section>
            <h2 className="text-xl font-bold mb-2 text-[#60A5FA]">Notifications</h2>
            <p className="mb-2">Manage your email and push notification preferences.</p>
            <button className="mt-2 px-5 py-2 rounded-lg border border-[#60A5FA] text-[#60A5FA] font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">Notification Preferences</button>
          </section>
          {/* Privacy Settings */}
          <section>
            <h2 className="text-xl font-bold mb-2 text-[#60A5FA]">Privacy</h2>
            <p className="mb-2">Control your privacy settings and data sharing preferences.</p>
            <button className="mt-2 px-5 py-2 rounded-lg border border-[#60A5FA] text-[#60A5FA] font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">Privacy Options</button>
          </section>
          {/* Appearance Settings */}
          <section>
            <h2 className="text-xl font-bold mb-2 text-[#60A5FA]">Appearance</h2>
            <p className="mb-2">Switch between light and dark mode, and customize your theme.</p>
            <button className="mt-2 px-5 py-2 rounded-lg border border-[#60A5FA] text-[#60A5FA] font-semibold hover:bg-[#60A5FA] hover:text-[#101828] transition-colors">Customize Appearance</button>
          </section>
        </div>
      </div>
    </div>
  );
} 