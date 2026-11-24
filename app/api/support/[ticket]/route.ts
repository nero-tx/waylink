import { type NextRequest } from "next/server";
import { tryCatch } from "@/lib/handler";
import { getTicketIssues } from "@/controllers/support.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticket: string }> },
) {
  return tryCatch(req, async () => {
    const { ticket } = await params;

    return await getTicketIssues(ticket);
  });
}
