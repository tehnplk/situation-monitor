import { NextResponse } from "next/server";
import { getPhitsanulokStations } from "../../../pm/_lib/air4thai";

export async function GET() {
  try {
    const stations = await getPhitsanulokStations();
    return NextResponse.json({ stations });
  } catch {
    return NextResponse.json(
      { error: "Unexpected error while fetching Air4Thai data" },
      { status: 500 },
    );
  }
}
