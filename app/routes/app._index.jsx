import React from "react";
import { useLoaderData, useNavigate } from "react-router";
import { data } from "react-router";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ─────────────────────────────────────────────
// LOADER — server-side, reads connected shop
// ─────────────────────────────────────────────
export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  // ── 1. Shopify Orders (latest 10) — wrapped in try/catch ──
  let orders = [];
  try {
    const ordersRes = await admin.graphql(`
      query {
        orders(first: 10, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              totalPriceSet { shopMoney { amount currencyCode } }
              customer { firstName lastName email }
              lineItems(first: 3) {
                edges { node { title quantity } }
              }
            }
          }
        }
      }
    `);
    const ordersJson = await ordersRes.json();
    orders = ordersJson.data.orders.edges.map(({ node }) => ({
      id: node.id,
      name: node.name,
      createdAt: node.createdAt,
      financialStatus: node.displayFinancialStatus,
      fulfillmentStatus: node.displayFulfillmentStatus,
      amount: `${node.totalPriceSet.shopMoney.currencyCode} ${parseFloat(node.totalPriceSet.shopMoney.amount).toFixed(2)}`,
      customer: node.customer
        ? `${node.customer.firstName ?? ""} ${node.customer.lastName ?? ""}`.trim()
        : "Guest",
      products: node.lineItems.edges.map((e) => e.node.title).join(", "),
    }));
  } catch (e) {
    console.warn("Orders query skipped — Protected Customer Data not approved:", e.message);
    // orders stays []
  }

  // ── 2. Shopify Products (first 10 active) ───
  const productsRes = await admin.graphql(`
    query {
      products(first: 10, query: "status:active") {
        edges {
          node {
            id
            title
            status
            totalInventory
            priceRangeV2 {
              minVariantPrice { amount currencyCode }
            }
            featuredImage { url altText }
          }
        }
      }
    }
  `);
  const productsJson = await productsRes.json();
  const products = productsJson.data.products.edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    status: node.status,
    inventory: node.totalInventory,
    price: `${node.priceRangeV2.minVariantPrice.currencyCode} ${parseFloat(node.priceRangeV2.minVariantPrice.amount).toFixed(2)}`,
    image: node.featuredImage?.url ?? null,
  }));

  // ── 3. Pre-orders from your own DB ──────────
  const preOrders = await db.preOrder.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      shopifyOrderId: true,
      productTitle: true,
      customerEmail: true,
      status: true,
      amount: true,
      createdAt: true,
    },
  });

  // ── 4. Stats ────────────────────────────────
  const stats = {
    activePreOrders: preOrders.filter((p) => p.status === "pending").length,
    totalRevenue: preOrders.reduce((sum, p) => sum + (p.amount ?? 0), 0),
    pendingOrders: preOrders.filter((p) => p.status === "pending").length,
    completedOrders: preOrders.filter((p) => p.status === "fulfilled").length,
  };

  return data({ shop, stats, orders, products, preOrders });
}

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const s = {
  page: { padding: "24px", fontFamily: "sans-serif", maxWidth: "1200px", margin: "0 auto" },
  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" },
  title: { fontSize: "22px", fontWeight: "600", margin: 0 },
  shopBadge: { fontSize: "12px", color: "#6b7280", background: "#f3f4f6", padding: "3px 10px", borderRadius: "20px", marginLeft: "10px" },
  headerActions: { display: "flex", gap: "8px" },
  btn: { padding: "8px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: "14px" },
  btnPrimary: { padding: "8px 16px", borderRadius: "6px", border: "none", background: "#6366f1", color: "#fff", cursor: "pointer", fontSize: "14px" },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: "16px", marginBottom: "24px" },
  statCard: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px" },
  statLabel: { fontSize: "13px", color: "#6b7280", marginBottom: "8px" },
  statValue: { fontSize: "26px", fontWeight: "700" },
  layout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "16px", alignItems: "start" },
  card: { background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", marginBottom: "16px" },
  cardTitle: { fontSize: "16px", fontWeight: "600", margin: "0 0 14px" },
  tabs: { display: "flex", gap: "4px", marginBottom: "16px", borderBottom: "1px solid #e5e7eb" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "14px" },
  th: { textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: "500", whiteSpace: "nowrap" },
  td: { padding: "10px 12px", borderBottom: "1px solid #f3f4f6", verticalAlign: "middle" },
  sideBtn: { display: "block", width: "100%", padding: "8px 0", borderRadius: "6px", border: "1px solid #d1d5db", background: "#fff", cursor: "pointer", fontSize: "14px", marginBottom: "8px" },
  empty: { textAlign: "center", color: "#9ca3af", padding: "32px 0", fontSize: "14px" },
  metaLabel: { fontSize: "12px", color: "#9ca3af", margin: "0 0 2px" },
  metaValue: { fontSize: "14px", fontWeight: "500", margin: "0 0 12px" },
  warningBanner: {
    background: "#fffbeb",
    border: "1px solid #f59e0b",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    fontSize: "13px",
    color: "#92400e",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

function tab(active) {
  return {
    padding: "8px 16px", cursor: "pointer", border: "none", background: "none",
    fontSize: "14px", fontWeight: active ? "600" : "400",
    color: active ? "#6366f1" : "#6b7280",
    borderBottom: active ? "2px solid #6366f1" : "2px solid transparent",
    marginBottom: "-1px",
  };
}

const badgeMap = {
  pending:     { bg: "#fef3c7", color: "#92400e" },
  fulfilled:   { bg: "#d1fae5", color: "#065f46" },
  cancelled:   { bg: "#fee2e2", color: "#991b1b" },
  ACTIVE:      { bg: "#d1fae5", color: "#065f46" },
  DRAFT:       { bg: "#f3f4f6", color: "#374151" },
  ARCHIVED:    { bg: "#fee2e2", color: "#991b1b" },
  PAID:        { bg: "#d1fae5", color: "#065f46" },
  PENDING:     { bg: "#fef3c7", color: "#92400e" },
  UNFULFILLED: { bg: "#fef3c7", color: "#92400e" },
  FULFILLED:   { bg: "#d1fae5", color: "#065f46" },
};

function Badge({ status }) {
  const st = badgeMap[status] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: "12px", fontSize: "12px", background: st.bg, color: st.color }}>
      {status?.toLowerCase()}
    </span>
  );
}

