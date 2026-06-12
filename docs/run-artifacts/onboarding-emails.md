# Onboarding email sequence (3 emails: welcome → activation → first success)

For buyers landing through the Wix storefront / lead capture. Adapt product naming before use.

## Email 1 — Welcome (immediately on purchase/signup)

Subject: Welcome — let's get you set up

Hi {first_name},

Welcome — excited to have you. To get started, open your dashboard: <dashboard URL>

First step: [complete this quick setup task] (link)

## Email 2 — Activation (+24h)

Subject: Quick win: set this up in 2 minutes

Hi {first_name},

Most customers see value after doing this one step: [link to first-success task].

## Email 3 — First success & upgrade (+3 days)

Subject: Congrats — you're up and running

Hi {first_name},

Nice work — you've completed the first step. Next, consider upgrading for [benefit]. Use coupon FIRST10 for 10% off today. (link)

---

Automation path: trigger from the lead/order pipeline (bridge D1 `leads` table or Wix order events) once an email sender rail is chosen. No sender is wired yet — do not fake sends.
