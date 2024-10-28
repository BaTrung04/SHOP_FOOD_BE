const mongoose = require("mongoose");
const { trim } = require("validator");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "user không được để trống"],
    ref: "User",
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "product không được để trống"],
    ref: "Product",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Wishlist", wishlistSchema);
