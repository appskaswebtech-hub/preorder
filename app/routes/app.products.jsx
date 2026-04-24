import { useLoaderData, useSubmit, useNavigate } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// ─── Loader: fetch real products from Shopify ─────────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query getProducts($first: Int!) {
      products(first: $first) {
        edges {
          node {
            id
            title
            featuredImage {
              url
              altText
            }
            totalInventory
            status
            preOrderEnabled: metafield(namespace: "preorder", key: "enabled") {
              value
            }
            preOrderDate: metafield(namespace: "preorder", key: "available_date") {
              value
            }
            preOrderLimit: metafield(namespace: "preorder", key: "limit") {
              value
            }
          }
        }
      }
    }
  `, { variables: { first: 50 } });

  const data = await response.json();
  const edges = data?.data?.products?.edges ?? [];

  const products = edges.map(({ node }) => ({
    id: node.id,
    title: node.title,
    image: node.featuredImage?.url ?? null,
    imageAlt: node.featuredImage?.altText ?? node.title,
    stock: node.totalInventory ?? 0,
    status: node.status,
    preOrderEnabled: node.preOrderEnabled?.value === "true",
    availableDate: node.preOrderDate?.value ?? null,
    preOrderLimit: node.preOrderLimit?.value ?? null,
  }));

  return { products };
};

// ─── Helper: fetch all variant IDs for a product ─────────────────────────────
async function fetchVariantIds(admin, productId) {
  const res = await admin.graphql(`
    #graphql
    query getVariants($id: ID!) {
      product(id: $id) {
        variants(first: 100) {
          edges {
            node { id }
          }
        }
      }
    }
  `, { variables: { id: productId } });

  const data = await res.json();
  return data?.data?.product?.variants?.edges?.map((e) => e.node.id) ?? [];
}

// ─── Helper: bulk-update inventory policy on all variants ────────────────────
async function setInventoryPolicy(admin, productId, policy) {
  const variantIds = await fetchVariantIds(admin, productId);
  if (variantIds.length === 0) return;

  await admin.graphql(`
    #graphql
    mutation bulkUpdateVariants($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          inventoryPolicy
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      productId,
      variants: variantIds.map((id) => ({ id, inventoryPolicy: policy })),
    },
  });
}

