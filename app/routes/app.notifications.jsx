import React, { useState } from 'react';

const ShopifyEmailTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('order_confirmation');
  const [previewData, setPreviewData] = useState({
    customerName: 'John Doe',
    orderNumber: '#1234',
    orderTotal: '$99.99',
    trackingNumber: 'TRK123456789',
    items: [
      { name: 'Product 1', quantity: 2, price: '$29.99' },
      { name: 'Product 2', quantity: 1, price: '$40.01' }
    ]
  });

  const templates = {
    order_confirmation: {
      name: 'Order Confirmation',
      subject: 'Order Confirmation - {{order_number}}',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Thank You for Your Order!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hi {{customer_name}},</p>
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">We've received your order and we're getting it ready. We'll notify you when it ships.</p>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin: 30px 0; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr style="background-color: #f9f9f9;">
                  <td style="font-weight: bold; color: #333333;">Order Number:</td>
                  <td style="text-align: right; color: #4CAF50; font-weight: bold;">{{order_number}}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold; color: #333333; border-top: 1px solid #e0e0e0;">Order Total:</td>
                  <td style="text-align: right; color: #333333; font-weight: bold; border-top: 1px solid #e0e0e0;">{{order_total}}</td>
                </tr>
              </table>
              
              <!-- Order Items -->
              <h2 style="font-size: 20px; color: #333333; margin: 30px 0 15px;">Order Items</h2>
              <table width="100%" cellpadding="12" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 4px;">
                <thead>
                  <tr style="background-color: #f9f9f9;">
                    <th style="text-align: left; color: #666666; font-size: 14px;">Item</th>
                    <th style="text-align: center; color: #666666; font-size: 14px;">Qty</th>
                    <th style="text-align: right; color: #666666; font-size: 14px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {{#each items}}
                  <tr style="border-top: 1px solid #e0e0e0;">
                    <td style="color: #333333;">{{name}}</td>
                    <td style="text-align: center; color: #333333;">{{quantity}}</td>
                    <td style="text-align: right; color: #333333;">{{price}}</td>
                  </tr>
                  {{/each}}
                </tbody>
              </table>
              
              <div style="margin-top: 40px; text-align: center;">
                <a href="{{order_status_url}}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">View Order Status</a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">Questions? Contact us at support@yourstore.com</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">© 2024 Your Store. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    },
    
    shipping_confirmation: {
      name: 'Shipping Confirmation',
      subject: 'Your Order {{order_number}} Has Shipped!',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shipping Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color: #2196F3; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">📦 Your Order is On Its Way!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hi {{customer_name}},</p>
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Great news! Your order has been shipped and is on its way to you.</p>
              
              <table width="100%" cellpadding="15" cellspacing="0" style="margin: 30px 0; background-color: #E3F2FD; border-radius: 4px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 10px; color: #666666; font-size: 14px;">Tracking Number</p>
                    <p style="margin: 0; color: #2196F3; font-size: 24px; font-weight: bold; font-family: monospace;">{{tracking_number}}</p>
                  </td>
                </tr>
              </table>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="{{tracking_url}}" style="display: inline-block; background-color: #2196F3; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Track Your Package</a>
              </div>
              
              <table width="100%" cellpadding="10" cellspacing="0" style="margin: 30px 0; border: 1px solid #e0e0e0; border-radius: 4px;">
                <tr>
                  <td style="color: #666666; font-size: 14px;">Order Number:</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">{{order_number}}</td>
                </tr>
                <tr style="border-top: 1px solid #e0e0e0;">
                  <td style="color: #666666; font-size: 14px;">Estimated Delivery:</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">{{estimated_delivery}}</td>
                </tr>
              </table>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">Questions? Contact us at support@yourstore.com</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">© 2024 Your Store. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    },
    
    order_delivered: {
      name: 'Order Delivered',
      subject: 'Your Order {{order_number}} Has Been Delivered',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Delivered</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color: #4CAF50; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Your Order Has Arrived!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hi {{customer_name}},</p>
              <p style="font-size: 16px; color: #333333; margin: 0 0 30px;">Your order {{order_number}} has been successfully delivered!</p>
              
              <div style="background-color: #E8F5E9; padding: 30px; border-radius: 8px; margin: 30px 0;">
                <p style="font-size: 18px; color: #2E7D32; margin: 0 0 15px; font-weight: bold;">How was your experience?</p>
                <p style="font-size: 14px; color: #666666; margin: 0 0 25px;">We'd love to hear what you think!</p>
                <a href="{{review_url}}" style="display: inline-block; background-color: #4CAF50; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Leave a Review</a>
              </div>
              
              <p style="font-size: 14px; color: #666666; margin: 30px 0 0;">If there's any issue with your order, please contact us immediately.</p>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">Questions? Contact us at support@yourstore.com</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">© 2024 Your Store. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    },
    
    abandoned_cart: {
      name: 'Abandoned Cart',
      subject: 'You Left Something Behind! 🛒',
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Abandoned Cart</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <tr>
            <td style="background-color: #FF9800; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Don't Forget Your Items!</h1>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 30px;">
              <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Hi {{customer_name}},</p>
              <p style="font-size: 16px; color: #333333; margin: 0 0 30px;">You left some great items in your cart. They're still waiting for you!</p>
              
              <h2 style="font-size: 20px; color: #333333; margin: 0 0 15px;">Your Cart Items</h2>
              <table width="100%" cellpadding="12" cellspacing="0" style="border: 1px solid #e0e0e0; border-radius: 4px; margin-bottom: 30px;">
                {{#each items}}
                <tr style="border-top: 1px solid #e0e0e0;">
                  <td style="color: #333333;">{{name}}</td>
                  <td style="text-align: right; color: #333333; font-weight: bold;">{{price}}</td>
                </tr>
                {{/each}}
              </table>
              
              <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #FFF3E0; border-radius: 4px; margin-bottom: 30px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0; color: #E65100; font-size: 18px; font-weight: bold;">🎉 Special Offer: 10% OFF</p>
                    <p style="margin: 10px 0 0; color: #666666; font-size: 14px;">Use code: <strong>COMEBACK10</strong></p>
                  </td>
                </tr>
              </table>
              
              <div style="text-align: center;">
                <a href="{{cart_url}}" style="display: inline-block; background-color: #FF9800; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Complete Your Purchase</a>
              </div>
            </td>
          </tr>
          
          <tr>
            <td style="background-color: #f9f9f9; padding: 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
              <p style="color: #666666; font-size: 14px; margin: 0 0 10px;">Questions? Contact us at support@yourstore.com</p>
              <p style="color: #999999; font-size: 12px; margin: 0;">© 2024 Your Store. All rights reserved.</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `
    }
  };

  const renderPreview = () => {
    let html = templates[selectedTemplate].html;
    
    // Replace placeholders with preview data
    html = html.replace(/\{\{customer_name\}\}/g, previewData.customerName);
    html = html.replace(/\{\{order_number\}\}/g, previewData.orderNumber);
    html = html.replace(/\{\{order_total\}\}/g, previewData.orderTotal);
    html = html.replace(/\{\{tracking_number\}\}/g, previewData.trackingNumber);
    
    // Replace items loop
    const itemsHtml = previewData.items.map(item => `
      <tr style="border-top: 1px solid #e0e0e0;">
        <td style="color: #333333;">${item.name}</td>
        <td style="text-align: center; color: #333333;">${item.quantity}</td>
        <td style="text-align: right; color: #333333;">${item.price}</td>
      </tr>
    `).join('');
    
    html = html.replace(/\{\{#each items\}\}[\s\S]*?\{\{\/each\}\}/g, itemsHtml);
    
    // Replace other placeholders with dummy data
    html = html.replace(/\{\{order_status_url\}\}/g, '#');
    html = html.replace(/\{\{tracking_url\}\}/g, '#');
    html = html.replace(/\{\{estimated_delivery\}\}/g, 'Jan 15, 2024');
    html = html.replace(/\{\{review_url\}\}/g, '#');
    html = html.replace(/\{\{cart_url\}\}/g, '#');
    
    return html;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Template copied to clipboard!');
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>Shopify Email Templates</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '30px' }}>
        {/* Sidebar */}
        <div style={{ borderRight: '1px solid #e0e0e0', paddingRight: '20px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px', color: '#333' }}>Templates</h2>
          {Object.entries(templates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => setSelectedTemplate(key)}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px',
                marginBottom: '10px',
                border: selectedTemplate === key ? '2px solid #4CAF50' : '1px solid #ddd',
                backgroundColor: selectedTemplate === key ? '#f1f8f4' : '#fff',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                fontWeight: selectedTemplate === key ? 'bold' : 'normal',
                color: '#333'
              }}
            >
              {template.name}
            </button>
          ))}
        </div>
        
        {/* Main Content */}
        <div>
          <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
            <h2 style={{ fontSize: '20px', marginBottom: '10px', color: '#333' }}>
              {templates[selectedTemplate].name}
            </h2>
            <p style={{ color: '#666', marginBottom: '15px' }}>
              <strong>Subject:</strong> {templates[selectedTemplate].subject}
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => copyToClipboard(templates[selectedTemplate].html)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4CAF50',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Copy HTML Code
              </button>
              <button
                onClick={() => copyToClipboard(templates[selectedTemplate].subject)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2196F3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Copy Subject Line
              </button>
            </div>
          </div>
          
          {/* Preview */}
          <div style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
            <div style={{ backgroundColor: '#333', color: '#fff', padding: '15px', fontWeight: 'bold' }}>
              Email Preview
            </div>
            <div 
              style={{ 
                padding: '20px', 
                backgroundColor: '#f4f4f4',
                minHeight: '600px',
                overflow: 'auto'
              }}
              dangerouslySetInnerHTML={{ __html: renderPreview() }}
            />
          </div>
          
          {/* Instructions */}
          <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#E3F2FD', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '15px', color: '#1976D2' }}>
              How to Use in Shopify
            </h3>
            <ol style={{ color: '#333', lineHeight: '1.8' }}>
              <li>Go to Shopify Admin → Settings → Notifications</li>
              <li>Select the notification type you want to customize</li>
              <li>Click on the notification name to edit it</li>
              <li>Replace the email body HTML with the template code</li>
              <li>Update the subject line if needed</li>
              <li>Use Shopify's variables (e.g., <code>{'{{customer.name}}'}</code>) for dynamic content</li>
              <li>Send a test email to verify</li>
            </ol>
            
            <h4 style={{ fontSize: '16px', marginTop: '20px', marginBottom: '10px', color: '#1976D2' }}>
              Common Shopify Variables
            </h4>
            <ul style={{ color: '#333', lineHeight: '1.8' }}>
              <li><code>{'{{customer.name}}'}</code> - Customer's name</li>
              <li><code>{'{{order.name}}'}</code> - Order number</li>
              <li><code>{'{{order.total_price}}'}</code> - Order total</li>
              <li><code>{'{{tracking_number}}'}</code> - Shipping tracking number</li>
              <li><code>{'{{tracking_url}}'}</code> - Tracking URL</li>
              <li><code>{'{{order_status_url}}'}</code> - Order status page URL</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopifyEmailTemplates;
