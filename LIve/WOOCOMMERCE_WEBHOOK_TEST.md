# WooCommerce Webhook Test

## Endpoint
```
POST https://webinar.sianacademy.com/api/webhook/woocommerce
```

## Test with cURL

### Basic Test
```bash
curl -X POST https://webinar.sianacademy.com/api/webhook/woocommerce \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "status": "completed",
    "total": "249000",
    "currency": "IRT",
    "payment_method": "zarinpal",
    "billing": {
      "first_name": "Hossein",
      "last_name": "Abbasi",
      "email": "example@gmail.com",
      "phone": "09121234567"
    }
  }'
```

### Expected Response
```json
{
  "status": "success",
  "message": "Webhook received successfully",
  "order_id": 123
}
```

### Local Testing (if running locally)
```bash
curl -X POST http://localhost:8080/api/webhook/woocommerce \
  -H "Content-Type: application/json" \
  -d '{
    "id": 123,
    "status": "completed",
    "total": "249000",
    "currency": "IRT",
    "payment_method": "zarinpal",
    "billing": {
      "first_name": "Hossein",
      "last_name": "Abbasi",
      "email": "example@gmail.com",
      "phone": "09121234567"
    }
  }'
```

## WooCommerce Configuration

In your WooCommerce admin panel:
1. Go to **WooCommerce → Settings → Advanced → Webhooks**
2. Click **Add webhook**
3. Configure:
   - **Name**: Order Webhook
   - **Status**: Active
   - **Topic**: Order updated (or Order created)
   - **Delivery URL**: `https://webinar.sianacademy.com/api/webhook/woocommerce`
   - **Secret**: (optional, for security)
   - **API Version**: WP REST API Integration v3

## Server Logs

When a webhook is received, you'll see logs like:
```
[WooCommerce Webhook] Received order:
  Order ID: 123
  Status: completed
  Total: 249000 IRT
  Payment Method: zarinpal
  Billing Info:
    Name: Hossein Abbasi
    Email: example@gmail.com
    Phone: 09121234567
```

