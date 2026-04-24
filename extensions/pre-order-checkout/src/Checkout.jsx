import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect } from 'preact/hooks';

export default function extension() {
  render(<PreOrderExtension />, document.body);
}

function PreOrderExtension() {
  const cartLines = shopify.cartLines.value ?? [];
  const metafields = shopify.appMetafields.value ?? [];
  const canSetMetafields = shopify.instructions.value?.metafields?.canSetCartMetafields;

  // Find pre-order lines — products with preorder.enabled = "true"
  const preorderLines = cartLines.filter((line) => {
    const productId = line.merchandise.product?.id;
    return metafields.some(
      (m) =>
        m.target.type === 'product' &&
        m.target.id === productId &&
        m.metafield.namespace === 'preorder' &&
        m.metafield.key === 'enabled' &&
        m.metafield.value === 'true'
    );
  });

  // Get available date from first pre-order product
  const firstProductId = preorderLines[0]?.merchandise?.product?.id;
  const dateMeta = metafields.find(
    (m) =>
      m.target.type === 'product' &&
      m.target.id === firstProductId &&
      m.metafield.namespace === 'preorder' &&
      m.metafield.key === 'available_date'
  );
  const availableDate = dateMeta?.metafield?.value ?? null;

  // Write cart metafields when pre-order items are present
  useEffect(() => {
    if (!canSetMetafields || preorderLines.length === 0) return;

    shopify.applyMetafieldsChange({
      type: 'updateCartMetafield',
      metafield: {
        namespace: '$app',
        key: 'is_preorder',
        value: 'true',
        type: 'boolean',
      },
    });

    if (availableDate) {
      shopify.applyMetafieldsChange({
        type: 'updateCartMetafield',
        metafield: {
          namespace: '$app',
          key: 'preorder_available_date',
          value: availableDate,
          type: 'single_line_text_field',
        },
      });
    }
  }, [preorderLines.length, availableDate, canSetMetafields]);

  // Don't render if no pre-order items or metafields not supported
  if (!canSetMetafields || preorderLines.length === 0) {
    return null;
  }

  const noticeText = availableDate
    ? shopify.i18n.translate('preOrderNoticeWithDate', { date: availableDate })
    : shopify.i18n.translate('preOrderNoticeNoDate');

  return (
    <s-banner tone="info">
      <s-block-stack spacing="tight">
        <s-text emphasis="bold">
          {shopify.i18n.translate('preOrderNoticeTitle')}
        </s-text>
        <s-text>{noticeText}</s-text>
        <s-text appearance="subdued">
          {shopify.i18n.translate('preOrderCount', { count: preorderLines.length })}
        </s-text>
      </s-block-stack>
    </s-banner>
  );
}