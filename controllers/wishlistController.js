const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");

const Product = require("../models/product");
const Wishlist = require("../models/wishlist");

exports.newWishlist = catchAsyncErrors(async (req, res, next) => {
  const { productId } = req.body;
  const userId = req.user._id;

  const findProduct = await Product.findOne({
    _id: productId,
  });

  if (!findProduct) {
    return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));
  }

  const findWishList = await Wishlist.findOne({
    product: productId,
    user: userId,
  });

  if (findWishList) {
    await findWishList.remove();
    res.status(201).json({
      success: true,
      message: "Bỏ sản phẩm yêu thích thành công",
    });
  } else {
    res.status(201).json({
      success: true,
      message: "Thêm sản phẩm yêu thích thành công",
      category: await Wishlist.create({
        product: productId,
        user: req.user._id,
      }),
    });
  }
});

exports.getProductWishlistByUser = catchAsyncErrors(async (req, res, next) => {
  let { keyword, limit = 10, page = 1 } = req.query;
  const userId = req.user._id;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  const apiFeatures = new APIFeatures(
    Wishlist.find({
      user: userId,
    }).populate({
      path: "product",
    }),
    {
      keyword,
      limit,
      page,
    }
  )
    .search()
    .filter();

  apiFeatures.query = apiFeatures.query.sort({ createdAt: -1 });

  let wishlistItems = await apiFeatures.query;
  let filteredProductsCount = wishlistItems.length;

  apiFeatures.pagination(limit);
  wishlistItems = await apiFeatures.query;

  const products = wishlistItems.map((item) => item.product);

  res.status(200).json({
    total: filteredProductsCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(filteredProductsCount / limit),
    rows: products,
  });
});
