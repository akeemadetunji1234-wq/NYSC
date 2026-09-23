# Provider smoke tests (do not claim "live" without evidence)

Record each run with: date (UTC), environment (production/staging), actor, notification ID / payment ref / inbox timestamp, pass/fail.

## 1. Pusher (realtime browser event)

1. Sign in as CORP and AGENT in two browsers (or normal + incognito).
2. Open in-app messages between them.
3. Send a message from A to B with B's tab open.
4. **Pass criteria:** B receives the event without refresh; note channel name + approximate timestamp.
5. **Evidence:** screenshot of both clients + Vercel/Pusher dashboard event if available.

## 2. Brevo (email inbox)

1. Trigger a transactional email (password reset OTP, premium reminder, or registration verification) to a mailbox you control.
2. Confirm delivery in the inbox (not only Brevo dashboard "queued").
3. **Pass criteria:** message arrives with correct From domain; note Message-ID / Brevo message id + inbox received time.
4. **Evidence:** inbox screenshot + Brevo transaction id.

## 3. Paystack (test mode payment)

1. Ensure `PAYSTACK_SECRET_KEY` is a **test** key (`sk_test_...`).
2. As an agent/corp, start premium checkout.
3. Complete payment with Paystack test card.
4. Confirm webhook marks payment SUCCESS and premium flags update in DB.
5. **Pass criteria:** PremiumPayment row SUCCESS + user `isPremium` true; note Paystack reference.
6. **Evidence:** Paystack dashboard transaction ref + app admin payment view.

## 4. Web Push (app closed on real device)

1. Sign in on iOS Safari or Android Chrome; grant notification permission; confirm PushSubscription row exists.
2. Fully background/close the app/tab.
3. Trigger a notification (new message, booking update) from another account.
4. **Pass criteria:** system notification appears while app is closed; note OS + browser + approximate time.
5. **Evidence:** lock-screen photo + PushSubscription id.

## Sign-off template

| Provider   | Date (UTC) | Env        | Result | Evidence ref |
|------------|------------|------------|--------|--------------|
| Pusher     |            | production |        |              |
| Brevo      |            | production |        |              |
| Paystack   |            | test       |        |              |
| Web Push   |            | production |        |              |

Until all four rows pass with evidence, marketing and ops docs should say **integrations configured, end-to-end delivery pending verification**.
