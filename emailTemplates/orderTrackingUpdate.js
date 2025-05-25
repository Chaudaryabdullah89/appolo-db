const orderTrackingUpdate = (data) => {
  const statusColors = {
    processing: '#4B5563',
    in_transit: '#3B82F6',
    out_for_delivery: '#8B5CF6',
    delivered: '#10B981',
    failed: '#EF4444'
  };

  const statusLabels = {
    processing: 'Processing',
    in_transit: 'In Transit',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    failed: 'Failed'
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Order Tracking Update</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            padding: 20px 0;
            background: #f8fafc;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            color: white;
            font-weight: bold;
            margin: 10px 0;
          }
          .tracking-info {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background: #3B82F6;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6B7280;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Order Tracking Update</h1>
          <p>Hello ${data.name},</p>
          <p>Your order #${data.orderNumber} has been updated with new tracking information.</p>
        </div>

        <div class="tracking-info">
          <h2>Tracking Details</h2>
          <p><strong>Courier:</strong> ${data.courierName}</p>
          <p><strong>Tracking Number:</strong> ${data.trackingNumber}</p>
          <p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>
          <div class="status-badge" style="background: ${statusColors[data.status]}">
            ${statusLabels[data.status]}
          </div>
        </div>

        <div style="text-align: center;">
          <a href="${data.trackingUrl}" class="button">View Order Details</a>
        </div>

        <div class="footer">
          <p>If you have any questions, please contact our support team.</p>
          <p>Thank you for shopping with us!</p>
        </div>
      </body>
    </html>
  `;
};

module.exports = orderTrackingUpdate; 