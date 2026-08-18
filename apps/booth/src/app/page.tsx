"use client";

import { useCallback, useEffect, useState } from "react";
import { env } from "@/lib/env";
import { getDevice, setDevice } from "@/lib/device";
import type { DeviceInfo } from "@/lib/db";
import { enqueuePhoto, flushPending, listPending } from "@/lib/queue";
import { SetupScreen } from "@/components/setup-screen";
import { CaptureScreen } from "@/components/capture-screen";
import { PreviewScreen } from "@/components/preview-screen";
import { StatusBar } from "@/components/status-bar";

export default function BoothPage() {
  const [device, setDeviceState] = useState<DeviceInfo | undefined>();
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    void getDevice().then((d) => {
      setDeviceState(d);
      setLoading(false);
    });
  }, []);

  const refreshPending = useCallback(async () => {
    setPending((await listPending()).length);
  }, []);

  const flush = useCallback(async () => {
    if (!device || !navigator.onLine) return;
    setSyncing(true);
    await flushPending(device.deviceToken);
    await refreshPending();
    setSyncing(false);
  }, [device, refreshPending]);

  useEffect(() => {
    setOnline(navigator.onLine);
    const onOnline = () => {
      setOnline(true);
      void flush();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const iv = setInterval(() => void refreshPending(), 3000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(iv);
    };
  }, [flush, refreshPending]);

  useEffect(() => {
    if (navigator.onLine) void flush();
  }, [device, flush]);

  async function handleRegister(info: { eventId: string; boothName: string }) {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/booths/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: info.eventId, name: info.boothName }),
    });
    if (!res.ok) throw new Error(`API ${res.status}`);
    const data = (await res.json()) as { boothId: string; deviceToken: string };
    const next: DeviceInfo = {
      key: "device",
      boothId: data.boothId,
      eventId: info.eventId,
      deviceToken: data.deviceToken,
      boothName: info.boothName,
    };
    await setDevice(next);
    setDeviceState(next);
  }

  async function handleCapture(blob: Blob) {
    setPreview({ url: URL.createObjectURL(blob), blob });
  }

  async function handleSave() {
    if (!preview || !device) return;
    await enqueuePhoto(preview.blob, "single", null);
    URL.revokeObjectURL(preview.url);
    setPreview(null);
    await refreshPending();
    void flush();
  }

  function handleRetake() {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-black text-white">
        Cargando…
      </main>
    );
  }

  return (
    <div className="relative min-h-dvh bg-black">
      {!device ? (
        <SetupScreen onRegister={handleRegister} />
      ) : preview ? (
        <PreviewScreen
          imageUrl={preview.url}
          onSave={handleSave}
          onRetake={handleRetake}
        />
      ) : (
        <CaptureScreen onCapture={handleCapture} />
      )}
      <StatusBar online={online} pending={pending} syncing={syncing} />
    </div>
  );
}