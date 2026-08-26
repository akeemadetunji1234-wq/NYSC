# Annual Premium Payment Policy Draft

**Status:** Draft for business and legal review  
**Product:** Neat & Affordable annual premium access  
**Last updated:** 26 August 2026

> This document is a product-policy draft for review. It is not legal advice. The business owner should confirm the final wording, support contact, tax treatment, consumer-protection obligations, and refund rules before publishing it.

## 1. What premium includes

Neat & Affordable offers optional annual premium access for two account types:

| Account type | Price | Term |
|---|---:|---|
| Corp Member Premium | NGN 5,000 | One calendar year from verified activation |
| Agent Premium | NGN 10,000 | One calendar year from verified activation |

Premium access is activated only after the payment provider confirms a successful payment and the application verifies the payment server-side. A browser redirect or screenshot is not proof of payment. Paystack’s transaction guidance requires server-side verification of the transaction status, reference, amount, and currency before value is delivered [1].

Premium is a one-time annual purchase, not an automatic monthly subscription. The application does not store card numbers or payment credentials. Payment details are handled by Paystack’s hosted checkout.

## 2. Payment confirmation

After checkout, the application may briefly display **Payment verification in progress** while it confirms the provider response. If the network or provider is delayed, the member can safely refresh their own payment status. The application may also receive a signed provider webhook and will ignore duplicate events.

A successful payment should show the plan, the payment reference, and the premium expiry date. Users should retain the provider receipt and payment reference for support.

## 3. Failed, cancelled, or delayed payments

If payment fails or is cancelled, the account remains on its previous access level and no premium entitlement is created. The user may retry from the relevant premium page.

If money appears to have been debited but premium is not active, the user should not pay again immediately. They should wait for the payment status to update and contact support with the account email, payment reference, transaction date, and provider receipt. Users should not send card numbers, PINs, passwords, one-time passwords, or secret keys to support.

## 4. Cancellation and refund wording for review

**Proposed policy wording:**

> Because premium access is a digital service that may become available immediately after verified payment, a refund is not automatic after activation. Refund requests for duplicate charges, an incorrect amount, an unsuccessful or reversed transaction, or a provider-confirmed payment that did not activate access will be investigated individually. Where a refund is approved, it will be returned through the payment method and provider process used for the original transaction, subject to applicable law and provider rules.
>
> A user must contact support as soon as possible with the payment reference and a description of the issue. We may request information needed to locate the transaction, but we will never request a card PIN, password, full card number, or one-time password.

The business owner/legal adviser must confirm whether this wording complies with applicable Nigerian consumer, tax, data-protection, and digital-service requirements before publishing it.

## 5. Privacy wording for payment data

**Proposed policy wording:**

> Neat & Affordable receives the account and transaction information needed to identify the purchaser, verify the selected annual plan, activate the correct entitlement, prevent duplicate fulfillment, reconcile payment issues, and maintain an audit record. Card details and payment credentials are entered into the payment provider’s hosted checkout and are not stored by Neat & Affordable. Payment references, provider transaction identifiers, plan, amount, currency, status, timestamps, and limited customer information may be retained for support, fraud prevention, accounting, dispute handling, and legal obligations.
>
> Access to payment records is restricted to authorized application processes and administrators. We do not ask users to send payment secrets through email, chat, or support forms. The final privacy notice should identify the legal basis, retention period, data-subject rights, subprocessors, and support contact approved by the business owner.

## 6. Support contact placeholder

The repository does not contain an approved public support email address. Before launch, replace the placeholders below with a monitored business contact and response owner:

```text
Support email: [support@your-approved-domain]
Support page: https://nysc-mu.vercel.app/agent/support
Expected response time: [business-approved timeframe]
Escalation owner: [business-approved owner]
```

Do not publish a guessed or personal email address. The support contact should be monitored during the initial payment launch and should have a documented escalation path for payment disputes.

## 7. User-facing payment help text

The following concise copy is suitable for a premium page after business approval:

> Pay securely through Paystack. Your annual premium access starts only after your payment is verified. If checkout is cancelled or delayed, your account will not be charged twice and you can check the payment status from this page. Never share your password, card PIN, OTP, or full card details with anyone.

## References

[1]: https://paystack.com/docs/payments/verify-payments/ "Paystack payment verification guidance"
[2]: https://paystack.com/docs/payments/webhooks/ "Paystack webhooks"
