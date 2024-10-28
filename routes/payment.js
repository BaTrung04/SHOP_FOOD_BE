const express = require("express");
const router = express.Router();

const {
  processPayment,
  sendStripApi,
  processPaymentLink,
} = require("../controllers/paymentController");

const { isAuthenticatedUser } = require("../middlewares/auth");

router.route("/payment/process").post(isAuthenticatedUser, processPayment);
router.route("/stripeapi").get(isAuthenticatedUser, sendStripApi);
router.route("/create-checkout-session").post(processPaymentLink);

module.exports = router;
