"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useSession } from "@/core/auth/client";

export default function CreatePage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [videoPreview, setVideoPreview] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const resolution = 540;
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [credits, setCredits] = useState<number | null>(null);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const t = useTranslations("create");
  const tCommon = useTranslations("common");
  const { data: session } = useSession();

  useEffect(() => {
    fetch("/api/user/me")
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data && !data.error) setCredits(data.credits ?? 0);
        else router.replace("/sign-in");
      })
      .catch(() => setCredits(0));
  }, [router]);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (videoPreview) URL.revokeObjectURL(videoPreview);
    };
  }, [photoPreview, videoPreview]);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErrorMessage(t("alerts.imageFile"));
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage(t("alerts.imageTooLarge"));
      return;
    }

    setErrorMessage("");
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      setErrorMessage(t("alerts.videoFile"));
      return;
    }
    if (file.size > 200 * 1024 * 1024) {
      setErrorMessage(t("alerts.videoTooLarge"));
      return;
    }

    setErrorMessage("");
    setVideo(file);
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    const previewUrl = URL.createObjectURL(file);
    const metadataUrl = URL.createObjectURL(file);
    setVideoPreview(previewUrl);

    const videoElement = document.createElement("video");
    videoElement.preload = "metadata";
    videoElement.onloadedmetadata = () => {
      window.URL.revokeObjectURL(metadataUrl);
      const duration = Math.ceil(videoElement.duration);
      if (duration > 30) {
        setVideo(null);
        URL.revokeObjectURL(previewUrl);
        setVideoPreview("");
        setVideoDuration(0);
        if (videoRef.current) videoRef.current.value = "";
        setErrorMessage(t("alerts.videoTooLong"));
        return;
      }
      setVideoDuration(duration);
    };
    videoElement.src = metadataUrl;
  };

  const handleBuyCredits = async (productType: "single" | "10pack" = "single") => {
    setBuyingCredits(true);
    try {
      const userRes = await fetch("/api/user/me");
      if (!userRes.ok) {
        throw new Error(t("alerts.signInRequired"));
      }

      const userData = await userRes.json();
      const userId = userData?.id;
      if (!userId) {
        throw new Error(t("alerts.checkoutUnavailable"));
      }

      // Map product type to Creem product ID
      const productIdMap = {
        single: process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_SINGLE,
        "10pack": process.env.NEXT_PUBLIC_CREEM_PRODUCT_ID_10PACK,
      };

      const productId = productIdMap[productType];
      if (!productId) {
        throw new Error("Product ID not configured");
      }

      // Redirect to Creem checkout
      const params = new URLSearchParams({
        productId,
      });
      router.push(`/api/payment/creem/checkout?${params.toString()}`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("alerts.genericError"));
    } finally {
      setBuyingCredits(false);
    }
  };

  const uploadFileToR2 = async (file: File, fileType: "photo" | "video") => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        fileType,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to get upload URL");
    }

    const { presignedUrl, key } = await res.json();

    const uploadRes = await fetch(presignedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!uploadRes.ok) {
      throw new Error(`Upload failed: ${uploadRes.status}`);
    }

    return key;
  };

  const handleSubmit = async () => {
    setErrorMessage("");
    if (!photo || !video) {
      setErrorMessage(t("alerts.missingFiles"));
      return;
    }
    if (credits !== null && credits < 1) {
      return handleBuyCredits();
    }

    setSubmitting(true);
    try {
      setUploadProgress(t("progress.uploadingPhoto"));
      const photoKey = await uploadFileToR2(photo, "photo");

      setUploadProgress(t("progress.uploadingVideo"));
      const videoKey = await uploadFileToR2(video, "video");

      setUploadProgress(t("progress.startingGeneration"));
      const res = await fetch("/api/video/task/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoKey,
          videoKey,
          resolution: String(resolution),
          duration: videoDuration || 14,
        }),
      });
      const data = await res.json();

      if (res.status === 402) {
        setErrorMessage(data.error || t("alerts.insufficientCredits"));
        return handleBuyCredits();
      }

      if (!res.ok) throw new Error(data.error || "Failed to create task");
      router.push(`/task/${data.taskId}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t("alerts.genericError"));
    } finally {
      setSubmitting(false);
      setUploadProgress("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            animaker.dev
          </Link>
          <div className="flex items-center gap-4">
            {credits !== null && (
              <span className="text-sm text-gray-400">
                {tCommon("sign.credits_title", { credits })}
              </span>
            )}
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
              {tCommon("dashboard")}
            </Link>
          </div>
        </div>
      </nav>

      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-gray-400 mb-10">{t("subtitle")}</p>

        {errorMessage && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center justify-between">
            <p className="text-red-400">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage("")}
              className="text-red-400 hover:text-red-300 transition"
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {credits !== null && credits < 1 && (
          <div className="mb-8 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-orange-400 font-medium">{t("noCredits.title")}</p>
              <p className="text-sm text-orange-300/70">{t("noCredits.description")}</p>
            </div>
            <button
              onClick={() => handleBuyCredits()}
              disabled={buyingCredits}
              className="bg-orange-500 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50"
            >
              {buyingCredits ? tCommon("loading") : t("buyCreditsCta")}
            </button>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 mb-10">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">{t("photo.label")}</label>
            <div
              onClick={() => photoRef.current?.click()}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition overflow-hidden relative"
            >
              {photoPreview ? (
                <Image src={photoPreview} alt="Preview" fill unoptimized className="h-full w-full object-cover" />
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="text-gray-500 text-sm">{t("photo.cta")}</span>
                  <span className="text-gray-600 text-xs mt-1">{t("photo.hint")}</span>
                </>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">{t("video.label")}</label>
            <div
              onClick={() => videoRef.current?.click()}
              className="aspect-[3/4] rounded-2xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-500/5 transition overflow-hidden"
            >
              {videoPreview ? (
                <video src={videoPreview} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <>
                  <svg className="w-12 h-12 text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                  <span className="text-gray-500 text-sm">{t("video.cta")}</span>
                  <span className="text-gray-600 text-xs mt-1">{t("video.hint")}</span>
                </>
              )}
            </div>
            <input ref={videoRef} type="file" accept="video/*" onChange={handleVideo} className="hidden" />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!photo || !video || submitting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-medium text-lg hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {submitting
            ? uploadProgress || t("progress.processing")
            : credits !== null && credits < 1
            ? t("buyCreditsToGenerate")
            : t("generate")}
        </button>
      </div>
    </main>
  );
}
