import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { base44 } from "@/api/base44Client";
import { FarmProvider } from "@/lib/farmContext";

export default function FarmerLayout() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  return (
    <FarmProvider>
      <div className="flex min-h-screen bg-[#F7F9F7]">
        <div className="hidden lg:block">
          <Sidebar user={user} />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <Header user={user} />
          <main className="flex-1 px-6 lg:px-8 py-6 w-full">
            <Outlet context={{ user }} />
          </main>
        </div>
      </div>
    </FarmProvider>
  );
}