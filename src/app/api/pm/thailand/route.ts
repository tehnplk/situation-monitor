import { NextResponse } from "next/server";

const AIR4THAI_ENDPOINT = "http://air4thai.pcd.go.th/services/getNewAQI_JSON.php";

// เกณฑ์ช่วงค่า PM2.5 นี้ออกแบบให้สอดคล้องโดยประมาณกับระดับคุณภาพอากาศของไทย
// ข้อมูลอ้างอิงเพิ่มเติม: ระบบ Air4Thai / กรมควบคุมมลพิษ http://air4thai.pcd.go.th
function levelFromPm25(value: number): string {
  if (value <= 25) return "ดี";
  if (value <= 50) return "ปานกลาง";
  if (value <= 75) return "เริ่มมีผลกระทบ";
  return "มีผลกระทบต่อสุขภาพ";
}

export async function GET() {
  try {
    const res = await fetch(AIR4THAI_ENDPOINT, {
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch data from Air4Thai" },
        { status: 502 },
      );
    }

    const raw = (await res.json()) as any;
    const rawStations: any[] = Array.isArray(raw.stations)
      ? raw.stations
      : Array.isArray(raw)
      ? raw
      : Array.isArray(raw?.data)
      ? raw.data
      : [];

    const stations = rawStations
      .map((s) => {
        const pmObj = s?.AQILast?.PM25;
        const pmRaw = typeof pmObj?.value === "string" ? parseFloat(pmObj.value) : NaN;
        const pm25 = Number.isFinite(pmRaw) && pmRaw >= 0 ? pmRaw : null;
        const lat = typeof s?.lat === "string" ? parseFloat(s.lat) : NaN;
        const lng = typeof s?.long === "string" ? parseFloat(s.long) : NaN;

        const areaTH: string | null = typeof s?.areaTH === "string" ? s.areaTH : null;
        // areaTH ตัวอย่าง: "ต.ในเมือง อ.เมือง, พิษณุโลก" → จังหวัดคือ token สุดท้ายหลัง comma
        let provinceTH: string | null = null;
        if (areaTH) {
          const parts = areaTH.split(",");
          provinceTH = parts[parts.length - 1]?.trim() || null;
        }

        return {
          stationID: s.stationID ?? null,
          nameTH: s.nameTH ?? null,
          areaTH,
          provinceTH,
          lat: Number.isFinite(lat) ? lat : null,
          lng: Number.isFinite(lng) ? lng : null,
          pm25,
          level: pm25 == null ? null : levelFromPm25(pm25),
          status: "ออนไลน์",
          lastUpdate:
            s?.AQILast?.date && s?.AQILast?.time
              ? `${s.AQILast.date} ${s.AQILast.time}`
              : null,
        };
      })
      .filter((s) => s.lat != null && s.lng != null && s.pm25 != null);

    return NextResponse.json({ stations });
  } catch (error) {
    return NextResponse.json(
      { error: "Unexpected error while fetching Air4Thai data" },
      { status: 500 },
    );
  }
}
