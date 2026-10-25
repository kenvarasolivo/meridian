export interface UserFlowStep {
  title: string;
  description: string;
  mapStep: number;
  decision?: { question: string; retry: string; returnTo: string };
}

export const userFlows: { id: string; name: string; description: string; steps: UserFlowStep[] }[] = [
  {
    id: "login", name: "Sign in", description: "From entering credentials to opening an account.",
    steps: [
      { title: "Open the sign-in form", description: "The customer enters their email and password.", mapStep: 0 },
      { title: "Submit sign-in details", description: "The customer submits the form and waits for their details to be checked.", mapStep: 2,
        decision: { question: "Do the credentials match?", retry: "Show a sign-in error", returnTo: "Enter details again" } },
      { title: "Open their account", description: "A successful sign-in creates a session so the customer can access their account.", mapStep: 3 },
    ],
  },
  {
    id: "checkout", name: "Place an order", description: "From a shopping cart to a paid order and receipt.",
    steps: [
      { title: "Review the cart", description: "The customer checks their items and chooses Checkout.", mapStep: 0 },
      { title: "Continue to checkout", description: "The application checks the session and cart before preparing payment.", mapStep: 1,
        decision: { question: "Signed in with a valid cart?", retry: "Sign in or update the cart", returnTo: "Try checkout again" } },
      { title: "Pay securely", description: "The customer completes payment in Stripe Checkout. The order stays pending until payment is confirmed.", mapStep: 2 },
      { title: "Payment is confirmed", description: "The application receives confirmation of the payment and finishes processing the order.", mapStep: 3 },
      { title: "Receive an order receipt", description: "The customer receives an email with the saved order details.", mapStep: 6 },
    ],
  },
  {
    id: "notification", name: "Receive a receipt", description: "What happens between a confirmed payment and an order email.",
    steps: [
      { title: "Complete a purchase", description: "A confirmed payment starts the receipt journey.", mapStep: 0 },
      { title: "The order is prepared", description: "The order is confirmed and its saved details are used to prepare the receipt.", mapStep: 2 },
      { title: "Receive the receipt email", description: "The email service is asked to deliver the receipt. Delivery timing depends on the service and the customer's inbox.", mapStep: 3 },
    ],
  },
];
