import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function POST() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 403 });
  }

  const generatedBy = session.user.name ?? session.user.email ?? "Admin";

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [inspections, serviceTickets] = await Promise.all([
    db.inspection.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        homeownerName: true,
        homeownerEmail: true,
        propertyAddress: true,
        city: true,
        state: true,
        inspectionDate: true,
        finalStatus: true,
        membershipTier: true,
        eligibleForSuperior: true,
        inspectorName: true,
        inspectionCompany: true,
        member: { select: { id: true } },
      },
      orderBy: { inspectionDate: "desc" },
    }),
    db.serviceTicket.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: {
        id: true,
        ticketNumber: true,
        memberFirstName: true,
        memberLastName: true,
        memberEmail: true,
        serviceType: true,
        status: true,
        callReceivedAt: true,
        scheduledFor: true,
        customerInquiry: true,
        faultIdentified: true,
        repairsPerformed: true,
        vendor: { select: { companyName: true } },
      },
      orderBy: { callReceivedAt: "desc" },
    }),
  ]);

  const prompt = `You are a senior operations advisor for Welgard, a well water inspection and membership company.

Context:
- Inspections result in a finalStatus: "green" (Premium tier eligible), "yellow" (Superior tier eligible), "red" (Standard), or "ineligible"
- When member field is null on an inspection, that homeowner is NOT yet a Welgard member — high sales opportunity
- Service tickets track maintenance calls for well systems. Emergency types and repeat addresses are high-value signals
- membershipTier on an inspection means they are already a member (standard | superior | premium)

Last 30 days of platform data:

INSPECTIONS (${inspections.length} total):
${JSON.stringify(inspections, null, 2)}

SERVICE TICKETS (${serviceTickets.length} total):
${JSON.stringify(serviceTickets, null, 2)}

Write a concise briefing for the internal team. Use exactly this format — no JSON, no extra commentary:

## Summary

[2-3 sentences on the most important things happening right now]

---

## Project Manager Priorities

**HIGH — [action title]**
[Specific action to take. Reference actual names, ticket numbers, or dates from the data.]

(continue with 3-6 items using HIGH, MEDIUM, or LOW)

---

## Sales Rep Opportunities

**HIGH — [opportunity title]**
[Specific outreach action. Use real homeowner names and emails from the data.]

(continue with 3-6 items using HIGH, MEDIUM, or LOW)

PM priorities to look for: open/unscheduled service tickets, missing vendor assignments, stalled inspections, scheduling gaps, emergency tickets with no follow-up, tickets with no repairs recorded.
Sales priorities to look for: green/yellow inspections where member is null (unconverted homeowners), eligible-for-superior members still on standard, service ticket customers with repeated issues who would benefit from membership.

IMPORTANT — Linking: when referencing a specific inspection by name or detail, append [[inspection:ID]] immediately after the homeowner name (using the actual id field value). When referencing a specific service ticket, append [[ticket:ID]] immediately after the member name or ticket number (using the actual id field value). Do not put these tags on their own line — keep them inline with the text. Example: "John Smith [[inspection:abc123]] has a green inspection but is not yet a member."

Be specific. Use real names, emails, IDs, and dates from the data. No placeholder text.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const anthropicStream = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    stream: true,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const event of anthropicStream) {
        if (
          event.type === "content_block_delta" &&
          event.delta.type === "text_delta"
        ) {
          fullText += event.delta.text;
          controller.enqueue(encoder.encode(event.delta.text));
        }
      }
      controller.close();

      // Persist to DB so all users see the latest insight
      await db.aiInsight.deleteMany();
      await db.aiInsight.create({ data: { text: fullText, generatedBy } });
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