// ─── Action: update pre-order metafields + inventory policy ──────────────────
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");
  const productId = formData.get("productId");

  if (intent === "enable") {
    const availableDate = formData.get("availableDate");
    const preOrderLimit = formData.get("preOrderLimit");

    // 1. Set pre-order metafields
    await admin.graphql(`
      #graphql
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { key value }
          userErrors { field message }
        }
      }
    `, {
      variables: {
        metafields: [
          { ownerId: productId, namespace: "preorder", key: "enabled",        value: "true",         type: "single_line_text_field" },
          { ownerId: productId, namespace: "preorder", key: "available_date", value: availableDate,   type: "single_line_text_field" },
          { ownerId: productId, namespace: "preorder", key: "limit",          value: preOrderLimit,   type: "single_line_text_field" },
        ],
      },
    });

    // 2. Enable "Continue selling when out of stock" on all variants
    await setInventoryPolicy(admin, productId, "CONTINUE");
  }

  if (intent === "disable") {
    // 1. Mark pre-order as disabled in metafields
    await admin.graphql(`
      #graphql
      mutation setMetafields($metafields: [MetafieldsSetInput!]!) {
        metafieldsSet(metafields: $metafields) {
          metafields { key value }
          userErrors { field message }
        }
      }
    `, {
      variables: {
        metafields: [
          { ownerId: productId, namespace: "preorder", key: "enabled", value: "false", type: "single_line_text_field" },
        ],
      },
    });

    // 2. Revert "Continue selling when out of stock" → back to DENY (default)
    await setInventoryPolicy(admin, productId, "DENY");
  }

  return { success: true };
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f6f8",
    minHeight: "100vh",
    paddingBottom: "40px",
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
  headerLeft: { display: "flex", alignItems: "center", gap: "16px" },
  backBtn: {
    background: "none",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    padding: "6px 14px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#374151",
  },
  title: { fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 },
  body: { maxWidth: "1000px", margin: "28px auto", padding: "0 24px" },
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e4e6ea",
    overflow: "hidden",
    boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
  },
  listItem: (hover) => ({
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "18px 20px",
    borderBottom: "1px solid #f3f4f6",
    background: hover ? "#f9fafb" : "#fff",
    transition: "background 0.1s",
  }),
  thumb: {
    width: "52px",
    height: "52px",
    borderRadius: "8px",
    objectFit: "cover",
    border: "1px solid #e4e6ea",
    flexShrink: 0,
    background: "#f3f4f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#9ca3af",
    fontSize: "20px",
  },
  info: { flex: 1, minWidth: 0 },
  productTitle: { fontWeight: "700", fontSize: "14px", color: "#111827", marginBottom: "4px" },
  meta: { display: "flex", gap: "20px", flexWrap: "wrap", marginTop: "4px" },
  metaItem: { fontSize: "12px", color: "#6b7280" },
  metaVal: { fontWeight: "600", color: "#374151" },
  badge: (on) => ({
    display: "inline-block",
    padding: "2px 10px",
    borderRadius: "12px",
    background: on ? "#d1fae5" : "#f3f4f6",
    color: on ? "#065f46" : "#6b7280",
    fontSize: "11px",
    fontWeight: "600",
    marginLeft: "8px",
  }),
  actions: { display: "flex", gap: "8px", flexShrink: 0 },
  btnEnable: {
    padding: "7px 14px",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  btnDisable: {
    padding: "7px 14px",
    borderRadius: "8px",
    border: "1px solid #fca5a5",
    background: "#fff",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },
  emptyState: {
    padding: "48px 20px",
    textAlign: "center",
    color: "#9ca3af",
    fontSize: "14px",
  },
  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.35)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  modal: {
    background: "#fff",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "460px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
    overflow: "hidden",
  },
  modalHeader: {
    padding: "20px 24px 16px",
    borderBottom: "1px solid #e4e6ea",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: { fontSize: "16px", fontWeight: "700", color: "#111827", margin: 0 },
  closeBtn: {
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#6b7280",
    lineHeight: 1,
    padding: "2px",
  },
  modalBody: { padding: "20px 24px" },
  modalFooter: {
    padding: "16px 24px",
    borderTop: "1px solid #e4e6ea",
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
  },
  label: { display: "block", fontSize: "12px", fontWeight: "600", color: "#374151", marginBottom: "6px" },
  input: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
  },
  helpText: { fontSize: "11px", color: "#9ca3af", marginTop: "4px" },
  fieldGroup: { marginBottom: "16px" },
  cancelBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    background: "#fff",
    color: "#374151",
    fontSize: "13px",
    fontWeight: "500",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "8px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
  },
  infoBox: {
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "12px",
    color: "#1e40af",
    marginBottom: "18px",
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
  },
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function Products() {
  const { products } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();

  const [hoveredRow, setHoveredRow] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [availableDate, setAvailableDate] = useState("");
  const [preOrderLimit, setPreOrderLimit] = useState("100");

  const openEnableModal = (product) => {
    setModalProduct(product);
    setAvailableDate(product.availableDate ?? "");
    setPreOrderLimit(product.preOrderLimit ?? "100");
  };

  const closeModal = () => setModalProduct(null);

  const handleEnable = () => {
    const fd = new FormData();
    fd.append("intent", "enable");
    fd.append("productId", modalProduct.id);
    fd.append("availableDate", availableDate);
    fd.append("preOrderLimit", preOrderLimit);
    submit(fd, { method: "post" });
    closeModal();
  };

  const handleDisable = (productId) => {
    const fd = new FormData();
    fd.append("intent", "disable");
    fd.append("productId", productId);
    submit(fd, { method: "post" });
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={() => navigate("/app")}>
            ← Dashboard
          </button>
          <h1 style={s.title}>Pre-Order Products</h1>
        </div>
        <span style={{ fontSize: "13px", color: "#6b7280" }}>
          {products.length} product{products.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          {products.length === 0 ? (
            <div style={s.emptyState}>No products found in your store.</div>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                style={s.listItem(hoveredRow === product.id)}
                onMouseEnter={() => setHoveredRow(product.id)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Thumbnail */}
                {product.image ? (
                  <img src={product.image} alt={product.imageAlt} style={{ ...s.thumb, display: "block" }} />
                ) : (
                  <div style={s.thumb}>🖼</div>
                )}

                {/* Info */}
                <div style={s.info}>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <span style={s.productTitle}>{product.title}</span>
                    <span style={s.badge(product.preOrderEnabled)}>
                      {product.preOrderEnabled ? "Pre-Order Active" : "Not Active"}
                    </span>
                  </div>

                  <div style={s.meta}>
                    <span style={s.metaItem}>
                      Stock: <span style={s.metaVal}>{product.stock} units</span>
                    </span>
                    {product.preOrderEnabled && (
                      <>
                        <span style={s.metaItem}>
                          Available: <span style={s.metaVal}>{formatDate(product.availableDate)}</span>
                        </span>
                        <span style={s.metaItem}>
                          Limit: <span style={s.metaVal}>{product.preOrderLimit ?? "—"} units</span>
                        </span>
                        <span style={s.metaItem}>
                          Oversell: <span style={{ ...s.metaVal, color: "#059669" }}>✓ Enabled</span>
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={s.actions}>
                  {product.preOrderEnabled ? (
                    <>
                      <button style={s.btnEnable} onClick={() => openEnableModal(product)}>
                        Edit
                      </button>
                      <button style={s.btnDisable} onClick={() => handleDisable(product.id)}>
                        Disable
                      </button>
                    </>
                  ) : (
                    <button style={s.btnEnable} onClick={() => openEnableModal(product)}>
                      Enable Pre-Order
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {modalProduct && (
        <div style={s.overlay} onClick={closeModal}>
          <div style={s.modal} onClick={(e) => e.stopPropagation()}>
            <div style={s.modalHeader}>
              <h2 style={s.modalTitle}>
                {modalProduct.preOrderEnabled ? "Edit" : "Enable"} Pre-Order
              </h2>
              <button style={s.closeBtn} onClick={closeModal}>×</button>
            </div>

            <div style={s.modalBody}>
              <p style={{ fontSize: "13px", color: "#6b7280", marginTop: 0, marginBottom: "14px" }}>
                Configuring pre-order for <strong style={{ color: "#111827" }}>{modalProduct.title}</strong>
              </p>

              {/* Info notice */}
              <div style={s.infoBox}>
                <span>ℹ️</span>
                <span>
                  Enabling pre-order will automatically turn on <strong>"Continue selling when out of stock"</strong> for all variants.
                  Disabling pre-order will revert this setting.
                </span>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Pre-Order Limit</label>
                <input
                  style={s.input}
                  type="number"
                  min="1"
                  value={preOrderLimit}
                  onChange={(e) => setPreOrderLimit(e.target.value)}
                  placeholder="e.g. 100"
                />
                <p style={s.helpText}>Maximum number of pre-orders accepted (0 = unlimited)</p>
              </div>

              <div style={s.fieldGroup}>
                <label style={s.label}>Expected Availability Date</label>
                <input
                  style={s.input}
                  type="date"
                  value={availableDate}
                  onChange={(e) => setAvailableDate(e.target.value)}
                />
                <p style={s.helpText}>The date when this product will be available to ship</p>
              </div>
            </div>

            <div style={s.modalFooter}>
              <button style={s.cancelBtn} onClick={closeModal}>Cancel</button>
              <button
                style={{ ...s.confirmBtn, opacity: !availableDate ? 0.6 : 1, cursor: !availableDate ? "not-allowed" : "pointer" }}
                onClick={handleEnable}
                disabled={!availableDate}
              >
                {modalProduct.preOrderEnabled ? "Save Changes" : "Enable Pre-Order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}