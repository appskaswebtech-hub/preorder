import { useLoaderData, useNavigate } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// ─── Loader: fetch real orders via Shopify GraphQL ───────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query getOrders($first: Int!) {
      orders(first: $first, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFulfillmentStatus
            displayFinancialStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              displayName
              email
            }
            lineItems(first: 5) {
              edges {
                node {
                  title
                  quantity
                }
              }
            }
            metafield(namespace: "preorder", key: "available_date") {
              value
            }
          }
        }
      }
    }
  `, { variables: { first: 50 } });

  const data = await response.json();
  const edges = data?.data?.orders?.edges ?? [];

  const orders = edges.map(({ node }) => {
    const lineItems = node.lineItems.edges.map((e) => e.node);
    const product = lineItems.map((li) => `${li.title} ×${li.quantity}`).join(", ");
    const status =
      node.displayFulfillmentStatus === "FULFILLED" ? "completed" : "pending";

    return {
      id: node.id,
      orderNumber: node.name,
      product,
      customer: {
        name: node.customer?.displayName ?? "Guest",
        email: node.customer?.email ?? "—",
      },
      amount: parseFloat(node.totalPriceSet.shopMoney.amount),
      currency: node.totalPriceSet.shopMoney.currencyCode,
      status,
      createdAt: node.createdAt,
      availableDate: node.metafield?.value ?? null,
      fulfillmentStatus: node.displayFulfillmentStatus,
      financialStatus: node.displayFinancialStatus,
    };
  });

  return { orders };
};

// ─── Styles (inline, no external deps) ───────────────────────────────────────
const styles = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f6f8",
    minHeight: "100vh",
    padding: "0 0 40px 0",
  },
  header: {
    background: "#fff",
    borderBottom: "1px solid #e4e6ea",
    padding: "20px 32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "16px",
    flexWrap: "wrap",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  backBtn: {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#374151",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    transition: "background 0.15s",
  },
  title: {
    fontSize: "20px",
    fontWeight: "700",
    color: "#111827",
    margin: 0,
  },
  exportBtn: {
    background: "#fff",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "7px 16px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#374151",
    fontWeight: "500",
  },
  body: {
    maxWidth: "1100px",
    margin: "28px auto",
    padding: "0 24px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e4e6ea",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  filterBar: {
    padding: "16px 20px",
    borderBottom: "1px solid #e4e6ea",
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  searchInput: {
    flex: "1 1 220px",
    padding: "8px 14px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    outline: "none",
    color: "#111827",
    background: "#f9fafb",
    minWidth: "180px",
  },
  filterGroup: {
    display: "flex",
    gap: "8px",
    flexWrap: "wrap",
  },
  filterChip: (active) => ({
    padding: "6px 14px",
    borderRadius: "20px",
    border: `1px solid ${active ? "#6366f1" : "#d1d5db"}`,
    background: active ? "#eef2ff" : "#fff",
    color: active ? "#4f46e5" : "#374151",
    fontSize: "12px",
    fontWeight: "500",
    cursor: "pointer",
    transition: "all 0.15s",
  }),
  statsRow: {
    padding: "12px 20px",
    borderBottom: "1px solid #e4e6ea",
    display: "flex",
    gap: "24px",
    background: "#fafafa",
  },
  statItem: {
    fontSize: "12px",
    color: "#6b7280",
  },
  statValue: {
    fontWeight: "700",
    color: "#111827",
    marginRight: "4px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  th: {
    padding: "11px 16px",
    textAlign: "left",
    fontSize: "11px",
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: "1px solid #e4e6ea",
    background: "#fafafa",
  },
  tr: (hover) => ({
    borderBottom: "1px solid #f3f4f6",
    background: hover ? "#f9fafb" : "#fff",
    cursor: "pointer",
    transition: "background 0.1s",
  }),
  td: {
    padding: "14px 16px",
    fontSize: "13px",
    color: "#374151",
    verticalAlign: "top",
  },
  orderNum: {
    fontWeight: "700",
    color: "#111827",
    fontSize: "13px",
  },
  product: {
    color: "#4b5563",
    fontSize: "12px",
    marginTop: "2px",
    maxWidth: "200px",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  customerName: {
    fontWeight: "500",
    color: "#111827",
  },
  customerEmail: {
    color: "#9ca3af",
    fontSize: "11px",
  },
  amount: {
    fontWeight: "700",
    color: "#111827",
  },
  badge: (status) => {
    const map = {
      completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
      pending: { bg: "#fef3c7", color: "#92400e", label: "Pending" },
    };
    const s = map[status] ?? map.pending;
    return {
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: "12px",
      background: s.bg,
      color: s.color,
      fontSize: "11px",
      fontWeight: "600",
    };
  },
  actionBtn: {
    padding: "4px 10px",
    border: "1px solid #d1d5db",
    borderRadius: "6px",
    background: "#fff",
    fontSize: "11px",
    cursor: "pointer",
    color: "#374151",
    marginRight: "6px",
    fontWeight: "500",
    transition: "background 0.12s",
  },
  emptyState: {
    padding: "48px 20px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return "—";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatCurrency = (amount, currency = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Orders() {
  const { orders: allOrders } = useLoaderData();
  const navigate = useNavigate();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hoveredRow, setHoveredRow] = useState(null);

  // Filtering
  const filtered = allOrders.filter((order) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      order.orderNumber.toLowerCase().includes(q) ||
      order.product.toLowerCase().includes(q) ||
      order.customer.name.toLowerCase().includes(q) ||
      order.customer.email.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesQuery && matchesStatus;
  });

  const totalPending = allOrders.filter((o) => o.status === "pending").length;
  const totalCompleted = allOrders.filter((o) => o.status === "completed").length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.amount, 0);

  const handleNotify = (e, id) => {
    e.stopPropagation();
    console.log("Notify customer:", id);
    // TODO: call your notification API
  };

  const handleConvert = (e, id) => {
    e.stopPropagation();
    console.log("Convert to order:", id);
    // TODO: call your convert API
  };

  const handleExport = () => {
    const csv = [
      ["Order", "Product", "Customer", "Email", "Amount", "Status", "Order Date", "Available Date"],
      ...filtered.map((o) => [
        o.orderNumber,
        o.product,
        o.customer.name,
        o.customer.email,
        o.amount.toFixed(2),
        o.status,
        formatDate(o.createdAt),
        formatDate(o.availableDate),
      ]),
    ]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pre-orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button style={styles.backBtn} onClick={() => navigate("/app")}>
            ← Dashboard
          </button>
          <h1 style={styles.title}>Pre-Orders</h1>
        </div>
        <button style={styles.exportBtn} onClick={handleExport}>
          ↓ Export CSV
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.card}>
          {/* Filter Bar */}
          <div style={styles.filterBar}>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Search by order, product, customer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div style={styles.filterGroup}>
              {["all", "pending", "completed"].map((s) => (
                <button
                  key={s}
                  style={styles.filterChip(statusFilter === s)}
                  onClick={() => setStatusFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div style={styles.statsRow}>
            <span style={styles.statItem}>
              <span style={styles.statValue}>{allOrders.length}</span>Total
            </span>
            <span style={styles.statItem}>
              <span style={styles.statValue}>{totalPending}</span>Pending
            </span>
            <span style={styles.statItem}>
              <span style={styles.statValue}>{totalCompleted}</span>Completed
            </span>
            <span style={styles.statItem}>
              <span style={styles.statValue}>
                {formatCurrency(totalRevenue)}
              </span>
              Total Revenue
            </span>
            {filtered.length !== allOrders.length && (
              <span style={{ ...styles.statItem, color: "#6366f1" }}>
                <span style={{ ...styles.statValue, color: "#4f46e5" }}>
                  {filtered.length}
                </span>
                Filtered
              </span>
            )}
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              No orders found. Try adjusting your search or filters.
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Order</th>
                  <th style={styles.th}>Customer</th>
                  <th style={styles.th}>Amount</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Order Date</th>
                  <th style={styles.th}>Available / Fulfilled</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    style={styles.tr(hoveredRow === order.id)}
                    onMouseEnter={() => setHoveredRow(order.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    onClick={() => console.log("View order:", order.orderNumber)}
                  >
                    {/* Order # + product */}
                    <td style={styles.td}>
                      <div style={styles.orderNum}>{order.orderNumber}</div>
                      <div style={styles.product} title={order.product}>
                        {order.product}
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={styles.td}>
                      <div style={styles.customerName}>{order.customer.name}</div>
                      <div style={styles.customerEmail}>{order.customer.email}</div>
                    </td>

                    {/* Amount */}
                    <td style={styles.td}>
                      <span style={styles.amount}>
                        {formatCurrency(order.amount, order.currency)}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td style={styles.td}>
                      <span style={styles.badge(order.status)}>
                        {order.status === "completed" ? "Completed" : "Pending"}
                      </span>
                    </td>

                    {/* Order Date */}
                    <td style={styles.td}>{formatDate(order.createdAt)}</td>

                    {/* Available / Fulfilled */}
                    <td style={styles.td}>
                      {order.status === "completed"
                        ? formatDate(order.createdAt) // use fulfillment date if you store it
                        : order.availableDate
                        ? formatDate(order.availableDate)
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td style={styles.td}>
                      {order.status === "pending" && (
                        <>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => handleNotify(e, order.id)}
                          >
                            Notify
                          </button>
                          <button
                            style={styles.actionBtn}
                            onClick={(e) => handleConvert(e, order.id)}
                          >
                            Convert
                          </button>
                        </>
                      )}
                      {order.status === "completed" && (
                        <span style={{ color: "#9ca3af", fontSize: "11px" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}