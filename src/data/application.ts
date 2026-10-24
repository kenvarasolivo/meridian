import type {
  CodeComponent,
  CodeRelationship,
  ComponentKind,
  DomainEntity,
} from "@/lib/types";
import { sources } from "./sources";

export const kindMeta: Record<ComponentKind, { label: string; color: string }> =
  {
    frontend: { label: "Interface", color: "#a4b8f1" },
    api: { label: "Application", color: "#75d9ad" },
    auth: { label: "Security", color: "#d3b8ee" },
    database: { label: "Data", color: "#e0bd83" },
    payments: { label: "Integration", color: "#dfb294" },
    notifications: { label: "Integration", color: "#dfb294" },
    jobs: { label: "Worker", color: "#b9bec3" },
  };

export const rootComponents: CodeComponent[] = [
  {
    id: "frontend",
    name: "Frontend",
    description: "Storefront, cart, and checkout.",
    kind: "frontend",
    type: "Client & server",
    technology: "Next.js · React",
    purpose: {
      beginner:
        "Shows products, manages the cart, and lets customers sign in and check out.",
      developer:
        "Next.js App Router storefront. Server Components fetch products; client components manage cart state and invoke typed API endpoints.",
    },
    files: [sources.frontend, sources.checkout, sources.login],
    functions: ["StorePage()", "CheckoutPage()", "submitLogin()"],
    children: ["pages", "components", "hooks", "api-client"],
  },
  {
    id: "api",
    name: "API",
    description: "Request handling and business logic.",
    kind: "api",
    type: "Application",
    technology: "Next.js Route Handlers",
    purpose: {
      beginner:
        "Receives storefront requests, checks access and input, then calls the right service.",
      developer:
        "App Router route handlers coordinate session checks, Zod request validation, and service calls. Business logic lives in services rather than HTTP handlers.",
    },
    files: [sources.api, sources.authRoute, sources.webhook],
    functions: [
      "POST /api/checkout",
      "GET /api/auth/session",
      "POST /api/webhooks/stripe",
    ],
    children: ["routes", "services", "validation", "api-middleware"],
  },
  {
    id: "auth",
    name: "Authentication",
    description: "Sign-in and access control.",
    kind: "auth",
    type: "Security",
    technology: "Auth.js",
    purpose: {
      beginner:
        "Checks sign-in details and creates a secure session so customers can access their account.",
      developer:
        "Auth.js Credentials provider validates password hashes against Prisma user records and issues a signed session. Middleware protects /account routes.",
    },
    files: [sources.auth, sources.authRoute, sources.middleware],
    functions: ["auth()", "authorize()", "POST /api/auth/callback/credentials"],
    children: ["credentials", "sessions", "guards"],
  },
  {
    id: "database",
    name: "Database",
    description: "Users, products, and orders.",
    kind: "database",
    type: "Data store",
    technology: "PostgreSQL · Prisma",
    purpose: {
      beginner: "Stores customer accounts, products, orders, and payments.",
      developer:
        "PostgreSQL accessed through a shared Prisma client. User, Product, Order, OrderItem, and Payment models use foreign keys and transaction boundaries for consistency.",
    },
    files: [sources.database, sources.schema, sources.order],
    functions: [
      "db.user.findUnique()",
      "db.order.update()",
      "db.$transaction()",
    ],
    children: ["user-model", "product-model", "order-model", "payment-model"],
  },
  {
    id: "payments",
    name: "Payments",
    description: "Checkout and payment confirmation.",
    kind: "payments",
    type: "External integration",
    technology: "Stripe",
    purpose: {
      beginner:
        "Starts a secure Stripe checkout and confirms when a payment succeeds.",
      developer:
        "Stripe Checkout sessions use authoritative product prices. The webhook validates Stripe signatures and publishes an idempotent order/payment-confirmed event.",
    },
    files: [sources.payments, sources.webhook],
    functions: ["checkoutService.create()", "stripe.webhooks.constructEvent()"],
    children: ["checkout-session", "payment-webhook", "stripe-client"],
  },
  {
    id: "jobs",
    name: "Background Jobs",
    description: "Order processing and retries.",
    kind: "jobs",
    type: "Async worker",
    technology: "Inngest",
    purpose: {
      beginner:
        "Finishes paid orders and retries failed work before sending a receipt.",
      developer:
        "Inngest functions consume order/payment-confirmed events. Durable steps transactionally confirm orders before sending receipts, with three retries per function.",
    },
    files: [sources.jobs, sources.order],
    functions: ["processOrder()", "step.run()", "confirmOrder()"],
    children: ["event-bus", "order-worker", "retries"],
  },
  {
    id: "notifications",
    name: "Notifications",
    description: "Order receipts and email delivery.",
    kind: "notifications",
    type: "External integration",
    technology: "Resend · React Email",
    purpose: {
      beginner:
        "Sends an order receipt to the customer after payment is confirmed.",
      developer:
        "A notification service renders React Email templates and calls Resend. Delivery is invoked inside a durable job step so transient failures can be retried.",
    },
    files: [sources.notifications],
    functions: ["sendOrderReceipt()", "resend.emails.send()"],
    children: ["email-service", "email-templates", "delivery"],
  },
];

