# Masturbuddy - Web Application Plan

## Executive Summary

Transform Masturbuddy from CLI tool to sellable SaaS platform with web UI, user accounts, and monetization.

## Architecture Overview

### Tech Stack (2025 Best Practices)

**Frontend:**
- Next.js 15 (App Router) - Full-stack React framework
- React Server Components - Default for performance
- Tailwind CSS - Styling
- shadcn/ui - Component library
- Zustand - State management
- React Query - Data fetching

**Backend:**
- Next.js Server Actions - For mutations (replaces API routes)
- PostgreSQL - Primary database (Supabase hosting)
- Redis - Caching layer (Upstash hosting)
- Prisma ORM - Database access

**Infrastructure:**
- Vercel - Frontend hosting
- Supabase - Database & auth
- Upstash - Redis cache
- Stripe - Payments
- Cloudflare R2 - Image storage

**Authentication:**
- Supabase Auth - User accounts
- JWT tokens - Session management
- Row Level Security (RLS) - Data access control

## Database Schema

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_verified BOOLEAN DEFAULT FALSE,
  is_premium BOOLEAN DEFAULT FALSE,
  subscription_tier VARCHAR(20) DEFAULT 'free', -- free, premium, pro
  subscription_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ
);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  
  -- Masturbuddy learning data
  liked_keywords JSONB DEFAULT '{}'::jsonb,
  disliked_keywords JSONB DEFAULT '{}'::jsonb,
  liked_categories JSONB DEFAULT '{}'::jsonb,
  preferred_image_count JSONB DEFAULT '[10, 30]'::jsonb,
  preferred_features JSONB DEFAULT '{}'::jsonb,
  
  -- Viewing preferences
  default_category VARCHAR(50) DEFAULT 'bikini',
  shuffle_mode BOOLEAN DEFAULT FALSE,
  loop_mode BOOLEAN DEFAULT FALSE,
  random_image_order BOOLEAN DEFAULT FALSE,
  category_only_mode BOOLEAN DEFAULT FALSE,
  skip_low_quality BOOLEAN DEFAULT TRUE,
  min_image_count INTEGER DEFAULT 15,
  
  -- Visual adjustments
  brightness INTEGER DEFAULT 100,
  contrast INTEGER DEFAULT 100,
  
  -- UI preferences
  theme VARCHAR(20) DEFAULT 'dark', -- dark, light, auto
  auto_play BOOLEAN DEFAULT TRUE,
  viewing_time INTEGER DEFAULT 120,
  speed_multiplier DECIMAL(3,2) DEFAULT 1.0,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### favorites
```sql
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gallery_url TEXT NOT NULL,
  gallery_title TEXT,
  category VARCHAR(50),
  image_count INTEGER,
  quality_score DECIMAL(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, gallery_url)
);
```

### viewing_history
```sql
CREATE TABLE viewing_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gallery_url TEXT NOT NULL,
  gallery_title TEXT,
  category VARCHAR(50),
  image_count INTEGER,
  quality_score DECIMAL(5,2),
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  viewing_time_seconds INTEGER,
  user_feedback TEXT,
  user_rating INTEGER CHECK (user_rating >= 1 AND user_rating <= 5)
);

CREATE INDEX idx_viewing_history_user_date ON viewing_history(user_id, viewed_at DESC);
```

### gallery_ratings
```sql
CREATE TABLE gallery_ratings (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gallery_url TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rated_at TIMESTAMPTZ DEFAULT NOW(),
  
  PRIMARY KEY(user_id, gallery_url)
);
```

### subscriptions
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  tier VARCHAR(20) NOT NULL, -- free, premium, pro
  status VARCHAR(20) NOT NULL, -- active, canceled, past_due
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### usage_metrics
```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  galleries_viewed INTEGER DEFAULT 0,
  images_viewed INTEGER DEFAULT 0,
  total_viewing_time_seconds INTEGER DEFAULT 0,
  favorites_added INTEGER DEFAULT 0,
  
  UNIQUE(user_id, metric_date)
);
```

