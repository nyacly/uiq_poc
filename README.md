# UiQ Community Platform 🌟

A comprehensive community platform designed for the Ugandan community in Queensland, Australia. Connect local businesses, discover events, find services, and build meaningful community connections.

![Next.js](https://img.shields.io/badge/Next.js-15.5.3-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-blue?logo=tailwindcss)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

## ✨ Features

### 🏢 **Business Directory**
- Comprehensive local business listings
- Category-based browsing (restaurants, services, retail, etc.)
- Business profiles with contact information and reviews
- Location-based search with interactive maps
- Business verification and premium listings

### 📅 **Community Events**
- Event discovery and RSVP functionality
- Community calendar with filtering options
- Event categories (cultural, business, social, educational)
- Organizer tools for event management
- Location-based event recommendations

### 🛍️ **Classifieds & Marketplace**
- Buy/sell community marketplace
- Job postings and opportunities
- Housing and accommodation listings
- Services and professional offerings
- Messaging system (database schema ready, frontend UI in development)

### 👥 **User Management**
- User authentication and profiles
- Membership tiers (Free, Plus, Family)
- Business account management
- Community engagement features
- Privacy controls and settings

### 🔔 **Communication**
- Messaging system (database schema implemented, real-time features in development)
- Community announcements
- SMS notifications for verification (Twilio integration)
- Email updates and newsletters (planned)
- Push notifications (planned for mobile apps)

### 💳 **Payments & Subscriptions**
- Stripe payment processing
- Subscription management
- Business premium features
- Secure transaction handling
- Payment history and receipts

## 🏗️ **Tech Stack**

### **Frontend**
- **Next.js 15.5.3** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Hook Form** - Form management
- **Lucide React** - Icon library
- **Mapbox GL** - Interactive maps

### **Backend**
- **Node.js** - Runtime environment
- **Next.js API Routes** - Serverless functions
- **PostgreSQL** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Row-Level Security (RLS)** - Database security

### **Integrations**
- **Stripe** - Payment processing
- **Twilio** - SMS notifications
- **Supabase/PostgreSQL** - Database hosting
- **Vercel** - Deployment and hosting

### **DevOps & CI/CD**
- **GitHub Actions** - Automated CI/CD pipeline
- **Playwright** - End-to-end testing
- **Jest** - Unit testing
- **Lighthouse CI** - Performance monitoring
- **ESLint & Prettier** - Code quality
- **Snyk** - Security scanning

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 20.x or later
- PostgreSQL database
- Git

### **Installation**

1. **Clone the repository**
   ```bash
   git clone https://github.com/nyacly/uiq_poc.git
   cd uiq_poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your environment variables (see [Environment Variables](#-environment-variables) section).

4. **Set up the database and seed sample content**
   ```bash
   npm run db:setup
   ```

   This command pushes the Prisma schema to the local SQLite database and seeds it with rich sample data so the application has
   businesses, events, listings, and announcements to explore straight away.

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   ```
   http://localhost:5000
   ```

> 💡 **Default login credentials**
>
> The seed script provisions ready-to-use accounts so you can explore different user journeys immediately:
> - Admin: `admin@uiq.com` / `changeme123`
> - Business owner: `business1@example.com` / `changeme123`
> - Community member: `member1@example.com` / `changeme123`

## 📝 **Environment Variables**

Create a `.env.local` file based on `.env.example`:

### **Database**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/uiq_community_platform
SQLITE_DATABASE_URL=file:./prisma/dev.db
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=your_password
PGDATABASE=uiq_community_platform
```

### **Authentication**
```env
NEXTAUTH_URL=http://localhost:5000
NEXTAUTH_SECRET=your_secret_key
SESSION_SECRET=your_session_secret
```

### **Payments (Stripe)**
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_public_key
```

### **SMS (Twilio)**
```env
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

`SQLITE_DATABASE_URL` is used exclusively by Prisma for the legacy SQLite workflow. It defaults to `file:./prisma/dev.db` when not
provided so deployments that only configure PostgreSQL will continue to succeed. For detailed setup instructions, see
`SECRETS_DOCUMENTATION.md`.

## 🛠️ **Development**

### **Available Scripts**

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run end-to-end tests
npm run test:all     # Run all tests

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Check TypeScript types

# Database
npm run db:push      # Push schema changes to database
npm run db:studio    # Open database studio
npm run db:generate  # Generate migrations

# Performance
npm run lighthouse   # Run Lighthouse audits
npm run performance  # Run custom performance tests
npm run health-check # Check application health
```

### **Project Structure**

```
├── .github/workflows/     # CI/CD pipelines (ci.yml, deploy.yml)
├── attached_assets/       # Project assets and uploads
├── e2e/                  # End-to-end tests (Playwright)
├── monitoring/           # Prometheus/Grafana configs
├── scripts/              # Utility scripts (health-check, performance)
├── server/               # Server-side utilities (db.ts, storage.ts)
├── shared/               # Shared schema and types (schema.ts)
├── src/
│   ├── app/             # Next.js App Router pages & API routes
│   ├── components/      # React components (organized by feature)
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility libraries (auth, stripe, etc.)
│   ├── styles/          # CSS and styling files
│   └── types/           # TypeScript type definitions
├── drizzle.config.ts    # Database ORM configuration
├── next.config.js       # Next.js configuration
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind CSS configuration
├── vercel.json          # Vercel deployment config
├── LICENSE              # MIT license
└── README.md           # This file
```

## 🚦 **CI/CD Pipeline**

Our automated CI/CD pipeline includes:

### **Continuous Integration**
- ✅ **Code Quality**: ESLint, TypeScript checking
- ✅ **Testing**: Unit tests (Jest), E2E tests (Playwright)
- ✅ **Security**: Vulnerability scanning (Snyk, npm audit)
- ✅ **Performance**: Lighthouse CI monitoring
- ✅ **Build Verification**: Production build testing

### **Continuous Deployment**
- ✅ **Production**: Auto-deploy from `main` branch to Vercel
- ✅ **Preview**: Deploy preview environments for pull requests
- ✅ **Environment Management**: Secure secrets and variables
- ✅ **Monitoring**: Health checks and performance tracking

### **Pipeline Triggers**
- Push to `main` → Production deployment
- Pull requests → Preview deployment
- Manual dispatch → On-demand deployment

## 📊 **Performance & Monitoring**

### **Performance Targets**
- ⚡ **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- 📱 **Mobile Performance**: Lighthouse score > 80
- 🔒 **Security**: Basic security headers implemented
- ♿ **Accessibility**: WCAG 2.1 AA compliance

### **Monitoring Stack**
- **Health Endpoint**: `/api/health` - Application status
- **Lighthouse CI**: Automated performance auditing
- **Custom Metrics**: Performance monitoring scripts
- **Uptime Monitoring**: Health checks and monitoring tools

## 🚀 **Deployment**

### **Vercel Deployment**
The application is configured for seamless deployment on Vercel:

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Environment**: Add environment variables in Vercel dashboard
3. **Deploy**: Automatic deployment on push to main branch

### **Manual Deployment**
```bash
# Using Vercel CLI
npm i -g vercel
vercel --prod
```


## 🔒 **Security**

### **Database Security**
- ✅ Row-Level Security (RLS) policies
- ✅ User data isolation
- ✅ SQL injection prevention
- ✅ Secure connection strings

### **Application Security**
- ✅ HTTPS enforcement
- ✅ Security headers (XSS protection, frame options, content type options)
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Input validation and sanitization

### **API Security**
- ✅ JWT authentication
- ✅ API rate limiting
- ✅ CORS configuration
- ✅ Request validation

## 🤝 **Contributing**

We welcome contributions to the UiQ Community Platform! Please follow these guidelines:

### **Development Workflow**
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Code Standards**
- Follow existing code style and conventions
- Write TypeScript with proper types
- Add tests for new functionality
- Update documentation as needed
- Ensure CI pipeline passes

### **Pull Request Process**
- Provide clear description of changes
- Include screenshots for UI changes
- Ensure all tests pass
- Request review from maintainers
- Address feedback promptly

## 📞 **Support & Community**

### **Getting Help**
- 📖 **Documentation**: Check existing docs and README
- 🐛 **Bug Reports**: Open an issue with reproduction steps
- 💡 **Feature Requests**: Discuss in GitHub Discussions
- 🔧 **Technical Support**: Contact the development team

### **Community Guidelines**
- Be respectful and inclusive
- Help fellow community members
- Share knowledge and experiences
- Report issues constructively
- Celebrate successes together

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🏆 **Acknowledgments**

- **Queensland Ugandan Community** - For inspiration and feedback
- **Open Source Contributors** - For the amazing tools and libraries
- **Development Team** - For dedication and hard work
- **Community Members** - For testing and valuable input

---

**Built with ❤️ for the Ugandan community in Queensland, Australia**

For more information, visit our [GitHub repository](https://github.com/nyacly/uiq_poc) or contact the development team.