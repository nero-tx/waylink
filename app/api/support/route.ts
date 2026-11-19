import { NextRequest } from "next/server";
import { tryCatch } from "@/lib/handler";
import { listTicketsController } from "@/controllers/support.controller";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;

  const params = url.searchParams;
  const role = params.get("role")?.trim() as "user" | "provider";

  return tryCatch(req, async () => {
    return await listTicketsController(params, role);
  });
}
