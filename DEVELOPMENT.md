# Development Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
pnpm install
pnpm dev
```

### Available Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run Biome linter
pnpm format       # Format code with Biome
```

---

## 📚 Project Stack

| Technology | Purpose |
|-----------|---------|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI library |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Convex** | Backend API & database |
| **Clerk** | Authentication |
| **NextAuth.js** | Session management |
| **Biome** | Linting & formatting |
| **Sonner** | Toast notifications |

---

## 🎯 Key Features by Module

### Authentication (`app/(features)/auth/`)
- Sign in / Sign up
- Password reset
- Email verification
- Multi-factor authentication ready

### Dashboard (`app/(features)/dashboard/`)
- User overview
- Balance display
- Quick actions
- Transaction summary

### Transactions (`app/(features)/transactions/`)
- **Deposit** - Add funds to account
- **Withdraw** - Request funds withdrawal
- **History** - View all transactions

### Onboarding (`app/(features)/onboarding/`)
- **Joining Process** - Account setup steps
- **Occupation** - User profile information
- **Anti-Fraud** - Verification checks

---

## 📁 Common Import Paths

```typescript
// Absolute imports (preferred)
import { Button } from '@/components/ui/button';
import { Navigation } from '@/components/shared';
import { DepositForm } from '@/components/features';
import { ROUTES, API_MESSAGES } from '@/constants';
import { User, Transaction } from '@/types';
import { formatCurrency, parseDate } from '@/lib/utils';

// Route navigation
import { useRouter } from 'next/navigation';
const router = useRouter();
router.push(ROUTES.DASHBOARD);
```

---

## 🔐 Authentication Flow

```
User → Sign In → Clerk/NextAuth → Session Created → Dashboard
                ↓
         Email Verification (optional)
                ↓
         Set User Profile → Onboarding Routes
```

---

## 💾 Database Schema (Convex)

Key collections:
- **users** - User accounts
- **profiles** - User profile data
- **transactions** - All financial transactions
- **sessions** - Active sessions

See `convex/schema.ts` for full schema.

---

## 🎨 Styling Guide

### Tailwind Configuration
- Custom colors in `tailwind.config.ts`
- Responsive breakpoints: sm, md, lg, xl, 2xl
- Dark mode ready

### CSS Classes
```typescript
// Use Tailwind for styling
<div className="flex flex-col gap-4 md:gap-6 p-4 bg-white rounded-lg shadow">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="text-gray-600">Content</p>
</div>
```

### Custom CSS
Keep global styles in `app/globals.css`. Avoid component-specific CSS files.

---

## ✅ Code Quality Checklist

Before committing:
- [ ] Run `pnpm lint` - No linting errors
- [ ] Run `pnpm format` - Code is formatted
- [ ] Type check - `npx tsc --noEmit`
- [ ] Test locally - App works as expected
- [ ] Import paths - Using `@/` absolute imports
- [ ] Component names - PascalCase
- [ ] No console logs in production code
- [ ] No unused imports
- [ ] Comments for complex logic

---

## 🐛 Debugging Tips

### Enable Debug Mode
```typescript
// In your component
const DEBUG = process.env.NODE_ENV === 'development';
if (DEBUG) console.log('Debug info:', data);
```

### Using React DevTools
1. Install React DevTools browser extension
2. Inspect components in the Components tab
3. View props and state changes in real-time

### Convex Dashboard
- Visit [https://dashboard.convex.dev](https://dashboard.convex.dev)
- Monitor real-time database changes
- View function execution logs

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Import path not found | Use `@/` prefix, check file casing |
| Convex not connecting | Check `.env.local` for `CONVEX_DEPLOYMENT` |
| Styles not applying | Clear `.next/` folder and restart dev server |
| Auth not working | Check Clerk/NextAuth configuration in `.env.local` |

---

## 📝 Commit Message Format

```
feat: Add deposit form component
fix: Resolve transaction history loading bug
docs: Update project structure guide
style: Format transaction components
refactor: Reorganize authentication folder
```

---

## 🔄 Git Workflow

```bash
git checkout -b feature/your-feature
# Make changes
pnpm format
pnpm lint
git add .
git commit -m "feat: Your feature description"
git push origin feature/your-feature
# Create Pull Request
```

---

## 📞 Support

For development questions or issues:
1. Check the `PROJECT_STRUCTURE.md` for organization
2. Review component examples in `/components`
3. Check Convex docs at https://docs.convex.dev
4. Check Next.js docs at https://nextjs.org/docs
