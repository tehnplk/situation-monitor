"use client";

import React, { useState } from "react";
import LeafletMap from "./LeafletMap";

const MOCK_PM_DATA = {
  location: "จังหวัดพิษณุโลก",
  updatedAt: "11 ธ.ค. 2568 เวลา 16:30 น.",
  current: {
    pm25: 42,
    level: "ปานกลาง",
    aqi: 78,
    temp: 30,
    humidity: 65,
  },
  todayRange: {
    min: 28,
    max: 95,
  },
  stations: [
    {
      name: "อ.เมืองพิษณุโลก",
      pm25: 42,
      level: "ปานกลาง",
      status: "ออนไลน์",
      lastUpdate: "16:20",
      lat: 16.8212,
      lng: 100.2659,
    },
    {
      name: "อ.นครไทย",
      pm25: 58,
      level: "เริ่มมีผลกระทบ",
      status: "ออนไลน์",
      lastUpdate: "16:18",
      lat: 17.1,
      lng: 100.83,
    },
    {
      name: "อ.ชาติตระการ",
      pm25: 52,
      level: "เริ่มมีผลกระทบ",
      status: "ออนไลน์",
      lastUpdate: "16:12",
      lat: 17.5,
      lng: 100.65,
    },
    {
      name: "อ.บางระกำ",
      pm25: 48,
      level: "ปานกลาง",
      status: "ออนไลน์",
      lastUpdate: "16:05",
      lat: 16.65,
      lng: 100.11,
    },
    {
      name: "อ.บางกระทุ่ม",
      pm25: 35,
      level: "ปานกลาง",
      status: "ออนไลน์",
      lastUpdate: "16:25",
      lat: 16.6,
      lng: 100.3,
    },
    {
      name: "อ.พรหมพิราม",
      pm25: 22,
      level: "ดี",
      status: "ออนไลน์",
      lastUpdate: "16:08",
      lat: 17.0,
      lng: 100.18,
    },
    {
      name: "อ.วัดโบสถ์",
      pm25: 24,
      level: "ดี",
      status: "ออนไลน์",
      lastUpdate: "16:14",
      lat: 17.1,
      lng: 100.37,
    },
    {
      name: "อ.วังทอง",
      pm25: 31,
      level: "ดี",
      status: "ออนไลน์",
      lastUpdate: "16:15",
      lat: 16.87,
      lng: 100.42,
    },
    {
      name: "อ.เนินมะปราง",
      pm25: 80,
      level: "มีผลกระทบต่อสุขภาพ",
      status: "ออนไลน์",
      lastUpdate: "16:02",
      lat: 16.6,
      lng: 100.7,
    },
  ],
  hourly: [12, 18, 24, 30, 28, 35, 40, 45, 50, 55, 48, 42],
};

const levelColor = (level: string) => {
  switch (level) {
    case "ดี":
      return "bg-emerald-50 text-emerald-800 border-emerald-300";
    case "ปานกลาง":
      return "bg-lime-50 text-lime-800 border-lime-300";
    case "เริ่มมีผลกระทบ":
      return "bg-amber-50 text-amber-800 border-amber-300";
    case "มีผลกระทบต่อสุขภาพ":
      return "bg-rose-50 text-rose-800 border-rose-300";
    default:
      return "bg-emerald-50 text-emerald-900 border-emerald-200";
  }
};

