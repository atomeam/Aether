/**
 * Autonomous Code Generation System
 * Generates complete Next.js applications from product specifications
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AutonomousCodeGenerator {
  constructor() {
    this.generatedProjects = [];
    this.dataPath = path.resolve(__dirname, 'generated-projects.json');
    this.loadGeneratedProjects();
  }

  // Generate complete Next.js application from product spec
  async generateApplication(productSpec) {
    console.log(`🚀 Generating application: ${productSpec.name}`);
    
    const projectId = this.generateProjectId(productSpec.name);
    const projectPath = path.resolve(__dirname, '../../generated-projects', projectId);
    
    // Create project directory
    this.createProjectDirectory(projectPath);
    
    // Generate project structure
    await this.generateProjectStructure(projectPath, productSpec);
    
    // Generate package.json
    this.generatePackageJson(projectPath, productSpec);
    
    // Generate Next.js configuration
    this.generateNextConfig(projectPath, productSpec);
    
    // Generate Tailwind configuration
    this.generateTailwindConfig(projectPath, productSpec);
    
    // Generate Prisma schema
    this.generatePrismaSchema(projectPath, productSpec);
    
    // Generate authentication setup
    this.generateAuthSetup(projectPath, productSpec);
    
    // Generate API routes
    this.generateAPIRoutes(projectPath, productSpec);
    
    // Generate React components
    this.generateComponents(projectPath, productSpec);
    
    // Generate pages
    this.generatePages(projectPath, productSpec);
    
    // Generate payment integration
    this.generatePaymentIntegration(projectPath, productSpec);
    
    // Generate environment variables template
    this.generateEnvTemplate(projectPath, productSpec);
    
    // Generate README
    this.generateReadme(projectPath, productSpec);
    
    // Record generated project
    const projectRecord = {
      id: projectId,
      name: productSpec.name,
      path: projectPath,
      spec: productSpec,
      generatedAt: new Date().toISOString(),
      status: 'generated'
    };
    
    this.generatedProjects.push(projectRecord);
    this.saveGeneratedProjects();
    
    console.log(`✅ Application generated: ${projectPath}`);
    
    return projectRecord;
  }

  // Create project directory
  createProjectDirectory(projectPath) {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Create standard Next.js structure
    const directories = [
      'src/app',
      'src/components',
      'src/lib',
      'src/app/api',
      'src/app/api/auth',
      'src/app/api/users',
      'src/app/api/payments',
      'src/app/dashboard',
      'src/app/pricing',
      'prisma',
      'public'
    ];
    
    directories.forEach(dir => {
      const dirPath = path.join(projectPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  // Generate project structure files
  async generateProjectStructure(projectPath, productSpec) {
    // Generate tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: 'esnext',
        moduleResolution: 'bundler',
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: 'preserve',
        incremental: true,
        plugins: [{ name: 'next' }],
        paths: { '@/*': ['./src/*'] }
      },
      include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
      exclude: ['node_modules']
    };
    
    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
  }

  // Generate package.json
  generatePackageJson(projectPath, productSpec) {
    const packageJson = {
      name: productSpec.name.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      scripts: {
        dev: 'next dev',
        build: 'next build',
        start: 'next start',
        lint: 'next lint',
        'postinstall': 'prisma generate'
      },
      dependencies: {
        next: '14.1.0',
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        '@prisma/client': '^5.10.0',
        '@auth/prisma-adapter': '^2.2.0',
        'next-auth': '^4.24.5',
        stripe: '^14.10.0',
        zustand: '^4.5.0',
        'react-hook-form': '^7.50.0',
        zod: '^3.22.4',
        '@hookform/resolvers': '^3.3.4',
        'clsx': '^2.1.0',
        'tailwind-merge': '^2.2.0',
        'lucide-react': '^0.344.0',
        'class-variance-authority': '^0.7.0'
      },
      devDependencies: {
        typescript: '^5.3.3',
        '@types/node': '^20.11.0',
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        autoprefixer: '^10.4.17',
        postcss: '^8.4.35',
        tailwindcss: '^3.4.1',
        eslint: '^8.56.0',
        'eslint-config-next': '14.1.0',
        prisma: '^5.10.0'
      }
    };
    
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  }

  // Generate Next.js configuration
  generateNextConfig(projectPath, productSpec) {
    const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  experimental: {
    serverActions: true,
  },
};

module.exports = nextConfig;`;
    
    fs.writeFileSync(path.join(projectPath, 'next.config.js'), nextConfig);
  }

  // Generate Tailwind configuration
  generateTailwindConfig(projectPath, productSpec) {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}`;
    
    fs.writeFileSync(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);
    
    // Generate postcss.config.js
    const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
    
    fs.writeFileSync(path.join(projectPath, 'postcss.config.js'), postcssConfig);
  }

  // Generate Prisma schema
  generatePrismaSchema(projectPath, productSpec) {
    const schema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          String    @default("user")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  subscriptions Subscription[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String
  stripeId    String   @unique
  status      String
  plan        String
  createdAt   DateTime @default(now)
  updatedAt   DateTime @updatedAt
  
  user        User     @relation(fields: [userId], references: [id])
}

model ${this.generateModelName(productSpec.name)} {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}`;
    
    fs.writeFileSync(path.join(projectPath, 'prisma/schema.prisma'), schema);
  }

  // Generate model name from product name
  generateModelName(productName) {
    return productName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      + '_item';
  }

  // Generate authentication setup
  generateAuthSetup(projectPath, productSpec) {
    const authConfig = `import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Add your providers here
  ],
})`;
    
    fs.writeFileSync(path.join(projectPath, 'src/lib/auth.ts'), authConfig);
    
    // Generate Prisma client
    const prismaClient = `import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma`;
    
    fs.writeFileSync(path.join(projectPath, 'src/lib/prisma.ts'), prismaClient);
  }

  // Generate API routes
  generateAPIRoutes(projectPath, productSpec) {
    // Generate health check
    const healthCheck = `import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() })
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/api/health/route.ts'), healthCheck);
    
    // Generate user API
    const userAPI = `import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    }
  })
  
  return NextResponse.json(user)
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/api/users/me/route.ts'), userAPI);
  }

  // Generate React components
  generateComponents(projectPath, productSpec) {
    // Generate button component
    const buttonComponent = `import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
            "h-10 py-2 px-4": size === "default",
            "h-9 px-3 rounded-md": size === "sm",
            "h-11 px-8 rounded-md": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }`;
    
    fs.writeFileSync(path.join(projectPath, 'src/components/ui/button.tsx'), buttonComponent);
    
    // Generate card component
    const cardComponent = `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }`;
    
    fs.writeFileSync(path.join(projectPath, 'src/components/ui/card.tsx'), cardComponent);
    
    // Generate utils
    const utils = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/lib/utils.ts'), utils);
  }

  // Generate pages
  generatePages(projectPath, productSpec) {
    // Generate layout
    const layout = `import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "${productSpec.name}",
  description: "${productSpec.description}",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/layout.tsx'), layout);
    
    // Generate page
    const page = `import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            ${productSpec.name}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            ${productSpec.description}
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg">Get Started</Button>
            <Button size="lg" variant="outline">Learn More</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          ${productSpec.features.slice(0, 6).map(feature => `
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">${feature}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Powerful ${feature.toLowerCase()} to help you succeed.
              </p>
            </CardContent>
          </Card>
          `).join('')}
        </div>
      </div>
    </main>
  )
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/page.tsx'), page);
    
    // Generate globals.css
    const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/globals.css'), globalsCss);
  }

  // Generate payment integration
  generatePaymentIntegration(projectPath, productSpec) {
    const stripeConfig = `import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

export const getStripeCustomerId = async (userId: string) => {
  // Implement customer lookup/creation
  return null
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/lib/stripe.ts'), stripeConfig);
    
    // Generate payment API
    const paymentAPI = `import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { priceId } = await req.json()
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: session.user.email,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/dashboard\`,
      cancel_url: \`\${process.env.NEXT_PUBLIC_APP_URL}/pricing\`,
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error) {
    return NextResponse.json({ error: "Payment failed" }, { status: 500 })
  }
}`;
    
    fs.writeFileSync(path.join(projectPath, 'src/app/api/payments/checkout/route.ts'), paymentAPI);
  }

  // Generate environment variables template
  generateEnvTemplate(projectPath, productSpec) {
    const envTemplate = `# Database
DATABASE_URL="postgresql://user:password@localhost:5432/${productSpec.name.toLowerCase().replace(/\s+/g, '_')}"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"`;
    
    fs.writeFileSync(path.join(projectPath, '.env.example'), envTemplate);
  }

  // Generate README
  generateReadme(projectPath, productSpec) {
    const readme = `# ${productSpec.name}

${productSpec.description}

## Features

${productSpec.features.map(f => `- ${f}`).join('\n')}

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account (for payments)

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Set up environment variables:
\`\`\`bash
cp .env.example .env
# Edit .env with your values
\`\`\`

3. Set up the database:
\`\`\`bash
npx prisma generate
npx prisma db push
\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- **Framework**: Next.js 14
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **State**: Zustand
- **Forms**: React Hook Form

## Project Structure

\`\`\`
src/
├── app/              # Next.js app directory
│   ├── api/         # API routes
│   ├── dashboard/   # Dashboard pages
│   └── pricing/     # Pricing pages
├── components/      # React components
│   └── ui/         # UI components
└── lib/            # Utility functions
\`\`\`

## Deployment

This project is designed to be deployed on Vercel.

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy!

## License

MIT

Generated by Autonomous SaaS Builder
`;
    
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
  }

  // Generate project ID
  generateProjectId(productName) {
    return productName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      + `-${Date.now()}`;
  }

  // Load generated projects
  loadGeneratedProjects() {
    if (fs.existsSync(this.dataPath)) {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      this.generatedProjects = JSON.parse(data);
    }
  }

  // Save generated projects
  saveGeneratedProjects() {
    // Keep only last 50 projects
    if (this.generatedProjects.length > 50) {
      this.generatedProjects = this.generatedProjects.slice(-50);
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.generatedProjects, null, 2));
  }

  // Get generated projects
  getGeneratedProjects() {
    return this.generatedProjects;
  }

  // Get project by ID
  getProjectById(id) {
    return this.generatedProjects.find(p => p.id === id);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const generator = new AutonomousCodeGenerator();

  switch (command) {
    case 'generate':
      if (args[1]) {
        const productSpec = JSON.parse(args[1]);
        const project = await generator.generateApplication(productSpec);
        console.log('🚀 Generated Project:');
        console.log(JSON.stringify(project, null, 2));
      } else {
        console.error('Usage: node code-generator.js generate <product-spec-json>');
      }
      break;

    case 'list':
      const projects = generator.getGeneratedProjects();
      console.log('📋 Generated Projects:');
      console.log(JSON.stringify(projects, null, 2));
      break;

    case 'get':
      if (args[1]) {
        const project = generator.getProjectById(args[1]);
        if (project) {
          console.log('📦 Project Details:');
          console.log(JSON.stringify(project, null, 2));
        } else {
          console.error('Project not found');
        }
      } else {
        console.error('Usage: node code-generator.js get <project-id>');
      }
      break;

    default:
      console.log('🚀 Autonomous Code Generation System');
      console.log('');
      console.log('Commands:');
      console.log('  generate - Generate application from product spec');
      console.log('  list     - List all generated projects');
      console.log('  get      - Get project by ID');
      console.log('');
      console.log('Examples:');
      console.log('  node code-generator.js generate \'{"name":"Test App"}\'');
      console.log('  node code-generator.js list');
      console.log('  node code-generator.js get project-123');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  AutonomousCodeGenerator
};
