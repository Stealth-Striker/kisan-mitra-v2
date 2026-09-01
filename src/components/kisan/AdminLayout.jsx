import React, { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { base44 } from "@/api/base44Client";

export default function AdminLayout() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    base44
      .auth.me()
      .then((u) => {
        setUser(u);
        setChecking(false);
      })
      .catch(() => {
        setUser(null);
        setChecking(false);
      });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#F7F9F7]">
        <div className="w-8 h-8 border-4 border-[#E8F8F1] border-t-[#005A3C] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen bg-[#F7F9F7]">
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 px-6 lg:px-8 py-6 w-full">
          <Outlet context={{ user }} />
        </main>
      </div>
    </div>
  );
}