type ChildDefinition = [
  id: string,
  name: string,
  description: string,
  source: keyof typeof sources,
  functions: string[],
];
const childDefinitions: Record<string, ChildDefinition[]> = {
  frontend: [
    [
      "pages",
      "Pages",
      "The storefront's routes and screens.",
      "frontend",
      ["StorePage()", "CheckoutPage()"],
    ],
    [
      "components",
      "Components",
      "Reusable pieces of the interface.",
      "login",
      ["LoginForm()", "ProductGrid()"],
    ],
    [
      "hooks",
      "Hooks",
      "Shared cart and interface state.",
      "cart",
      ["useCart()"],
    ],
    [
      "api-client",
      "API Client",
      "Requests to the application.",
      "apiClient",
      ["apiClient.post()"],
    ],
  ],
  api: [
    [
      "routes",
      "Routes",
      "Receive requests and return responses.",
      "api",
      ["POST /api/checkout", "GET /api/auth/session"],
    ],
    [
      "services",
      "Services",
      "The business logic behind each request.",
      "payments",
      ["checkoutService.create()", "confirmOrder()"],
    ],
    [
      "validation",
      "Validation",
      "Check incoming data before using it.",
      "validation",
      ["cartSchema.parse()"],
    ],
    [
      "api-middleware",
      "Middleware",
      "Check access before work begins.",
      "middleware",
      ["auth()"],
    ],
  ],
  auth: [
    [
      "credentials",
      "Credentials",
      "Check the email and password.",
      "auth",
      ["authorize()"],
    ],
    [
      "sessions",
      "Sessions",
      "Remember a signed-in customer securely.",
      "authRoute",
      ["auth()"],
    ],
    [
      "guards",
      "Route Guards",
      "Keep private pages private.",
      "middleware",
      ["middleware()"],
    ],
  ],
  database: [
    [
      "user-model",
      "User",
      "Customer accounts and sign-in details.",
      "schema",
      ["db.user.findUnique()"],
    ],
    [
      "product-model",
      "Product",
      "The catalog and current prices.",
      "schema",
      ["db.product.findMany()"],
    ],
    [
      "order-model",
      "Order",
      "Purchases and their current status.",
      "order",
      ["confirmOrder()"],
    ],
    [
      "payment-model",
      "Payment",
      "A record of each successful payment.",
      "schema",
      ["db.payment.upsert()"],
    ],
  ],
  payments: [
    [
      "checkout-session",
      "Checkout Session",
      "Create a secure Stripe checkout.",
      "payments",
      ["checkoutService.create()"],
    ],
    [
      "payment-webhook",
      "Payment Webhook",
      "Verify the payment confirmation.",
      "webhook",
      ["POST /api/webhooks/stripe"],
    ],
    [
      "stripe-client",
      "Stripe Client",
      "Talk to the payment provider.",
      "payments",
      ["stripe.checkout.sessions.create()"],
    ],
  ],
  jobs: [
    [
      "event-bus",
      "Event Bus",
      "Deliver payment events to workers.",
      "jobsClient",
      ["jobs.send()"],
    ],
    [
      "order-worker",
      "Order Worker",
      "Save the order, then send a receipt.",
      "jobs",
      ["processOrder()"],
    ],
    [
      "retries",
      "Retry Policy",
      "Try failed work again, up to three times.",
      "jobs",
      ["step.run()"],
    ],
  ],
  notifications: [
    [
      "email-service",
      "Email Service",
      "Prepare and send customer messages.",
      "notifications",
      ["sendOrderReceipt()"],
    ],
    [
      "email-templates",
      "Email Templates",
      "Turn order details into a readable receipt.",
      "emailTemplate",
      ["OrderReceipt()"],
    ],
    [
      "delivery",
      "Delivery",
      "Hand the message to Resend for delivery.",
      "notifications",
      ["resend.emails.send()"],
    ],
  ],
  services: [
    [
      "checkout-service",
      "Checkout Service",
      "Build an order and start payment.",
      "payments",
      ["checkoutService.create()"],
    ],
    [
      "order-service",
      "Order Service",
      "Confirm orders inside a transaction.",
      "order",
      ["confirmOrder()"],
    ],
    [
      "notification-service",
      "Notification Service",
      "Send the customer their receipt.",
      "notifications",
      ["sendOrderReceipt()"],
    ],
  ],
};

