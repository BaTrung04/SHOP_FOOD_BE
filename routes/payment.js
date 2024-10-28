const express = require("express");
const router = express.Router();

const {
  processPaymentLink,
  checkPaymentStatus,
} = require("../controllers/paymentController");

const { isAuthenticatedUser } = require("../middlewares/auth");

router
  .route("/create-checkout-session")
  .post(isAuthenticatedUser, processPaymentLink);

router
  .route("/check-payment-status")
  .get(isAuthenticatedUser, checkPaymentStatus);

module.exports = router;
