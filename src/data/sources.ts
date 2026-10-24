import type { SourceFile } from "@/lib/types";

const source = (
  path: string,
  description: string,
  code: string,
  language: SourceFile["language"] = "typescript",
): SourceFile => ({ path, description, code, language });

export const sources = {
  validation: source(
    "lib/validation.ts",
    "Checks cart quantities and product IDs before checkout.",
    `import { z } from 'zod';

export const cartSchema = z.object({
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1).max(99)
  })).min(1)
});

// Prices come from the database, never the browser.
export type Cart = z.infer<typeof cartSchema>;`,
  ),
  apiClient: source(
    "lib/api-client.ts",
    "Sends JSON requests and reports failed responses.",
    `export const apiClient = {
  async post(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error('The request could not be completed');
    }
    return response.json();
  }
};`,
  ),
  cart: source(
    "hooks/use-cart.ts",
    "Shares cart items with storefront components.",
    `'use client';

import { useContext } from 'react';
import { CartContext } from '@/components/cart-provider';

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error('useCart requires CartProvider');
  }
  return cart;
}`,
  ),
  emailTemplate: source(
    "emails/order-receipt.tsx",
    "Renders the customer's confirmed order as an email.",
    `import { Html, Body, Heading, Text } from '@react-email/components';

export function OrderReceipt({ order }: { order: Order }) {
  return (
    <Html>
      <Body>
        <Heading>Your order is confirmed.</Heading>
        <Text>Order {order.id} is paid and being prepared.</Text>
        <Text>Thanks for shopping with Acme Commerce.</Text>
      </Body>
    </Html>
  );
}`,
  ),
  jobsClient: source(
    "lib/jobs.ts",
    "Creates the shared client for durable background work.",
    `import { Inngest } from 'inngest';

// Producers send events. Workers pick them up.
export const jobs = new Inngest({
  id: 'acme-commerce'
});`,
  ),
  frontend: source(
    "app/(store)/page.tsx",
    "Loads the storefront and its product collection.",
    `import { ProductGrid } from '@/components/product-grid';
import { getProducts } from '@/lib/api-client';

export default async function StorePage() {
  const products = await getProducts();

  return (
    <main>
      <h1>Find your next favorite.</h1>
      <ProductGrid products={products} />
    </main>
  );
}`,
  ),
  checkout: source(
    "app/(store)/checkout/page.tsx",
    "Starts a checkout from the customer's cart.",
    `'use client';

import { useCart } from '@/hooks/use-cart';
import { apiClient } from '@/lib/api-client';

export default function CheckoutPage() {
  const { items } = useCart();

  async function checkout() {
    const { url } = await apiClient.post(
      '/api/checkout', { items }
    );
    window.location.assign(url);
  }

  return <button onClick={checkout}>Checkout</button>;
}`,
  ),
  api: source(
    "app/api/checkout/route.ts",
    "Checks the session and cart before starting a payment.",
    `import { auth } from '@/lib/auth';
import { cartSchema } from '@/lib/validation';
import { checkoutService } from '@/services/checkout';

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' },
      { status: 401 });
  }

  const cart = cartSchema.parse(await request.json());
  const checkout = await checkoutService.create(
    session.user.id, cart
  );

  return Response.json({ url: checkout.url });
}`,
  ),
  auth: source(
    "lib/auth.ts",
    "Verifies credentials and creates a signed-in session.",
    `import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';

export const { auth, handlers } = NextAuth({
  providers: [Credentials({
    async authorize(credentials) {
      const user = await db.user.findUnique({
        where: { email: String(credentials.email) }
      });
      if (!user) return null;

      const valid = await verifyPassword(
        String(credentials.password), user.passwordHash
      );
      return valid ? user : null;
    }
  })]
});`,
  ),
  authRoute: source(
    "app/api/auth/[...nextauth]/route.ts",
    "Exposes the login and session handlers.",
    `import { handlers } from '@/lib/auth';

// Auth.js handles sign-in, sign-out, and sessions.
export const { GET, POST } = handlers;`,
  ),
  middleware: source(
    "middleware.ts",
    "Protects account pages before they load.",
    `import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';

export default auth((request) => {
  if (!request.auth) {
    return NextResponse.redirect(
      new URL('/login', request.url)
    );
  }
});

export const config = {
  matcher: ['/account/:path*']
};`,
  ),
  login: source(
    "components/login-form.tsx",
    "Sends credentials and returns the customer to their account.",
    `'use client';

import { signIn } from 'next-auth/react';

export async function submitLogin(form: FormData) {
  return signIn('credentials', {
    email: form.get('email'),
    password: form.get('password'),
    redirectTo: '/account'
  });
}`,
  ),
  database: source(
    "lib/db.ts",
    "Shares one Prisma client across server modules.",
    `import { PrismaClient } from '@prisma/client';

const globalDb = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalDb.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalDb.prisma = db;
}`,
  ),
  order: source(
    "services/orders.ts",
    "Records a successful payment exactly once.",
    `import { db } from '@/lib/db';

export async function confirmOrder(session: CheckoutSession) {
  return db.$transaction(async (tx) => {
    const payment = await tx.payment.upsert({
      where: { providerId: session.id },
      create: {
        providerId: session.id,
        orderId: session.metadata.orderId,
        amount: session.amount_total
      },
      update: {}
    });

    return tx.order.update({
      where: { id: payment.orderId },
      data: { status: 'PAID' }
    });
  });
}`,
  ),
  payments: source(
    "services/checkout.ts",
    "Uses server-side product prices to create a Stripe checkout.",
    `import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';

export const checkoutService = {
  async create(userId: string, cart: Cart) {
    const order = await db.order.create({
      data: await buildOrderFromProducts(userId, cart)
    });

    return stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: toStripeItems(order.items),
      metadata: { orderId: order.id },
      success_url: '/account/orders?success=true',
      cancel_url: '/checkout'
    });
  }
};`,
  ),
  webhook: source(
    "app/api/webhooks/stripe/route.ts",
    "Verifies the payment event and emits an order job.",
    `import { stripe } from '@/lib/stripe';
import { jobs } from '@/lib/jobs';

export async function POST(request: Request) {
  const event = stripe.webhooks.constructEvent(
    await request.text(),
    request.headers.get('stripe-signature')!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'checkout.session.completed') {
    await jobs.send({
      name: 'order/payment-confirmed',
      data: { session: event.data.object }
    });
  }

  return Response.json({ received: true });
}`,
  ),
  jobs: source(
    "jobs/process-order.ts",
    "Confirms the order, then sends a receipt with retryable steps.",
    `import { jobs } from '@/lib/jobs';
import { confirmOrder } from '@/services/orders';
import { sendOrderReceipt } from '@/services/notifications';

export const processOrder = jobs.createFunction(
  { id: 'process-order', retries: 3 },
  { event: 'order/payment-confirmed' },
  async ({ event, step }) => {
    const order = await step.run('confirm-order', () =>
      confirmOrder(event.data.session)
    );

    await step.run('send-receipt', () =>
      sendOrderReceipt(order)
    );

    return { orderId: order.id };
  }
);`,
  ),
  notifications: source(
    "services/notifications.ts",
    "Turns an order into a receipt email and sends it through Resend.",
    `import { Resend } from 'resend';
import { OrderReceipt } from '@/emails/order-receipt';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderReceipt(order: Order) {
  return resend.emails.send({
    from: 'Acme <orders@acme.example>',
    to: order.customerEmail,
    subject: 'Your order is confirmed',
    react: OrderReceipt({ order })
  });
}`,
  ),
  schema: source(
    "prisma/schema.prisma",
    "Defines the five entities that make up the store.",
    `model User {
  id           String  @id @default(cuid())
  email        String  @unique
  passwordHash String
  orders       Order[]
}

model Product {
  id    String @id @default(cuid())
  name  String
  price Int
  items OrderItem[]
}

model Order {
  id            String @id @default(cuid())
  userId        String
  user          User @relation(fields: [userId], references: [id])
  customerEmail String
  status        String @default("PENDING")
  items         OrderItem[]
  payment       Payment?
}

model OrderItem {
  id        String @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  unitPrice Int
  order     Order @relation(fields: [orderId], references: [id])
  product   Product @relation(fields: [productId], references: [id])
}

model Payment {
  id         String @id @default(cuid())
  orderId    String @unique
  providerId String @unique
  amount     Int
  order      Order @relation(fields: [orderId], references: [id])
}`,
    "prisma",
  ),
};