const children: CodeComponent[] = [];
for (const [parentId, definitions] of Object.entries(childDefinitions)) {
  const parent =
    rootComponents.find((c) => c.id === parentId) ??
    children.find((c) => c.id === parentId)!;
  for (const [id, name, description, file, functions] of definitions) {
    children.push({
      id,
      name,
      description,
      kind: parent.kind,
      type: parent.type,
      technology: parent.technology,
      parentId,
      files: [sources[file]],
      functions,
      purpose: {
        beginner: description,
        developer: `${description} ${sources[file].description} Entry points: ${functions.join(", ")}.`,
      },
      ...(childDefinitions[id]
        ? { children: childDefinitions[id].map((d) => d[0]) }
        : {}),
    });
  }
}

export const components = [...rootComponents, ...children];
export const componentById = Object.fromEntries(
  components.map((c) => [c.id, c]),
) as Record<string, CodeComponent>;

export const relationships: CodeRelationship[] = [
  {
    id: "frontend-api",
    source: "frontend",
    target: "api",
    label: "sends requests",
    sourceHandle: "right",
    targetHandle: "left",
  },
  {
    id: "api-auth",
    source: "api",
    target: "auth",
    label: "checks access",
    sourceHandle: "top",
    targetHandle: "bottom",
  },
  {
    id: "auth-database",
    source: "auth",
    target: "database",
    label: "reads users",
    sourceHandle: "right",
    targetHandle: "left",
  },
  {
    id: "api-database",
    source: "api",
    target: "database",
    label: "reads & writes",
    sourceHandle: "right",
    targetHandle: "bottom",
  },
  {
    id: "api-payments",
    source: "api",
    target: "payments",
    label: "creates checkout",
    sourceHandle: "right",
    targetHandle: "left",
  },
  {
    id: "payments-jobs",
    source: "payments",
    target: "jobs",
    label: "payment event",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "jobs-database",
    source: "jobs",
    target: "database",
    label: "confirms order",
    sourceHandle: "right",
    targetHandle: "right",
  },
  {
    id: "jobs-notifications",
    source: "jobs",
    target: "notifications",
    label: "sends receipt",
    sourceHandle: "left",
    targetHandle: "right",
  },
];

