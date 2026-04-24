import { authenticate } from "../shopify.server";
import db from "../db.server";

const statusMap = {
  pending: "pending",
  authorized: "confirmed",
  paid: "paid",
  partially_paid: "partially_paid",
  refunded: "refunded",
  voided: "cancelled",
  partially_refunded: "partially_refunded",
};

export const action = async ({ request }) => {
  const { topic, shop, payload } = await authenticate.webhook(request);

  // ── ORDERS CREATE ──────────────────────────────────────────
  if (topic === "ORDERS_CREATE") {
    const order = payload;

    const isPreorder = order.line_items?.some((item) =>
      item.properties?.some(
        (p) => p.name === "_is_preorder" && p.value === "true"
      )
    );

    if (isPreorder) {
      const status = statusMap[order.financial_status] ?? "pending";

      await db.preOrder.create({
        data: {
          shopifyOrderId: String(order.id),
          productTitle: order.line_items[0]?.title ?? "",
          customerEmail: order.email ?? "",
          status: status,
          amount: parseFloat(order.total_price),
          shop: shop,
        },
      });
    }
  }

  // ── ORDERS UPDATED / PAID / CANCELLED ──────────────────────
  if (
    topic === "ORDERS_UPDATED" ||
    topic === "ORDERS_PAID" ||
    topic === "ORDERS_CANCELLED"
  ) {
    const order = payload;

    // Only update if this order exists in our PreOrder table
    const existing = await db.preOrder.findFirst({
      where: { shopifyOrderId: String(order.id) },
    });

    if (existing) {
      const status = statusMap[order.financial_status] ?? existing.status;

      await db.preOrder.update({
        where: { id: existing.id },
        data: {
          status: status,
          amount: parseFloat(order.total_price), // in case amount changed
        },
      });
    }
  }

  return new Response("OK", { status: 200 });
};