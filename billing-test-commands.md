# Billing test commands
1) Wix webhook: curl -X POST 'https://<worker>/webhook/payment' -H 'Content-Type: application/json' -d '{"payment":{"id":"wix_t1","amount":{"value":19.99,"currency":"USD"},"email":"t@t.com"}}'
2) Stripe webhook: curl -X POST 'https://<worker>/webhook/payment' -H 'Content-Type: application/json' -d '{"id":"e1","type":"checkout.session.completed","data":{"object":{"id":"cs_1","amount_total":1999,"currency":"usd","customer_details":{"email":"s@s.com"}}}}'
3) Health: curl -fsS https://<worker>/billing/health | jq
