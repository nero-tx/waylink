import { type NextRequest } from "next/server";
import { tryCatch } from "@/lib/handler";
import { providerController } from "@/controllers/provider.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  return tryCatch(req, async () => {
    const { id } = await params;
    const rStr = req.nextUrl.searchParams.get("r")?.trim();

    return await providerController.getProviderAccess(id, rStr);
  });
}
