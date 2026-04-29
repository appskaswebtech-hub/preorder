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
  console.log("🎯 Webhook received at:", new Date().toISOString());

  try {
    const { topic, shop, payload } = await authenticate.webhook(request);
    console.log("✅ HMAC verification passed");
    console.log(`✅ Topic: ${topic}`);
    console.log(`✅ Shop: ${shop}`);

    switch (topic) {

      // ── GDPR / COMPLIANCE WEBHOOKS ──────────────────────────
      case "CUSTOMERS_DATA_REQUEST":
        console.log("📋 Processing customer data request for shop:", shop);
        await handleCustomerDataRequest(payload, shop);
        break;

      case "CUSTOMERS_REDACT":
        console.log("🗑️ Processing customer redaction for shop:", shop);
        await handleCustomerRedact(payload, shop);
        break;

      case "SHOP_REDACT":
        console.log("🗑️ Processing shop redaction for shop:", shop);
        await handleShopRedact(payload, shop);
        break;

      // ── APP WEBHOOKS ─────────────────────────────────────────
      case "APP_UNINSTALLED":
        console.log("🗑️ App uninstalled for shop:", shop);
        break;

      case "APP_SCOPES_UPDATE":
        console.log("🔄 App scopes updated for shop:", shop);
        break;

      // ── ORDERS CREATE ────────────────────────────────────────
      case "ORDERS_CREATE": {
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
          console.log(`✅ PreOrder created for order: ${order.id}`);
        } else {
          console.log(`ℹ️ Order ${order.id} is not a preorder, skipping.`);
        }
        break;
      }

      // ── ORDERS UPDATED / PAID / CANCELLED ───────────────────
      case "ORDERS_UPDATED":
      case "ORDERS_PAID":
      case "ORDERS_CANCELLED": {
        const order = payload;
        const existing = await db.preOrder.findFirst({
          where: { shopifyOrderId: String(order.id) },
        });

        if (existing) {
          const status = statusMap[order.financial_status] ?? existing.status;
          await db.preOrder.update({
            where: { id: existing.id },
            data: {
              status: status,
              amount: parseFloat(order.total_price),
            },
          });
          console.log(`✅ PreOrder updated for order: ${order.id}`);
        } else {
          console.log(`ℹ️ Order ${order.id} not found in PreOrder table, skipping.`);
        }
        break;
      }

      default:
        console.log(`⚠️ Unhandled webhook topic: ${topic}`);
    }

    return new Response("Webhook processed successfully", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });

  } catch (error) {
    console.error("❌ Webhook error:", error.message);

    if (
      error.message?.toLowerCase().includes("hmac") ||
      error.message?.toLowerCase().includes("unauthorized") ||
      error.message?.toLowerCase().includes("authentication") ||
      error.message?.toLowerCase().includes("invalid") ||
      error.status === 401
    ) {
      return new Response("Unauthorized - Invalid HMAC signature", {
        status: 401,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response("Internal Server Error", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

// ── GDPR HANDLER FUNCTIONS ───────────────────────────────────

async function handleCustomerDataRequest(payload, shop) {
  // Required by Shopify - respond with any customer data you store
  // Currently we don't store personal customer data beyond order email
  console.log(`✅ Customer data request handled for shop: ${shop}`);
  return;
}

async function handleCustomerRedact(payload, shop) {
  // Required by Shopify - delete customer personal data if stored
  // Redact customer email from preorders if needed
  try {
    const customerId = payload?.customer?.id;
    const email = payload?.customer?.email;
    if (email) {
      await db.preOrder.updateMany({
        where: { shop: shop, customerEmail: email },
        data: { customerEmail: "REDACTED" },
      });
      console.log(`✅ Customer data redacted for email: ${email}`);
    }
  } catch (e) {
    console.log("⚠️ Customer redact error:", e.message);
  }
  return;
}

async function handleShopRedact(payload, shop) {
  // Required by Shopify - delete all shop data after uninstall (48hr delay)
  try {
    await db.preOrder.deleteMany({
      where: { shop: shop },
    });
    console.log(`✅ All shop data deleted for: ${shop}`);
  } catch (e) {
    console.log("⚠️ Shop redact error:", e.message);
  }
  return;
}