import { useLoaderData, useSubmit, useNavigate } from "react-router";
import { useState } from "react";
import { authenticate } from "../shopify.server";

// ─── Loader: read settings from shop metafields ───────────────────────────────
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    #graphql
    query getShopSettings {
      shop {
        buttonText: metafield(namespace: "preorder_settings", key: "button_text") { value }
        buttonColor: metafield(namespace: "preorder_settings", key: "button_color") { value }
        showAvailabilityDate: metafield(namespace: "preorder_settings", key: "show_availability_date") { value }
        showCountdown: metafield(namespace: "preorder_settings", key: "show_countdown") { value }
        emailNotifications: metafield(namespace: "preorder_settings", key: "email_notifications") { value }
        autoConvertToOrder: metafield(namespace: "preorder_settings", key: "auto_convert") { value }
        requireDeposit: metafield(namespace: "preorder_settings", key: "require_deposit") { value }
        depositPercentage: metafield(namespace: "preorder_settings", key: "deposit_percentage") { value }
        customMessage: metafield(namespace: "preorder_settings", key: "custom_message") { value }
      }
    }
  `);

  const data = await response.json();
  const shop = data?.data?.shop ?? {};

  const settings = {
    buttonText:           shop.buttonText?.value           ?? "Pre-Order Now",
    buttonColor:          shop.buttonColor?.value          ?? "#6366f1",
    showAvailabilityDate: shop.showAvailabilityDate?.value !== "false",
    showCountdown:        shop.showCountdown?.value        !== "false",
    emailNotifications:   shop.emailNotifications?.value   !== "false",
    autoConvertToOrder:   shop.autoConvertToOrder?.value   !== "false",
    requireDeposit:       shop.requireDeposit?.value       === "true",
    depositPercentage:    shop.depositPercentage?.value    ?? "25",
    customMessage:        shop.customMessage?.value        ?? "This item is available for pre-order. Expected ship date: {date}",
  };

  return { settings };
};

// ─── Action: save settings to shop metafields ────────────────────────────────
export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();

  const metafields = [
    { key: "button_text",            value: formData.get("buttonText")           ?? "" },
    { key: "button_color",           value: formData.get("buttonColor")          ?? "" },
    { key: "show_availability_date", value: formData.get("showAvailabilityDate") ?? "false" },
    { key: "show_countdown",         value: formData.get("showCountdown")        ?? "false" },
    { key: "email_notifications",    value: formData.get("emailNotifications")   ?? "false" },
    { key: "auto_convert",           value: formData.get("autoConvertToOrder")   ?? "false" },
    { key: "require_deposit",        value: formData.get("requireDeposit")       ?? "false" },
    { key: "deposit_percentage",     value: formData.get("depositPercentage")    ?? "25" },
    { key: "custom_message",         value: formData.get("customMessage")        ?? "" },
  ].map((m) => ({ ...m, namespace: "preorder_settings", type: "single_line_text_field", ownerId: "" }));

  // Get shop GID first
  const shopRes = await admin.graphql(`
    #graphql
    query {
      shop {
        id
      }
    }
  `);
  const shopData = await shopRes.json();
  const shopId = shopData?.data?.shop?.id;

  await admin.graphql(`
    #graphql
    mutation saveSettings($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields { key value }
        userErrors { field message }
      }
    }
  `, {
    variables: {
      metafields: metafields.map((m) => ({ ...m, ownerId: shopId })),
    },
  });

  return { success: true };
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = {
  page: {
    fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    background: "#f5f6f8",
    minHeight: "100vh",
    paddingBottom: "60px",
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
    position: "sticky",
    top: 0,
    zIndex: 10,
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
    textDecoration: "none",
  },
  title: { fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 },
  saveBtn: (saving) => ({
    padding: "8px 20px",
    borderRadius: "8px",
    border: "none",
    background: saving ? "#a5b4fc" : "#4f46e5",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "600",
    cursor: saving ? "not-allowed" : "pointer",
    transition: "background 0.15s",
  }),
  body: { maxWidth: "720px", margin: "28px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "20px" },
  banner: {
    padding: "12px 16px",
    borderRadius: "10px",
    background: "#d1fae5",
    border: "1px solid #6ee7b7",
    color: "#065f46",
    fontSize: "13px",
    fontWeight: "500",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dismissBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#065f46",
    fontSize: "16px",
    lineHeight: 1,
    padding: "0 4px",
  },
  card: {
    background: "#fff",
    borderRadius: "12px",
    border: "1px solid #e4e6ea",
    padding: "24px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
  },
  cardTitle: { fontSize: "15px", fontWeight: "700", color: "#111827", margin: "0 0 18px 0" },
  divider: { border: "none", borderTop: "1px solid #f3f4f6", margin: "16px 0" },
  fieldGroup: { marginBottom: "16px" },
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
  textarea: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    boxSizing: "border-box",
    background: "#f9fafb",
    resize: "vertical",
    minHeight: "80px",
    fontFamily: "inherit",
  },
  helpText: { fontSize: "11px", color: "#9ca3af", marginTop: "5px" },
  selectWrap: { position: "relative" },
  select: {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    background: "#f9fafb",
    appearance: "none",
    cursor: "pointer",
  },
  previewBox: {
    padding: "16px",
    background: "#f9fafb",
    borderRadius: "8px",
    border: "1px solid #e5e7eb",
    marginTop: "4px",
  },
  previewLabel: { fontSize: "11px", fontWeight: "600", color: "#9ca3af", marginBottom: "10px" },
  checkRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
    marginBottom: "14px",
  },
  checkbox: {
    width: "16px",
    height: "16px",
    marginTop: "2px",
    accentColor: "#4f46e5",
    cursor: "pointer",
    flexShrink: 0,
  },
  checkLabel: { fontSize: "13px", color: "#374151", cursor: "pointer" },
  checkHelp: { fontSize: "11px", color: "#9ca3af", marginTop: "2px" },
  inputWithSuffix: {
    display: "flex",
    alignItems: "center",
    border: "1px solid #d1d5db",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#f9fafb",
  },
  suffixInput: {
    flex: 1,
    padding: "9px 12px",
    border: "none",
    fontSize: "13px",
    color: "#111827",
    outline: "none",
    background: "transparent",
  },
  suffix: {
    padding: "9px 12px",
    background: "#f3f4f6",
    borderLeft: "1px solid #d1d5db",
    fontSize: "13px",
    color: "#6b7280",
    fontWeight: "600",
  },
};

const colorOptions = [
  { label: "Indigo",  value: "#6366f1" },
  { label: "Green",   value: "#10b981" },
  { label: "Blue",    value: "#3b82f6" },
  { label: "Purple",  value: "#8b5cf6" },
  { label: "Orange",  value: "#f59e0b" },
  { label: "Red",     value: "#ef4444" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function Settings() {
  const { settings: init } = useLoaderData();
  const submit = useSubmit();
  const navigate = useNavigate();          // ✅ useNavigate (not useNavigation)

  const [saving, setSaving]                               = useState(false);
  const [saved, setSaved]                                 = useState(false);
  const [buttonText, setButtonText]                       = useState(init.buttonText);
  const [buttonColor, setButtonColor]                     = useState(init.buttonColor);
  const [showAvailabilityDate, setShowAvailabilityDate]   = useState(init.showAvailabilityDate);
  const [showCountdown, setShowCountdown]                 = useState(init.showCountdown);
  const [emailNotifications, setEmailNotifications]       = useState(init.emailNotifications);
  const [autoConvertToOrder, setAutoConvertToOrder]       = useState(init.autoConvertToOrder);
  const [requireDeposit, setRequireDeposit]               = useState(init.requireDeposit);
  const [depositPercentage, setDepositPercentage]         = useState(init.depositPercentage);
  const [customMessage, setCustomMessage]                 = useState(init.customMessage);

  const handleSave = () => {
    setSaving(true);
    const fd = new FormData();
    fd.append("buttonText",           buttonText);
    fd.append("buttonColor",          buttonColor);
    fd.append("showAvailabilityDate", showAvailabilityDate.toString());
    fd.append("showCountdown",        showCountdown.toString());
    fd.append("emailNotifications",   emailNotifications.toString());
    fd.append("autoConvertToOrder",   autoConvertToOrder.toString());
    fd.append("requireDeposit",       requireDeposit.toString());
    fd.append("depositPercentage",    depositPercentage);
    fd.append("customMessage",        customMessage);
    submit(fd, { method: "post" });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSaving(false);
    }, 3000);
  };

  return (
    <div style={s.page}>
      {/* Sticky Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          {/* ✅ useNavigate-powered back button — no full page reload */}
          <button style={s.backBtn} onClick={() => navigate("/app")}>
            ← Dashboard
          </button>
          <h1 style={s.title}>Pre-Order Settings</h1>
        </div>
        <button style={s.saveBtn(saving)} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div style={s.body}>
        {/* Success Banner */}
        {saved && (
          <div style={s.banner}>
            <span>✓ Settings saved successfully!</span>
            <button style={s.dismissBtn} onClick={() => setSaved(false)}>×</button>
          </div>
        )}

        {/* ── Button Appearance ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Button Appearance</h2>

          <div style={s.fieldGroup}>
            <label style={s.label}>Button Text</label>
            <input
              style={s.input}
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              placeholder="Pre-Order Now"
            />
          </div>

          <div style={s.fieldGroup}>
            <label style={s.label}>Button Color</label>
            <div style={s.selectWrap}>
              <select
                style={s.select}
                value={buttonColor}
                onChange={(e) => setButtonColor(e.target.value)}
              >
                {colorOptions.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={s.previewBox}>
            <div style={s.previewLabel}>PREVIEW</div>
            <button
              style={{
                backgroundColor: buttonColor,
                color: "#fff",
                padding: "10px 22px",
                borderRadius: "6px",
                border: "none",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              {buttonText || "Pre-Order Now"}
            </button>
          </div>
        </div>

        {/* ── Display Options ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Display Options</h2>

          <label style={s.checkRow}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={showAvailabilityDate}
              onChange={(e) => setShowAvailabilityDate(e.target.checked)}
            />
            <div>
              <div style={s.checkLabel}>Show availability date on product page</div>
            </div>
          </label>

          <label style={s.checkRow}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={showCountdown}
              onChange={(e) => setShowCountdown(e.target.checked)}
            />
            <div>
              <div style={s.checkLabel}>Show countdown timer</div>
            </div>
          </label>

          <hr style={s.divider} />

          <div style={s.fieldGroup}>
            <label style={s.label}>Custom Message</label>
            <textarea
              style={s.textarea}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p style={s.helpText}>Use <code>{"{date}"}</code> to insert the availability date dynamically</p>
          </div>
        </div>

        {/* ── Order Management ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Order Management</h2>

          <label style={s.checkRow}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
            <div>
              <div style={s.checkLabel}>Send email notifications to customers</div>
              <div style={s.checkHelp}>Notify customers when their pre-order ships</div>
            </div>
          </label>

          <label style={s.checkRow}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={autoConvertToOrder}
              onChange={(e) => setAutoConvertToOrder(e.target.checked)}
            />
            <div>
              <div style={s.checkLabel}>Auto-convert pre-orders to orders when available</div>
              <div style={s.checkHelp}>Automatically create orders when products become available</div>
            </div>
          </label>
        </div>

        {/* ── Payment Options ── */}
        <div style={s.card}>
          <h2 style={s.cardTitle}>Payment Options</h2>

          <label style={s.checkRow}>
            <input
              type="checkbox"
              style={s.checkbox}
              checked={requireDeposit}
              onChange={(e) => setRequireDeposit(e.target.checked)}
            />
            <div>
              <div style={s.checkLabel}>Require deposit for pre-orders</div>
            </div>
          </label>

          {requireDeposit && (
            <div style={{ ...s.fieldGroup, marginTop: "12px" }}>
              <label style={s.label}>Deposit Percentage</label>
              <div style={s.inputWithSuffix}>
                <input
                  style={s.suffixInput}
                  type="number"
                  min="1"
                  max="100"
                  value={depositPercentage}
                  onChange={(e) => setDepositPercentage(e.target.value)}
                />
                <span style={s.suffix}>%</span>
              </div>
              <p style={s.helpText}>Percentage of total price required as deposit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}