export const subgraphRelationships: Record<string, CodeRelationship[]> = {
  api: [
    {
      id: "middleware-routes",
      source: "api-middleware",
      target: "routes",
      label: "protects",
    },
    {
      id: "routes-validation",
      source: "routes",
      target: "validation",
      label: "validates input",
    },
    {
      id: "routes-services",
      source: "routes",
      target: "services",
      label: "delegates to",
    },
    {
      id: "validation-services",
      source: "validation",
      target: "services",
      label: "checked data",
    },
  ],
  frontend: [
    {
      id: "pages-components",
      source: "pages",
      target: "components",
      label: "renders",
    },
    {
      id: "components-hooks",
      source: "components",
      target: "hooks",
      label: "uses state",
    },
    {
      id: "hooks-client",
      source: "hooks",
      target: "api-client",
      label: "fetches data",
    },
  ],
  database: [
    {
      id: "user-order",
      source: "user-model",
      target: "order-model",
      label: "places orders",
    },
    {
      id: "product-order",
      source: "product-model",
      target: "order-model",
      label: "in order items",
    },
    {
      id: "order-payment",
      source: "order-model",
      target: "payment-model",
      label: "has payment",
    },
  ],
};

export const domainEntities: DomainEntity[] = [
  {
    id: "entity-user",
    name: "User",
    description: "A customer with an account.",
    fields: [
      { name: "id", type: "String", primary: true },
      { name: "email", type: "String · unique" },
      { name: "passwordHash", type: "String" },
    ],
  },
  {
    id: "entity-product",
    name: "Product",
    description: "An item available in the store.",
    fields: [
      { name: "id", type: "String", primary: true },
      { name: "name", type: "String" },
      { name: "price", type: "Int · cents" },
    ],
  },
  {
    id: "entity-order",
    name: "Order",
    description: "One customer's purchase.",
    fields: [
      { name: "id", type: "String", primary: true },
      { name: "userId", type: "String", foreign: true },
      { name: "status", type: "String" },
      { name: "customerEmail", type: "String" },
    ],
  },
  {
    id: "entity-item",
    name: "OrderItem",
    description: "A product, quantity, and price in an order.",
    fields: [
      { name: "id", type: "String", primary: true },
      { name: "orderId", type: "String", foreign: true },
      { name: "productId", type: "String", foreign: true },
      { name: "quantity", type: "Int" },
      { name: "unitPrice", type: "Int · cents" },
    ],
  },
  {
    id: "entity-payment",
    name: "Payment",
    description: "The payment attached to an order.",
    fields: [
      { name: "id", type: "String", primary: true },
      { name: "orderId", type: "String · unique", foreign: true },
      { name: "providerId", type: "String · unique" },
      { name: "amount", type: "Int · cents" },
    ],
  },
].map((entity) => ({
  ...entity,
  kind: "database",
  type: "Domain entity",
  technology: "Prisma model",
  files: [sources.schema],
  functions: [
    `db.${entity.name.charAt(0).toLowerCase() + entity.name.slice(1)}.findUnique()`,
  ],
  purpose: {
    beginner: `${entity.description} The lines show how this record is connected to other information in the store.`,
    developer: `${entity.description} Persisted in PostgreSQL with the Prisma schema. Primary keys identify records; foreign keys maintain referential integrity.`,
  },
})) as DomainEntity[];

export const domainRelationships: CodeRelationship[] = [
  {
    id: "entity-user-order",
    source: "entity-user",
    target: "entity-order",
    label: "1 → many · places",
  },
  {
    id: "entity-order-item",
    source: "entity-order",
    target: "entity-item",
    label: "1 → many · contains",
    sourceHandle: "bottom",
    targetHandle: "top",
  },
  {
    id: "entity-product-item",
    source: "entity-product",
    target: "entity-item",
    label: "1 → many · appears in",
  },
  {
    id: "entity-order-payment",
    source: "entity-order",
    target: "entity-payment",
    label: "1 → 0..1 · paid by",
  },
];

export const project = {
  name: "Acme Commerce",
  branch: "main",
  framework: "Next.js",
  description:
    "A full-stack storefront, from the first click to the order confirmation.",
  files: Array.from(
    new Map(
      components.flatMap((c) => c.files).map((f) => [f.path, f]),
    ).values(),
  ),
};