## Project Structure

```
masturbuddy-web/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/             # Dashboard route group
│   │   │   ├── galleries/
│   │   │   │   ├── page.tsx         # Gallery browser
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx     # Gallery viewer
│   │   │   ├── favorites/
│   │   │   │   └── page.tsx
│   │   │   ├── history/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (pricing)/               # Pricing route group
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── api/                     # API routes (if needed)
│   │   │   └── webhooks/
│   │   │       └── stripe/
│   │   │           └── route.ts
│   │   ├── layout.tsx               # Root layout
│   │   └── page.tsx                 # Landing page
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── gallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── GalleryCard.tsx
│   │   │   ├── ImageViewer.tsx
│   │   │   └── QualityIndicator.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── SignupForm.tsx
│   ├── lib/
│   │   ├── db.ts                    # Prisma client
│   │   ├── auth.ts                  # Auth utilities
│   │   ├── redis.ts                 # Redis client
│   │   └── utils.ts                 # Helper functions
│   ├── server/
│   │   ├── actions/                 # Server Actions
│   │   │   ├── auth.ts
│   │   │   ├── galleries.ts
│   │   │   ├── favorites.ts
│   │   │   └── preferences.ts
│   │   └── services/                # Business logic
│   │       ├── gallery-service.ts
│   │       ├── quality-service.ts
│   │       └── learning-service.ts
│   └── styles/
│       └── globals.css
├── prisma/
│   └── schema.prisma                # Prisma schema
├── public/
│   └── images/
├── .env.local
├── next.config.js
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Research architecture
- [ ] Set up Next.js 15 project
- [ ] Configure Prisma with PostgreSQL
- [ ] Set up Supabase database
- [ ] Create database schema
- [ ] Configure Tailwind + shadcn/ui
- [ ] Set up authentication (Supabase Auth)

### Phase 2: Core Features (Week 3-4)
- [ ] Build gallery browsing UI
- [ ] Implement image viewer component
- [ ] Add fullscreen image viewer
- [ ] Implement quality analysis UI
- [ ] Add collaborative learning UI
- [ ] Build favorites system
- [ ] Create history view
- [ ] Add dark mode theme

### Phase 3: Backend Integration (Week 5-6)
- [ ] Implement Server Actions for all mutations
- [ ] Connect to PostgreSQL via Prisma
- [ ] Add Redis caching
- [ ] Implement persistent browser sessions
- [ ] Add error handling & logging
- [ ] Set up monitoring (Sentry)

### Phase 4: Monetization (Week 7-8)
- [ ] Integrate Stripe payments
- [ ] Build pricing page
- [ ] Implement subscription tiers
- [ ] Add usage limits
- [ ] Create upgrade flow
- [ ] Set up webhooks

### Phase 5: Legal & Compliance (Week 9)
- [ ] Add age verification (18+)
- [ ] Create Terms of Service
- [ ] Create Privacy Policy
- [ ] Add cookie consent
- [ ] Implement GDPR compliance
- [ ] Add DMCA takedown process

### Phase 6: Polish & Launch (Week 10)
- [ ] Performance optimization
- [ ] SEO optimization
- [ ] Mobile responsiveness
- [ ] Analytics integration
- [ ] Beta testing
- [ ] Production deployment

## Key Features Implementation

### 1. Gallery Browsing UI
- Grid view with thumbnails
- Filter by category, quality, rating
- Sort by date, quality, popularity
- Infinite scroll or pagination
- Quick preview on hover

### 2. Image Viewer
- Fullscreen lightbox
- Zoom/pan support
- Keyboard navigation
- Quality indicator overlay
- Masturbuddy's thoughts display
- Natural language feedback input

### 3. Collaborative Learning
- Real-time preference updates
- Sentiment analysis on feedback
- Keyword extraction
- Preference visualization
- Learning progress dashboard

### 4. Persistent Sessions
- Resume where you left off
- Cross-device sync
- Session history
- Auto-save preferences

### 5. Dark Mode
- System preference detection
- Manual toggle
- Persisted preference
- Smooth transitions

## Pricing Strategy

### Free Tier
- 50 favorites limit
- Basic quality analysis
- Local preferences only
- No cloud sync
- Watermarked downloads

### Premium ($9.99/mo)
- Unlimited favorites
- Advanced AI quality analysis
- Cloud sync across devices
- Download manager
- No watermarks
- Priority support

### Pro ($19.99/mo)
- All Premium features
- API access
- Advanced analytics
- Custom preferences
- Early access to features
- Dedicated support

## Security Considerations

- Rate limiting (API routes)
- Input validation (Zod schemas)
- SQL injection prevention (Prisma)
- XSS prevention (React Server Components)
- CSRF protection (Next.js built-in)
- Secure file uploads (validation, scanning)
- Encrypted data at rest (Supabase)
- Row Level Security (RLS)

## Performance Optimization

- Image optimization (Next.js Image)
- Code splitting (automatic)
- Server Components (default)
- Redis caching (hot data)
- Database indexing
- CDN for static assets
- Lazy loading images
- Prefetching routes

## Monitoring & Analytics

- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- User analytics (PostHog or Plausible)
- Database monitoring (Supabase)
- Uptime monitoring (Pingdom)

## Deployment

**Frontend:** Vercel
- Automatic deployments from Git
- Edge functions for global performance
- Preview deployments for testing

**Database:** Supabase
- Managed PostgreSQL
- Built-in authentication
- Real-time subscriptions
- Edge functions

**Cache:** Upstash
- Managed Redis
- Global edge caching
- Low latency

**Payments:** Stripe
- Managed payment processing
- Subscription management
- Webhook handling

## Success Metrics

- User acquisition (signups)
- User retention (30-day, 90-day)
- Conversion rate (free to paid)
- Average session duration
- Galleries viewed per session
- Feedback quality (learning effectiveness)
- NPS score
- Churn rate

## Next Steps

1. Initialize Next.js 15 project
2. Set up Prisma with Supabase
3. Create database schema
4. Build authentication system
5. Create basic UI components
6. Implement gallery browsing
7. Add image viewer
8. Integrate collaborative learning
9. Add payment processing
10. Deploy to production

## Estimated Timeline

- **Phase 1-2:** 4 weeks (Foundation + Core Features)
- **Phase 3-4:** 4 weeks (Backend + Monetization)
- **Phase 5-6:** 2 weeks (Legal + Polish)
- **Total:** 10 weeks to MVP launch

## Budget Estimate

- **Development:** $0 (DIY)
- **Hosting (monthly):**
  - Vercel: $20 (Pro plan)
  - Supabase: $25 (Pro plan)
  - Upstash: $10 (Basic plan)
  - Stripe: 2.9% + $0.30 per transaction
- **Total monthly:** ~$55 + transaction fees
- **Year 1:** ~$660 + transaction fees

## Revenue Projection (Conservative)

- 100 free users
- 10 premium users ($9.99/mo = $99.90/mo)
- 5 pro users ($19.99/mo = $99.95/mo)
- **Monthly revenue:** ~$200
- **Annual revenue:** ~$2,400
- **Break-even:** ~3 months

## Risk Mitigation

1. **Legal risk:** Age verification, terms of service, privacy policy
2. **Technical risk:** Use proven stack (Next.js, Supabase), extensive testing
3. **Market risk:** Start with free tier, gather feedback, iterate
4. **Competition risk:** Focus on unique collaborative learning feature
5. **Platform risk:** Don't rely on single platform (use multiple sources)

## Conclusion

Masturbuddy has strong potential as a unique product with its collaborative learning approach. The plan is feasible with current technology and can be executed within 10 weeks. Start with MVP, gather user feedback, and iterate based on data.