// ─────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────
export default function Index() {
  const { shop, stats, orders, products, preOrders } = useLoaderData();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("preorders");

  const ordersApproved = orders.length > 0;

  const statCards = [
    { title: "Active Pre-Orders", value: stats.activePreOrders },
    { title: "Total Revenue",     value: `$${stats.totalRevenue.toFixed(2)}` },
    { title: "Pending Orders",    value: stats.pendingOrders },
    { title: "Completed",         value: stats.completedOrders },
  ];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.pageHeader}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1 style={s.title}>Pre-Order Dashboard</h1>
          <span style={s.shopBadge}>{shop}</span>
        </div>
        <div style={s.headerActions}>
          <button style={s.btn} onClick={() => navigate("/app/orders")}>View All Orders</button>
          {/* <button style={s.btnPrimary} onClick={() => navigate("/app/settings")}>Settings</button> */}
        </div>
      </div>

      {/* Warning Banner — shown only when orders are not approved */}
      {!ordersApproved && (
        <div style={s.warningBanner}>
          ⚠️ <span>
            <strong>Shopify Orders access pending.</strong> Request{" "}
            <a
              href="https://partners.shopify.com"
              target="_blank"
              rel="noreferrer"
              style={{ color: "#92400e", fontWeight: "600" }}
            >
              Protected Customer Data access
            </a>{" "}
            in your Partner Dashboard to enable the Shopify Orders tab.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div style={s.grid4}>
        {statCards.map((stat, i) => (
          <div key={i} style={s.statCard}>
            <div style={s.statLabel}>{stat.title}</div>
            <span style={s.statValue}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div style={s.layout}>

        {/* Left — Tabbed Data */}
        <div style={s.card}>
          <div style={s.tabs}>
            {[["preorders", "Pre-Orders"], ["orders", "Shopify Orders"], ["products", "Products"]].map(([key, label]) => (
              <button key={key} style={tab(activeTab === key)} onClick={() => setActiveTab(key)}>{label}</button>
            ))}
          </div>

          {/* Pre-Orders */}
          {activeTab === "preorders" && (
            preOrders.length > 0 ? (
              <table style={s.table}>
                <thead>
                  <tr>{["Product", "Customer", "Amount", "Status", "Date"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {preOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={s.td}>{o.productTitle}</td>
                      <td style={s.td}>{o.customerEmail}</td>
                      <td style={s.td}>${(o.amount ?? 0).toFixed(2)}</td>
                      <td style={s.td}><Badge status={o.status} /></td>
                      <td style={s.td}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={s.empty}>No pre-orders found for {shop}</p>
          )}

          {/* Shopify Orders */}
          {activeTab === "orders" && (
            ordersApproved ? (
              <table style={s.table}>
                <thead>
                  <tr>{["Order", "Customer", "Items", "Amount", "Payment", "Fulfillment"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td style={s.td}>{o.name}</td>
                      <td style={s.td}>{o.customer}</td>
                      <td style={{ ...s.td, maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.products}</td>
                      <td style={s.td}>{o.amount}</td>
                      <td style={s.td}><Badge status={o.financialStatus} /></td>
                      <td style={s.td}><Badge status={o.fulfillmentStatus} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 20px" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
                <p style={{ fontWeight: "600", marginBottom: "8px", color: "#374151" }}>Orders Access Not Approved</p>
                <p style={{ ...s.empty, padding: "0 0 16px" }}>
                  Shopify requires Protected Customer Data approval to view orders.
                </p>
                <a
                  href="https://partners.shopify.com"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-block",
                    padding: "8px 20px",
                    background: "#6366f1",
                    color: "#fff",
                    borderRadius: "6px",
                    textDecoration: "none",
                    fontSize: "14px",
                  }}
                >
                  Request Access in Partner Dashboard →
                </a>
              </div>
            )
          )}

          {/* Products */}
          {activeTab === "products" && (
            products.length > 0 ? (
              <table style={s.table}>
                <thead>
                  <tr>{["Product", "Price", "Inventory", "Status"].map(h => <th key={h} style={s.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id}>
                      <td style={s.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {p.image && <img src={p.image} alt={p.title} style={{ width: "36px", height: "36px", objectFit: "cover", borderRadius: "6px" }} />}
                          <span>{p.title}</span>
                        </div>
                      </td>
                      <td style={s.td}>{p.price}</td>
                      <td style={s.td}>{p.inventory ?? "—"}</td>
                      <td style={s.td}><Badge status={p.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p style={s.empty}>No active products found</p>
          )}
        </div>

        {/* Sidebar */}
        <div>
          <div style={s.card}>
            <h3 style={s.cardTitle}>Connected Shop</h3>
            <p style={s.metaLabel}>Domain</p>
            <p style={s.metaValue}>{shop}</p>
            <p style={s.metaLabel}>Products loaded</p>
            <p style={s.metaValue}>{products.length}</p>
            <p style={s.metaLabel}>Orders loaded</p>
            <p style={{ ...s.metaValue, marginBottom: 0 }}>
              {ordersApproved ? orders.length : "Pending approval"}
            </p>
          </div>

          <div style={s.card}>
            <h3 style={s.cardTitle}>Quick Actions</h3>
            <button style={s.sideBtn} onClick={() => navigate("/app/products")}>Manage Pre-Order Products</button>
            {/* <button style={s.sideBtn} onClick={() => navigate("/app/settings")}>Configure Settings</button>
            <button style={s.sideBtn} onClick={() => navigate("/app/notifications")}>Email Templates</button> */}
          </div>

          {/* <div style={s.card}>
            <h3 style={s.cardTitle}>App Extensions</h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: "0 0 12px" }}>Pre-order button is active on your store</p>
            <button style={s.sideBtn} onClick={() => navigate("/app/extensions")}>Customize Button</button>
          </div> */}
        </div>
      </div>
    </div>
  );
}