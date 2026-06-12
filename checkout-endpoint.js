const express=require('express'),Stripe=require('stripe');
const app=express();app.use(express.json());
const stripe=Stripe(process.env.STRIPE_SECRET||'sk_test');
app.post('/create-checkout-session',async(req,res)=>{try{const s=await stripe.checkout.sessions.create({payment_method_types:['card'],mode:'subscription',line_items:[{price:process.env.PRICE_ID||'price_replace',quantity:1}],success_url:'https://domain.com/success?session_id={CHECKOUT_SESSION_ID}',cancel_url:'https://domain.com/cancel'});res.json({id:s.id});}catch(e){res.status(500).json({error:'server_error'});}});
module.exports=app;
