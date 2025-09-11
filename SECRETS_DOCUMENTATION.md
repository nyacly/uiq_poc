# Secrets and Environment Variables Documentation

## Required Secrets for CI/CD Pipeline

### GitHub Actions Secrets
Set these in your GitHub repository settings under Settings > Secrets and variables > Actions:

#### Vercel Deployment
```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id  
VERCEL_PROJECT_ID=your_vercel_project_id
```

#### Security Scanning
```
SNYK_TOKEN=your_snyk_token
LHCI_GITHUB_APP_TOKEN=your_lighthouse_ci_token
```

#### Application Secrets
```
DATABASE_URL=postgresql://username:password@host:port/database
STRIPE_SECRET_KEY=sk_live_or_test_key
TWILIO_AUTH_TOKEN=your_twilio_auth_token
NEXTAUTH_SECRET=your_nextauth_secret
```

## Environment Setup Instructions

### 1. Development Environment (.env.local)
Copy `.env.example` to `.env.local` and fill in your development values:
```bash
cp .env.example .env.local
```

### 2. Production Environment (Vercel)
Set environment variables in Vercel dashboard:
1. Go to your project dashboard
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable from `.env.example`

### 3. CI/CD Environment
Set secrets in GitHub Actions:
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Click "Secrets and variables" > "Actions"
4. Add repository secrets

## Secret Management Best Practices

### Security Guidelines
- ✅ Never commit `.env` files to git
- ✅ Use different secrets for development/staging/production
- ✅ Rotate secrets regularly (quarterly)
- ✅ Use Replit's built-in secret management when possible
- ✅ Enable 2FA on all third-party services

### Service-Specific Setup

#### Database (PostgreSQL)
```bash
# Replit provides these automatically
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

#### Stripe Payment Processing
1. Create Stripe account at https://stripe.com
2. Get API keys from Dashboard > API keys
3. Set webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
4. Add webhook secret from webhooks page

#### Twilio SMS
1. Create Twilio account at https://twilio.com
2. Get credentials from Console Dashboard
3. Buy a phone number for sending SMS

#### Authentication
1. Generate secure random string for `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

#### Monitoring & Analytics (Optional)
```bash
# Google Analytics
GOOGLE_ANALYTICS_ID=GA-XXXXX-X

# Sentry Error Tracking  
SENTRY_DSN=https://...@sentry.io/...

# Uptime Robot
UPTIME_ROBOT_API_KEY=...
```

## Verification Checklist

### Before Deploying
- [ ] All required secrets set in production environment
- [ ] Database connection tested
- [ ] Stripe webhooks configured and tested
- [ ] SMS notifications working (if enabled)
- [ ] Authentication flow tested
- [ ] Error tracking configured (optional)

### Security Audit
- [ ] No secrets in git history
- [ ] Secrets use strong, unique values
- [ ] Third-party service 2FA enabled
- [ ] Webhook signatures verified
- [ ] HTTPS enforced in production

## Troubleshooting

### Common Issues

#### Database Connection Fails
- Verify `DATABASE_URL` format
- Check network connectivity
- Ensure database exists and user has permissions

#### Stripe Webhooks Not Working
- Verify webhook URL is accessible
- Check `STRIPE_WEBHOOK_SECRET` matches dashboard
- Ensure HTTPS in production

#### SMS Not Sending
- Verify Twilio credentials
- Check phone number format
- Ensure account has sufficient balance

#### Build Fails
- Check all required environment variables are set
- Verify secret syntax (no extra spaces/quotes)
- Check TypeScript compilation

## Support

For issues with:
- **Replit Environment**: Use Replit support or community
- **Vercel Deployment**: Check Vercel documentation
- **Third-party Services**: Consult service-specific documentation
- **Application Code**: Check application logs and error messages