export default function PmDashboardPage() {
  type MapSource = "mock" | "air4thai";

  type MapStation = {
    name: string;
    pm25: number;
    level: string;
    lat: number;
    lng: number;
    status?: string;
    lastUpdate?: string | null;
  };

  const [mapSource, setMapSource] = useState<MapSource>("mock");
  const [apiStations, setApiStations] = useState<MapStation[] | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const handleMapSourceChange = (source: MapSource) => {
    if (source === mapSource) return;

    if (source === "air4thai") {
      if (apiStations && apiStations.length > 0) {
        setMapSource("air4thai");
        return;
      }

      setMapLoading(true);
      setMapError(null);

      fetch("/api/pm/thailand")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Failed to fetch Air4Thai data");
          }
          return res.json();
        })
        .then((data) => {
          const rawStations: any[] = Array.isArray(data?.stations)
            ? data.stations
            : [];

          const mapped: MapStation[] = rawStations
            .filter((s) => {
              const lat = typeof s.lat === "number" ? s.lat : NaN;
              const lng = typeof s.lng === "number" ? s.lng : NaN;
              const pmRaw =
                typeof s.pm25 === "number"
                  ? s.pm25
                  : typeof s.pm25 === "string"
                  ? parseFloat(s.pm25)
                  : NaN;

              return (
                Number.isFinite(lat) &&
                Number.isFinite(lng) &&
                Number.isFinite(pmRaw)
              );
            })
            .map((s) => {
              const lat = s.lat as number;
              const lng = s.lng as number;
              const pmRaw =
                typeof s.pm25 === "number"
                  ? s.pm25
                  : typeof s.pm25 === "string"
                  ? parseFloat(s.pm25)
                  : 0;

              const name: string =
                typeof s.areaTH === "string"
                  ? s.areaTH
                  : typeof s.nameTH === "string"
                  ? s.nameTH
                  : "ไม่ทราบชื่อสถานี";

              const level: string =
                typeof s.level === "string" ? s.level : "ปานกลาง";

              const status: string | undefined =
                typeof s.status === "string" ? s.status : undefined;

              const lastUpdate: string | null | undefined =
                typeof s.lastUpdate === "string" ? s.lastUpdate : undefined;

              const station: MapStation = {
                name,
                pm25: pmRaw,
                level,
                lat,
                lng,
                status,
                lastUpdate,
              };

              return station;
            });

          if (mapped.length === 0) {
            throw new Error("No station data for Phitsanulok from Air4Thai");
          }

          setApiStations(mapped);
          setMapSource("air4thai");
        })
        .catch(() => {
          setMapError("ไม่สามารถโหลดข้อมูลจาก Air4Thai ได้ กำลังแสดงข้อมูลจำลองแทน");
          setMapSource("mock");
        })
        .finally(() => {
          setMapLoading(false);
        });
    } else {
      setMapSource("mock");
      setMapError(null);
    }
  };

  const mapStations: MapStation[] =
    mapSource === "mock"
      ? (MOCK_PM_DATA.stations as MapStation[])
      : apiStations ?? ((MOCK_PM_DATA.stations as unknown as MapStation[]));

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-emerald-200 text-emerald-950">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 lg:gap-8 lg:pt-10">
        {/* Header */}
        <header className="flex flex-col gap-4 border-b border-emerald-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              PM2.5 Situation Monitor
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-950 sm:text-3xl">
              ภาพรวมสถานการณ์ฝุ่น PM2.5
            </h1>
            <p className="mt-1 text-sm text-emerald-900/80">
              พื้นที่ติดตาม: {MOCK_PM_DATA.location}
            </p>
          </div>
          <div className="flex flex-col items-start gap-2 text-sm text-emerald-900/80 sm:items-end">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ข้อมูลจำลองสำหรับการออกแบบหน้าจอ (Mock data)
            </span>
            <p>อัปเดตล่าสุด: {MOCK_PM_DATA.updatedAt}</p>
          </div>
        </header>

        {/* Main grid */}
        <main className="grid gap-6 lg:grid-cols-3">
          {/* Left column */}
          <section className="space-y-6 lg:col-span-2">
            <LeafletMap
              stations={mapStations}
              source={mapSource}
              onSourceChange={handleMapSourceChange}
              loading={mapLoading}
            />
            {/* Current status card */}
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/90 p-5 shadow-lg shadow-emerald-200/80 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
                    สถานะปัจจุบัน
                  </p>
                  <div className="mt-2 flex items-end gap-3">
                    <span className="text-5xl font-semibold leading-none text-emerald-950">
                      {MOCK_PM_DATA.current.pm25}
                    </span>
                    <span className="pb-1 text-sm text-emerald-800">µg/m³</span>
                  </div>
                  <p className="mt-1 text-sm text-emerald-700">
                    ช่วงวันนี้ {MOCK_PM_DATA.todayRange.min} - {MOCK_PM_DATA.todayRange.max} µg/m³
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3 text-sm">
                  <span
                    className={
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold " +
                      levelColor(MOCK_PM_DATA.current.level)
                    }
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    ระดับคุณภาพอากาศ: {MOCK_PM_DATA.current.level}
                  </span>
                  <div className="grid grid-cols-3 gap-3 text-xs text-emerald-900">
                    <div className="rounded-xl bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] text-emerald-700">ดัชนี AQI</p>
                      <p className="mt-1 text-lg font-semibold text-emerald-700">
                        {MOCK_PM_DATA.current.aqi}
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] text-emerald-700">อุณหภูมิ</p>
                      <p className="mt-1 text-lg font-semibold">
                        {MOCK_PM_DATA.current.temp}°C
                      </p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 px-3 py-2">
                      <p className="text-[11px] text-emerald-700">ความชื้น</p>
                      <p className="mt-1 text-lg font-semibold">
                        {MOCK_PM_DATA.current.humidity}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Trend card (mock chart) */}
            <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/90 p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-950">
                    แนวโน้มค่าฝุ่น PM2.5 (ชั่วโมงที่ผ่านมา)
                  </h2>
                  <p className="mt-1 text-xs text-emerald-700">
                    กราฟตัวอย่างเพื่อใช้เป็น mockup สามารถเชื่อมต่อ API จริงภายหลังได้
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs text-emerald-800">
                  ช่วงเวลา: 12 ชั่วโมงล่าสุด
                </span>
              </div>

              <div className="mt-5 flex h-40 items-end gap-1.5 rounded-xl bg-gradient-to-t from-emerald-50 to-emerald-100 p-3">
                {MOCK_PM_DATA.hourly.map((value, idx) => (
                  <div key={idx} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      className="w-full rounded-full bg-emerald-400/80"
                      style={{ height: `${20 + (value / 60) * 70}%` }}
                    />
                    <span className="mt-2 text-center text-[10px] text-emerald-700">
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </section>

          {/* Right column */}
          <aside className="space-y-4">
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-5 text-sm shadow-lg shadow-emerald-200/80">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                คำแนะนำด้านสุขภาพ
              </p>
              <h2 className="mt-2 text-base font-semibold text-emerald-950">
                ระดับปัจจุบัน: {MOCK_PM_DATA.current.level}
              </h2>
              <ul className="mt-3 space-y-2 text-xs text-emerald-900">
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                  <span>ประชาชนทั่วไปยังสามารถทำกิจกรรมกลางแจ้งได้ตามปกติ แต่ควรสังเกตอาการตนเอง</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                  <span>กลุ่มเสี่ยง (เด็ก ผู้สูงอายุ ผู้ป่วยโรคทางเดินหายใจ) ควรลดเวลาทำกิจกรรมกลางแจ้ง</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-emerald-500" />
                  <span>หากมีอาการไอ หายใจติดขัด ควรหลีกเลี่ยงพื้นที่โล่ง และสวมหน้ากากกรองฝุ่น</span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-white/90 p-4 text-xs text-emerald-800">
              <p className="font-semibold text-emerald-950">หมายเหตุ</p>
              <p className="mt-1">
                หน้านี้เป็นตัวอย่าง mockup UI สำหรับการออกแบบระบบติดตามสถานการณ์ฝุ่น PM2.5 ของจังหวัดพิษณุโลก สามารถนำไปต่อยอดเชื่อมต่อข้อมูลจาก API จริง หรือเพิ่มแผนที่และฟีเจอร์อื่น ๆ ภายหลังได้
              </p>
            </div>
          </aside>
        </main>

        {/* Stations table */}
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white/95">
          <div className="border-b border-emerald-100 px-5 py-4 sm:px-6">
            <h2 className="text-sm font-semibold text-emerald-950">สถานีวัดคุณภาพอากาศในจังหวัดพิษณุโลก</h2>
            <p className="mt-1 text-xs text-emerald-700">
              แสดงค่าฝุ่น PM2.5 แยกตามพื้นที่ (ข้อมูลจำลอง)
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-emerald-100 text-xs">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-emerald-900">พื้นที่</th>
                  <th className="px-4 py-3 text-right font-medium text-emerald-900">PM2.5 (µg/m³)</th>
                  <th className="px-4 py-3 text-left font-medium text-emerald-900">ระดับคุณภาพอากาศ</th>
                  <th className="px-4 py-3 text-left font-medium text-emerald-900">สถานะสถานี</th>
                  <th className="px-4 py-3 text-right font-medium text-emerald-900">อัปเดตล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 bg-white">
                {MOCK_PM_DATA.stations.map((station) => (
                  <tr key={station.name} className="hover:bg-emerald-50">
                    <td className="px-4 py-3 text-emerald-950">{station.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-800">
                      {station.pm25}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] " +
                          levelColor(station.level)
                        }
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {station.level}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-800">{station.status}</td>
                    <td className="px-4 py-3 text-right text-emerald-700">
                      {station.lastUpdate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
