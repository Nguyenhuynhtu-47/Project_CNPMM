# ELMS Deployment Guide

## Requirements

- Node.js 18+
- MongoDB
- Redis, optional but recommended
- Cloudinary account
- SMTP email account
- VNPAY sandbox credentials

## Backend Setup

```bash
cd Backend
npm install
```

Create or update `.env`:

```env
PORT=8080
MONGO_URI=mongodb://localhost:27017/course_manager
JWT_SECRET=replace_me
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=replace_me
REFRESH_TOKEN_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
OTP_TTL_SECONDS=300
ORDER_PAYMENT_TIMEOUT_MINUTES=30
EMAIL_USER=your_email
EMAIL_PASS=your_email_app_password
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_TMN_CODE=your_tmn_code
VNPAY_HASH_SECRET=your_hash_secret
VNPAY_RETURN_URL=http://localhost:8080/api/payments/vnpay-return
API_BASE_URL=http://localhost:8080
```

Seed data:

```bash
npm run seed
```

Run development server:

```bash
npm run dev
```

Backend URLs:

- API: `http://localhost:8080`
- Swagger UI: `http://localhost:8080/api/docs`
- Swagger JSON: `http://localhost:8080/api/docs.json`
- Health: `http://localhost:8080/api/health`

## Frontend Setup

```bash
cd Frontend
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Production Notes

- Use strong JWT and refresh token secrets.
- Put MongoDB and Redis behind private networking.
- Configure CORS with the real frontend domain instead of `*`.
- Store `.env` secrets in the hosting provider secret manager.
- Use HTTPS for frontend, backend, VNPAY return URL, and certificate verification URL.
- Run `npm audit` regularly and review fixes before using `--force`.
- See [OPERATIONS_GUIDE.md](./OPERATIONS_GUIDE.md) for Docker, backup, monitoring, and deployment checklist.
