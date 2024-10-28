const Product = require("../models/product");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");
const cloudinary = require("cloudinary");
const category = require("../models/category");
const flattenAndRemoveAccents = require("../utils/plattenString");

// Create new product   =>   /api/v1/admin/product/new
exports.newProduct = catchAsyncErrors(async (req, res, next) => {
  const categoryId = req.body.category;

  if (!categoryId) {
    return next(new ErrorHandler("Vui lòng chọn danh mục", 400));
  }

  const findCategory = await category.findById(categoryId);

  if (!findCategory) {
    return next(new ErrorHandler("Danh mục không tồn tại", 400));
  }

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  let imagesLinks = [];

  for (let i = 0; i < images?.length; i++) {
    const result = await cloudinary.v2.uploader.upload(images[i], {
      folder: "products",
    });

    imagesLinks.push({
      public_id: result.public_id,
      url: result.secure_url,
    });
  }

  req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const namePlatten = req.body.name
    ? flattenAndRemoveAccents(req.body.name)
    : null;

  const product = await Product.create({
    ...req.body,
    search: namePlatten,
  });

  res.status(201).json({
    success: true,
    product,
  });
});

// Get all products   =>   /api/v1/products?keyword=apple
exports.getProducts = catchAsyncErrors(async (req, res, next) => {
  let { keyword, limit = 10, page = 1 } = req.query;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  const apiFeatures = new APIFeatures(
    Product.find(),
    {
      keyword,
      limit,
      page,
    },
    "search"
  )
    .search()
    .filter();

  apiFeatures.query = apiFeatures.query.sort({ createdAt: -1 });

  let products = await apiFeatures.query;
  let filteredProductsCount = products.length;

  apiFeatures.pagination(limit);
  products = await apiFeatures.query;

  products = products.map((product) => {
    const { search, ...rest } = product._doc;
    return rest;
  });

  res.status(200).json({
    total: filteredProductsCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(filteredProductsCount / limit),
    rows: products,
  });
});

// Get all products by category  =>   /api/v1/:categoryId/products?keyword=apple
exports.getProductsByCategory = catchAsyncErrors(async (req, res, next) => {
  const categoryId = req.params.categoryId;

  let findCategory = await category.findById(categoryId);

  if (!findCategory) {
    return next(new ErrorHandler("Không tìm thấy danh mục tương ứng", 404));
  }

  let { keyword, limit = 10, page = 1 } = req.query;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  const apiFeatures = new APIFeatures(
    Product.find({
      category: categoryId,
    }).populate({
      path: "category",
      select: "categoryName _id",
    }),
    {
      keyword,
      limit,
      page,
    },
    "search"
  )
    .search()
    .filter();

  apiFeatures.query = apiFeatures.query.sort({ createdAt: -1 });

  let products = await apiFeatures.query;
  let filteredProductsCount = products.length;

  apiFeatures.pagination(limit);
  products = await apiFeatures.query;

  products = products.map((product) => {
    const { search, ...rest } = product._doc;
    return rest;
  });

  res.status(200).json({
    total: filteredProductsCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(filteredProductsCount / limit),
    rows: products,
  });
});

// Get all products (Admin)  =>   /api/v1/admin/products
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

// Get single product details   =>   /api/v1/product/:id
exports.getSingleProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));
  }

  res.status(200).json({
    success: true,
    product,
  });
});

// Update Product   =>   /api/v1/admin/product/:id
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));
  }

  let images = [];
  if (typeof req.body.images === "string") {
    images.push(req.body.images);
  } else {
    images = req.body.images;
  }

  if (images !== undefined) {
    // Deleting images associated with the product
    for (let i = 0; i < product.images.length; i++) {
      const result = await cloudinary.v2.uploader.destroy(
        product.images[i].public_id
      );
    }

    let imagesLinks = [];

    for (let i = 0; i < images.length; i++) {
      const result = await cloudinary.v2.uploader.upload(images[i], {
        folder: "products",
      });

      imagesLinks.push({
        public_id: result.public_id,
        url: result.secure_url,
      });
    }

    req.body.images = imagesLinks;
  }

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    product,
  });
});

// Delete Product   =>   /api/v1/admin/product/:id
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler("Không tìm thấy sản phẩm", 404));
  }

  // Deleting images associated with the product
  for (let i = 0; i < product.images.length; i++) {
    const result = await cloudinary.v2.uploader.destroy(
      product.images[i].public_id
    );
  }

  await product.remove();

  res.status(200).json({
    success: true,
    message: "Xóa sản phẩm thành công",
  });
});

// Create new review   =>   /api/v1/review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((review) => {
      if (review.user.toString() === req.user._id.toString()) {
        review.comment = comment;
        review.rating = rating;
      }
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  product.ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get Product Reviews   =>   /api/v1/reviews
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  try {
    const product = await Product.findById(req.query.id);

    res.status(200).json({
      success: true,
      reviews: product.reviews,
    });
  } catch (error) {
    res.status(200).json({
      message: "Không tìm thấy review với id",
    });
  }
});

// Delete Product Review   =>   /api/v1/reviews
exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.productId);

  const reviews = product.reviews.filter(
    (review) => review._id.toString() !== req.query.id.toString()
  );

  const numOfReviews = reviews.length;

  const ratings =
    product.reviews.reduce((acc, item) => item.rating + acc, 0) /
    reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews,
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
  });
});
