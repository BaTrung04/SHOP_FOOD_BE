const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

exports.checkPaymentStatus = catchAsyncErrors(async (req, res, next) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const { session_id } = req.query;

  const session = await stripe.checkout.sessions.retrieve(session_id);

  if (session.payment_status === "paid") {
    res.json({
      payment_status: "paid",
      payment_intent: session.payment_intent,
    });
  } else {
    res.json({ payment_status: "unpaid" });
  }
});

exports.processPaymentLink = catchAsyncErrors(async (req, res, next) => {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  const { products } = req.body;

  const user = req.user;

  const lineItems = products.map((product) => ({
    price_data: {
      currency: "vnd",
      product_data: {
        name: product.product.name,
        images: [product.product.images[0].url],
      },
      unit_amount: Math.round(product.product.price * 1),
    },
    quantity: product.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/success`,
    cancel_url: `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/cancel`,
    customer_email: user.email,
  });

  res.json({ url: session.url, sessionId: session.id });
});
