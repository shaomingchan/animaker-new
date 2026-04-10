"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/core/auth/client";

interface Task {
  id: string;
  status: string;
  resolution: number;
  duration: number;
  createdAt: string;
  completedAt?: string;
}

interface UserInfo {
  email: string;
  credits: number;
  plan: string;
  tasks: Task[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("payment") === "success";
  });
  const router = useRouter();
  const t = useTranslations("dashboard");
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => {
        if (!r.ok) {
          router.replace("/sign-in");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data && !data.error) setUser(data);
        else if (data?.error) router.replace("/sign-in");
      })
      .catch(() => {
        router.replace("/sign-in");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!showPaymentSuccess || typeof window === "undefined") return;

    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("payment");
    window.history.replaceState({}, "", newUrl.toString());
  }, [showPaymentSuccess]);

  const statusBadge: Record<string, { label: string; cls: string }> = {
    queued: { label: t("status.queued"), cls: "bg-yellow-500/10 text-yellow-400" },
    uploading: { label: t("status.uploading"), cls: "bg-blue-500/10 text-blue-400" },
    running: { label: t("status.running"), cls: "bg-purple-500/10 text-purple-400" },
    success: { label: t("status.success"), cls: "bg-green-500/10 text-green-400" },
    failed: { label: t("status.failed"), cls: "bg-red-500/10 text-red-400" },
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            animaker.dev
          </Link>
          <Link href="/create" className="text-sm bg-white text-black px-4 py-2 rounded-full font-medium hover:bg-gray-200 transition">
            {t("newVideo")}
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (
          <>
            {showPaymentSuccess && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center justify-between">
                <p className="text-green-400 font-medium">
                  {t("paymentSuccess")}
                </p>
                <button
                  onClick={() => setShowPaymentSuccess(false)}
                  className="text-green-400 hover:text-green-300 transition"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-sm mb-1">{t("creditsRemaining")}</p>
                <p className="text-3xl font-bold">{user?.credits ?? 0}</p>
                <Link
                  href="/#pricing"
                  className="mt-3 w-full text-sm bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-medium hover:opacity-90 transition block text-center"
                >
                  {t("buyCredits")}
                </Link>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-sm mb-1">{t("currentPlan")}</p>
                <p className="text-3xl font-bold capitalize">{user?.plan ?? "free"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <p className="text-gray-500 text-sm mb-1">{t("totalVideos")}</p>
                <p className="text-3xl font-bold">{user?.tasks?.length ?? 0}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">{t("yourVideos")}</h2>
              <Link href="/create" className="text-sm text-purple-400 hover:underline">
                {t("createNew")}
              </Link>
            </div>

            {!user?.tasks?.length ? (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-gray-500 mb-4">{t("noVideos")}</p>
                <Link href="/create" className="text-purple-400 hover:underline">
                  {t("createFirst")}
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {user.tasks.map((task) => {
                  const badge = statusBadge[task.status] || statusBadge.queued;
                  return (
                    <Link
                      key={task.id}
                      href={`/task/${task.id}`}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-2xl">
                          🎬
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {task.resolution}P  {task.duration}s
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(task.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
