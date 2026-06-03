# a-to-mind.com API Documentation

## Overview

The a-to-mind.com API provides programmatic access to infrastructure monitoring, usage tracking, and account management features.

## Base URL

```
https://aether-api.atomicmoonbeam88.workers.dev
```

## Authentication

All API requests require a Bearer token in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN
```

## Authentication Endpoints

### Sign Up

Create a new user account.

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "user_id": "user_1234567890",
  "email": "user@example.com",
  "message": "Account created. Please check your email to verify your account."
}
```

### Login

Authenticate with existing credentials.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "base64_encoded_token",
  "user": {
    "id": "user_1234567890",
    "email": "user@example.com",
    "plan": "starter",
    "status": "active"
  }
}
```

### Get User Info

Get current user information.

**Endpoint:** `GET /auth/me`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "id": "user_1234567890",
  "email": "user@example.com",
  "plan": "pro",
  "status": "active"
}
```

### Verify Email

Verify user email address.

**Endpoint:** `GET /auth/verify?token=TOKEN`

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

### Resend Verification

Resend verification email.

**Endpoint:** `POST /auth/resend-verification`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent"
}
```

## Usage Endpoints

### Track Usage

Track API usage and events.

**Endpoint:** `POST /usage/track`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "api_calls": 10,
  "events": 5
}
```

**Response:**
```json
{
  "success": true,
  "today": {
    "api_calls": 10,
    "events": 5
  },
  "limit": 100
}
```

### Get Usage

Get current usage statistics.

**Endpoint:** `GET /usage`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "plan": "pro",
  "today": {
    "api_calls": 45,
    "events": 23
  },
  "month": {
    "api_calls": 1250,
    "events": 680
  },
  "limit": "unlimited"
}
```

## Subscription Endpoints

### Change Plan

Change subscription plan.

**Endpoint:** `POST /subscription/change`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "new_plan": "pro",
  "csrf_token": "csrf_token_value"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Plan changed successfully"
}
```

### Cancel Subscription

Cancel subscription (downgrade to Starter).

**Endpoint:** `POST /subscription/cancel`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "csrf_token": "csrf_token_value"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

## Payment Endpoints

### Initiate Payment (CashApp)

Initiate payment via CashApp.

**Endpoint:** `POST /payments/initiate`

**Request Body:**
```json
{
  "email": "user@example.com",
  "plan": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "payment_id": "pay_1234567890",
  "instructions": "Send $29 to $AtomicWork on CashApp with memo: 'a-to-mind pro plan - pay_1234567890'"
}
```

### Create Stripe Checkout

Create Stripe checkout session.

**Endpoint:** `POST /payments/stripe/create-checkout`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "plan": "pro"
}
```

**Response:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.stripe.com/...",
  "session_id": "cs_1234567890"
}
```

### Verify Payment

Verify payment (admin only).

**Endpoint:** `POST /payments/verify`

**Request Body:**
```json
{
  "payment_id": "pay_1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "status": "completed",
  "user_activated": true
}
```

### Get Payment History

Get user's payment history.

**Endpoint:** `GET /payments/history`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "payments": [
    {
      "id": "pay_1234567890",
      "email": "user@example.com",
      "plan": "pro",
      "amount": 29,
      "status": "completed",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Pending Payments

Get pending payments (admin only).

**Endpoint:** `GET /payments/pending`

**Response:**
```json
{
  "payments": [
    {
      "id": "pay_1234567890",
      "email": "user@example.com",
      "plan": "pro",
      "amount": 29,
      "status": "pending",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

## Support Endpoints

### Create Support Ticket

Submit a support ticket.

**Endpoint:** `POST /support/tickets`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Request Body:**
```json
{
  "subject": "Infrastructure Issue",
  "message": "My server is showing high CPU usage",
  "priority": "high"
}
```

**Response:**
```json
{
  "success": true,
  "ticket_id": "ticket_1234567890",
  "message": "Support ticket created successfully"
}
```

## Admin Endpoints

### Get Revenue Analytics

Get business analytics (admin only).

**Endpoint:** `GET /admin/revenue`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "total_users": 150,
  "active_users": 120,
  "pro_users": 45,
  "enterprise_users": 8,
  "total_revenue": 3450,
  "mrr": 1497,
  "churn_rate": 2.5,
  "ltv": 348,
  "plan_distribution": {
    "starter": 97,
    "pro": 45,
    "enterprise": 8
  },
  "payment_stats": {
    "total": 200,
    "completed": 180,
    "pending": 15,
    "failed": 5
  }
}
```

### Get Invoices

Get invoice list (admin only).

**Endpoint:** `GET /admin/invoices`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "invoices": [
    {
      "invoice_id": "INV-pay_1234567890",
      "payment_id": "pay_1234567890",
      "email": "user@example.com",
      "plan": "pro",
      "amount": 29,
      "date": "2024-01-15T10:30:00Z",
      "status": "completed"
    }
  ]
}
```

### Download Invoice

Download invoice as text file (admin only).

**Endpoint:** `GET /admin/invoice/download?paymentId=pay_1234567890`

**Headers:**
```
Authorization: Bearer YOUR_TOKEN
```

**Response:** Text file with invoice details

## Webhooks

### Stripe Webhook

Handle Stripe payment events.

**Endpoint:** `POST /payments/stripe/webhook`

**Headers:**
```
Stripe-Signature: signature_from_stripe
```

**Events Handled:**
- `checkout.session.completed`: Payment successful
- `invoice.payment_failed`: Payment failed

## Error Codes

- `200`: Success
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limit Exceeded
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Signup**: 5 attempts per hour per email
- **Login**: 10 attempts per 5 minutes per email
- **Usage Tracking**: 1000 requests per minute per user
- **Payment Initiation**: 3 attempts per hour per email

## Security

- All requests use HTTPS
- Tokens are base64 encoded
- CSRF protection on state-changing endpoints
- Rate limiting on all endpoints
- Passwords are hashed using SHA-256

## Support

For API support:
- Submit a support ticket from your dashboard
- Email: support@a-to-mind.com
- Documentation: https://a-to-mind.com/docs

## Changelog

### v1.0.0 (2024-01-15)
- Initial API release
- Authentication endpoints
- Usage tracking
- Subscription management
- Payment processing
- Support system
- Admin analytics

---

For more information, visit https://a-to-mind.com