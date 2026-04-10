"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

interface TaskData {
  id: string;
  status: string;
  resolution: number;
  duration: number;
  resultUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
  rhStatus?: string;
}

export default function TaskPage() {
  const params = useParams();
  const taskId = params.id as string;
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("task");

  const pollTask = useCallback(async () => {
    try {
      const pollRes = await fetch(`/api/video/task/${taskId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const pollData = await pollRes.json();

      if (pollData.status) {
        setTask((prev) => prev ? { ...prev, ...pollData } : pollData);
      }

      if (pollData.status === "running" || pollData.status === "queued") {
        const getRes = await fetch(`/api/video/task/${taskId}`);
        const getData = await getRes.json();
        setTask(getData);
      }

      return pollData.status;
    } catch {
      console.error("Failed to poll task");
      return null;
    }
  }, [taskId]);

  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch(`/api/video/task/${taskId}`);
        const data = await res.json();
        setTask(data);

        if (data.status === "running" || data.status === "queued" || data.status === "uploading") {
          pollTask();
        }
      } catch {
        console.error("Failed to fetch task");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [taskId, pollTask]);

  const taskStatus = task?.status;

  useEffect(() => {
    if (!taskStatus || taskStatus === "success" || taskStatus === "failed") return;

    // Poll every 2 minutes (120000ms) for long-running video generation tasks
    const interval = setInterval(async () => {
      const status = await pollTask();
      if (status === "success" || status === "failed") {
        const res = await fetch(`/api/video/task/${taskId}`);
        const data = await res.json();
        setTask(data);
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [taskStatus, taskId, pollTask]);

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    queued: { label: t("status.queued"), color: "text-yellow-400", icon: "⏳" },
    uploading: { label: t("status.uploading"), color: "text-blue-400", icon: "📤" },
    running: { label: t("status.running"), color: "text-purple-400", icon: "⚡" },
    success: { label: t("status.success"), color: "text-green-400", icon: "✅" },
    failed: { label: t("status.failed"), color: "text-red-400", icon: "❌" },
  };

  const status = task ? statusConfig[task.status] || statusConfig.queued : null;

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            animaker.dev
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
            {t("dashboard")}
          </Link>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">{t("loading")}</p>
          </div>
        ) : !task ? (
          <div className="text-center py-20">
            <p className="text-gray-400">{t("notFound")}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
                <p className="text-gray-500 text-sm font-mono">{task.id}</p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 ${status?.color}`}>
                <span>{status?.icon}</span>
                <span className="text-sm font-medium">{status?.label}</span>
              </div>
            </div>

            {(task.status === "queued" || task.status === "uploading" || task.status === "running") && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-8 text-center">
                <div className="animate-pulse">
                  <div className="text-6xl mb-4">⚡</div>
                  <h2 className="text-xl font-semibold mb-2">{t("processing.title")}</h2>
                  <p className="text-gray-400 mb-4">{t("processing.description")}</p>
                  <div className="w-full bg-white/10 rounded-full h-2 max-w-md mx-auto">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full animate-pulse" style={{ width: task.status === "queued" ? "20%" : task.status === "uploading" ? "40%" : "70%" }} />
                  </div>
                  <p className="text-gray-600 text-xs mt-4">{t("processing.estimatedTime")}</p>
                  <p className="text-gray-500 text-xs mt-2">{t("processing.autoRefresh")}</p>
                </div>
              </div>
            )}

            {task.status === "success" && task.resultUrl && (
              <div className="mb-8">
                <div className="aspect-[9/16] max-w-sm mx-auto rounded-2xl overflow-hidden bg-white/5 border border-white/10">
                  <video src={task.resultUrl} controls autoPlay loop playsInline className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
                  <a
                    href={task.resultUrl}
                    download
                    className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-full font-medium hover:opacity-90 transition"
                  >
                    {t("download")}
                  </a>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: t("share.title"),
                          text: t("share.text"),
                          url: window.location.href,
                        });
                      } else {
                        navigator.clipboard.writeText(window.location.href);
                        alert(t("share.copied"));
                      }
                    }}
                    className="inline-block border border-white/20 text-white px-8 py-3 rounded-full font-medium hover:bg-white/5 transition"
                  >
                    {t("share.button")}
                  </button>
                  <Link
                    href="/create"
                    className="inline-block border border-white/20 text-white px-8 py-3 rounded-full font-medium hover:bg-white/5 transition"
                  >
                    {t("createAnother")}
                  </Link>
                </div>
              </div>
            )}

            {task.status === "failed" && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8">
                <h3 className="text-red-400 font-medium mb-2">{t("failed.title")}</h3>
                <p className="text-gray-400 text-sm">{task.errorMessage || t("failed.message")}</p>
                <Link href="/create" className="inline-block mt-4 text-purple-400 hover:underline text-sm">
                  {t("failed.tryAgain")}
                </Link>
              </div>
            )}

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-medium mb-4">{t("details.title")}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">{t("details.resolution")}</span>
                  <p className="font-medium">{task.resolution}P</p>
                </div>
                <div>
                  <span className="text-gray-500">{t("details.duration")}</span>
                  <p className="font-medium">{task.duration}s</p>
                </div>
                <div>
                  <span className="text-gray-500">{t("details.created")}</span>
                  <p className="font-medium">{new Date(task.createdAt).toLocaleString()}</p>
                </div>
                {task.completedAt && (
                  <div>
                    <span className="text-gray-500">{t("details.completed")}</span>
                    <p className="font-medium">{new Date(task.completedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
