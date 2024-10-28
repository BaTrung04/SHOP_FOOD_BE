const express = require("express");
const router = express.Router();

const { isAuthenticatedUser } = require("../middlewares/auth");

const {
  newWishlist,
  deleteWishlist,
  getProductWishlistByUser,
} = require("../controllers/wishlistController");

router.route("/wishlist").post(isAuthenticatedUser, newWishlist);
router
  .route("/wishlist/user")
  .get(isAuthenticatedUser, getProductWishlistByUser);

module.exports = router;
