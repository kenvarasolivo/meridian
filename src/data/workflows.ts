import type { Workflow, WorkflowStep } from "@/lib/types";
import { sources } from "./sources";

const step = (
  componentId: string,
  title: string,
  beginner: string,
  developer: string,
  file: keyof typeof sources,
): WorkflowStep => ({
  componentId,
  title,
  explanation: { beginner, developer },
  file: sources[file],
});

export const workflows: Workflow[] = [
  {
    id: "login",
    name: "User login",
    question: "How does user login work?",
    description: "From a sign-in form to a secure session.",
    duration: "4 steps",
    relationshipIds: ["frontend-api", "api-auth", "auth-database"],
    steps: [
      step(
        "frontend",
        "A customer signs in",
        "The customer enters their email and password. The sign-in form sends these details securely to the application's login endpoint.",
        "The client calls Auth.js signIn('credentials'), posting form data to /api/auth/callback/credentials.",
        "login",
      ),
      step(
        "api",
        "The login request arrives",
        "The API receives the sign-in request and hands it to Authentication. The form itself never decides whether a password is correct.",
        "The catch-all Auth.js route exports GET and POST handlers and dispatches the credentials callback to the configured provider.",
        "authRoute",
      ),
      step(
        "auth",
        "Their identity is checked",
        "Authentication looks up the customer's account and compares the password with its protected, saved version. Incorrect details do not create a session.",
        "The Credentials authorize callback loads the user through Prisma and verifies the supplied password against passwordHash.",
        "auth",
      ),
      step(
        "database",
        "An account becomes a session",
        "The database provides the saved user record. Once the password matches, Authentication creates a secure session and the customer can open their account.",
        "A unique email lookup returns the user. Auth.js uses the authorized result to issue a signed session; middleware reads it to guard /account routes.",
        "auth",
      ),
    ],
  },
  {
    id: "checkout",
    name: "Place an order",
    question: "How does checkout work?",
    description: "Follow an order from cart to confirmation.",
    duration: "7 steps",
    relationshipIds: [
      "frontend-api",
      "api-payments",
      "payments-jobs",
      "jobs-database",
      "jobs-notifications",
    ],
    steps: [
      step(
        "frontend",
        "The customer clicks Checkout",
        "The storefront gathers the products in the cart and asks the API to start checkout. Product prices are checked on the server, so the browser cannot change the amount.",
        "CheckoutPage reads useCart() and POSTs item identifiers and quantities to /api/checkout via the typed API client.",
        "checkout",
      ),
      step(
        "api",
        "The API validates the cart",
        "The API checks that the customer is signed in and that the cart is valid. It then asks the payment service to prepare a checkout.",
        "POST /api/checkout requires an Auth.js session, parses the payload with cartSchema, then invokes checkoutService.create(userId, cart).",
        "api",
      ),
      step(
        "payments",
        "A secure checkout is created",
        "The payment service creates a pending order using saved product prices, then opens a secure Stripe checkout for the customer to pay.",
        "The checkout service builds an order from database product prices, creates a Stripe Checkout session, and attaches orderId in its metadata.",
        "payments",
      ),
      step(
        "payments",
        "Stripe confirms the payment",
        "After payment, Stripe sends a message called a webhook. The application checks that the message really came from Stripe, then queues work to finish the order.",
        "The webhook verifies the raw request with stripe.webhooks.constructEvent and publishes order/payment-confirmed on checkout.session.completed.",
        "webhook",
      ),
      step(
        "jobs",
        "The order job starts",
        "A background worker picks up the confirmed payment. It performs each task in order and can retry a failed task without making the customer wait.",
        "Inngest consumes order/payment-confirmed and executes durable confirm-order and send-receipt steps, with a retry policy of three attempts.",
        "jobs",
      ),
      step(
        "database",
        "The order is marked as paid",
        "The worker saves a payment record and changes the order from pending to paid. A unique payment reference prevents duplicate records if the same event arrives again.",
        "confirmOrder uses a Prisma transaction to upsert the unique providerId payment and update the matching order to PAID atomically.",
        "order",
      ),
      step(
        "notifications",
        "A receipt reaches the customer",
        "After the order is saved, the worker asks Notifications to send a receipt. The customer receives their order details by email.",
        "The send-receipt durable step calls sendOrderReceipt, renders a React Email template, and sends it via Resend.",
        "notifications",
      ),
    ],
  },
  {
    id: "notification",
    name: "Send a notification",
    question: "How does a notification get sent?",
    description: "See how a paid order becomes an email.",
    duration: "4 steps",
    relationshipIds: ["payments-jobs", "jobs-database", "jobs-notifications"],
    steps: [
      step(
        "payments",
        "A payment event is verified",
        "Stripe confirms a completed payment. The webhook checks its signature and sends a payment-confirmed event to the background worker.",
        "The signed checkout.session.completed webhook is verified, then jobs.send emits order/payment-confirmed with the checkout session.",
        "webhook",
      ),
      step(
        "jobs",
        "A background job picks it up",
        "The worker confirms the order first, then prepares the receipt. If sending fails, the receipt step can try again.",
        "processOrder consumes the event, runs confirmOrder in a durable step, then invokes the send-receipt step with retries.",
        "jobs",
      ),
      step(
        "database",
        "The saved order supplies the details",
        "The confirmed order provides the customer's email, purchased items, and payment details. The receipt uses saved information rather than unverified browser data.",
        "The transaction returns the persisted PAID order. Its customerEmail and line items become the source of truth for the receipt.",
        "order",
      ),
      step(
        "notifications",
        "The receipt is sent",
        "Notifications creates an email from the order and hands it to the email delivery service. The customer now has a confirmation of their purchase.",
        "sendOrderReceipt renders OrderReceipt and calls resend.emails.send with the customer's address, a subject, and the rendered React template.",
        "notifications",
      ),
    ],
  },
];
export const workflowById = Object.fromEntries(workflows.map((w) => [w.id, w]));
