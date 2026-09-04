import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { FarmProvider, useFarm } from "@/lib/farmContext";

function FarmerLayoutContent() {
  const { user, setUser, refresh } = useFarm();

  return (
    <div className="flex min-h-screen bg-[#F7F9F7]">
      <div className="hidden lg:block">
        <Sidebar user={user} />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} />
        <main className="flex-1 px-6 lg:px-8 py-6 w-full">
          <Outlet context={{ user, setUser, refreshUser: refresh }} />
        </main>
      </div>
    </div>
  );
}

export default function FarmerLayout() {
  return (
    <FarmProvider>
      <FarmerLayoutContent />
    </FarmProvider>
  );
}