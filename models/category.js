const mongoose = require("mongoose");
const { trim } = require("validator");

const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, "Tên danh mục không được để trống"],
    trim: true,
    maxLength: [50, "Tên danh mục không được vượt quá 50 ký tự"],
  },
  slug: {
    type: String,
    required: false,
    trim: true,
  },
  search: {
    type: String,
    default: null,
  },
  image: {
    public_id: {
      type: String,
      required: false,
      null: true,
    },
    url: {
      type: String,
      required: false,
      null: true,
    },
  },
  description: {
    type: String,
    required: false,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Category", categorySchema);
