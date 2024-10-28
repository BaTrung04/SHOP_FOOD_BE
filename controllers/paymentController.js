const catchAsyncErrors = require("../middlewares/catchAsyncErrors");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Process stripe payments   =>   /api/v1/payment/process
exports.processPayment = catchAsyncErrors(async (req, res, next) => {
  console.log(req.body.amount);
  const paymentIntent = await stripe.paymentIntents.create({
    // create content payment
    amount: req.body.amount,
    currency: "vnd",

    metadata: { integration_check: "accept_a_payment" }, // Các đối tượng Stripe có thể cập nhật — bao gồm Tài khoản , Khoản phí , Khách hàng , Nội dung thanh toán , Tiền hoàn lại , Đăng ký và Chuyển khoản —có thông số.
  });

  console.log(paymentIntent);
  res.status(200).json({
    success: true,
    client_secret: paymentIntent.client_secret, // Json API client_secret
  });
});

// Send stripe API Key   =>   /api/v1/stripeapi
exports.sendStripApi = catchAsyncErrors(async (req, res, next) => {
  res.status(200).json({
    stripeApiKey: process.env.STRIPE_API_KEY,
  });
});

exports.processPaymentLink = catchAsyncErrors(async (req, res, next) => {
  const { products } = req.body;
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
    success_url: "http://localhost:5173/success",
    cancel_url: "http://localhost:5173/cancel",
  });
  res.json({ id: session.id });
});
