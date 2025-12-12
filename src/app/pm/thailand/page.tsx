import { Suspense } from "react";
import StationsMapSection from "./StationsMapSection";

function MapFallback() {
  return (
    <div className="relative h-[540px] overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-emerald-50/60 text-sm font-medium text-emerald-900">
        กำลังโหลดข้อมูลจาก Air4Thai ทั่วประเทศ...
      </div>
    </div>
  );
}

export default function ThailandPmMapPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 lg:gap-8 lg:pt-10">
        <header className="flex flex-col gap-4 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Air4Thai Nationwide
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              แผนที่ค่าฝุ่น PM2.5 ทั่วประเทศไทย (Air4Thai)
            </h1>
            <p className="mt-1 text-sm text-emerald-900/80">
              ดึงข้อมูลแบบเรียลไทม์จาก Air4Thai แสดงค่าฝุ่น PM2.5 รายสถานีทั่วประเทศ
            </p>
          </div>
        </header>

        <main className="space-y-4">
          <Suspense fallback={<MapFallback />}>
            <StationsMapSection />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
