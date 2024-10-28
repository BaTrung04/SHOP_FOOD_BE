const mongoose = require("mongoose");
const { trim } = require("validator");

const newSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Tiêu đề bài viết không được để trống"],
    trim: true,
    maxLength: [100, "Tiêu đề bài viết không được vượt quá 100 ký tự"],
  },
  content: {
    type: String,
    required: [true, "Nội dung bài viết không được để trống"],
    maxLength: [7, "Giá không được vượt quá 7 ký tự"],
    trim: true,
  },
  search: {
    type: String,
    required: true,
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
  author: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "Người tạo bài viết không được để trống"],
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("New", newSchema);
