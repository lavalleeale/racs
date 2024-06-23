import { load } from "cheerio";
import { NextRequest, NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request: NextRequest) {
  if (
    !request.nextUrl.searchParams.has("crn") &&
    !request.nextUrl.searchParams.has("crns")
  ) {
    return NextResponse.json({ message: "CRN is required" }, { status: 400 });
  }
  const crns = request.nextUrl.searchParams.get("crns")?.split(",") || [
    request.nextUrl.searchParams.get("crn"),
  ];
  const response = await Promise.all(
    crns.map(async (crn) => {
      const html = await fetch(
        `https://sis.rpi.edu/rss/bwckschd.p_disp_detail_sched?term_in=202409&crn_in=${crn}`
      );
      const $ = load(await html.text());
      const seating = $(
        'table[summary="This layout table is used to present the seating numbers."]'
      ).find("tr");
      for (let i = 1; i < seating.length; i++) {
        const seatType = $(seating[i]);
        const kind = $(seatType.find("th")).text();
        console.log(kind);
        if (kind === "Seats") {
          const [cap, act, rem] = seatType.find("td");
          return {
            cap: parseInt($(cap).text(), 10),
            act: parseInt($(act).text(), 10),
            rem: parseInt($(rem).text(), 10),
            crn: parseInt(crn!, 10),
          };
        }
      }
    })
  );
  if (response.some((r) => !r)) {
    return NextResponse.json({ message: "Invalid CRN" }, { status: 400 });
  }
  return NextResponse.json(response, { status: 200 });
}
