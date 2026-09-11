import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

import { safeReturnTo } from "@/lib/authReturnTo";
import SEO from "@/components/SEO";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Log in to your account"
      footer={
        <>
          <SEO 
            title="Log In - Access Smart Farming Intelligence" 
            description="Log in to Kisan Mitra to access your personalized farming copilot, disease diagnostic history, and live APMC market data."
            canonicalPath="/login"
          />
          Don't have an account?{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-medium hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >


      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log in"
          )}
        </Button>

        <div className="pt-3 border-t border-[#ECE9DF] space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#65736C] text-center">
            Quick One-Click Demo Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={async () => {
                setEmail("farmer@kisanmitra.local");
                setPassword("farmer123");
                setError("");
                setLoading(true);
                try {
                  await base44.auth.loginViaEmailPassword("farmer@kisanmitra.local", "farmer123");
                  window.location.href = returnTo === "/login" ? "/dashboard" : returnTo;
                } catch (err) {
                  setError(err.message || "Failed to log in");
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-2 rounded-xl bg-[#DDF5EA] hover:bg-[#cceede] text-[#063F2E] text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Demo Farmer
            </button>
            <button
              type="button"
              onClick={async () => {
                setEmail("admin@kisanmitra.local");
                setPassword("admin123");
                setError("");
                setLoading(true);
                try {
                  await base44.auth.loginViaEmailPassword("admin@kisanmitra.local", "admin123");
                  window.location.href = "/admin";
                } catch (err) {
                  setError(err.message || "Failed to log in");
                } finally {
                  setLoading(false);
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
