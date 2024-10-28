const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");
const category = require("../models/category");
const cloudinary = require("cloudinary");
const flattenAndRemoveAccents = require("../utils/plattenString");

// Create a category: api/v1/admin/category
exports.newCategory = catchAsyncErrors(async (req, res, next) => {
  const reqBody = req.body;
  const { categoryName, description, slug, image } = reqBody;
  let result = {
    public_id: null,
    secure_url: null,
  };
  if (image) {
    result = await cloudinary.v2.uploader.upload(image, {
      folder: "category",
    });
  }

  const namePlatten = categoryName
    ? flattenAndRemoveAccents(categoryName)
    : null;
  res.status(201).json({
    success: true,
    category: await category.create({
      categoryName,
      slug,
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      description,
      search: namePlatten,
    }),
  });
});

// Get all categories: api/v1/category?limit=&page=&keyword=
exports.getCategory = catchAsyncErrors(async (req, res, next) => {
  let { keyword, limit = 10, page = 1 } = req.query;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  const apiFeatures = new APIFeatures(
    category.find().populate(),
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

  let categories = await apiFeatures.query;
  let filteredCategoryCount = categories.length;

  apiFeatures.pagination(limit);
  categories = await apiFeatures.query;

  categories = categories.map((product) => {
    const { search, ...rest } = product._doc;
    return rest;
  });

  res.status(200).json({
    total: filteredCategoryCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(filteredCategoryCount / limit),
    rows: categories,
  });
});

// Get single category => api/v1/category/:id
exports.getSingleCategory = catchAsyncErrors(async (req, res, next) => {
  const findCategory = await category.findById(req.params.id).populate();

  if (!findCategory) {
    return next(new ErrorHandler("Không tìm thấy danh mục tương ứng", 404));
  }

  res.status(200).json({
    success: true,
    category: findCategory,
  });
});

// Update category => api/v1/admin/category/:id
exports.updateCategory = catchAsyncErrors(async (req, res, next) => {
  let findCategory = await category.findById(req.params.id);

  if (!findCategory) {
    return next(new ErrorHandler("Không tìm thấy danh mục tương ứng", 404));
  }

  res.status(200).json({
    success: true,
    category: await category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }),
  });
});

// Delete Category => /api/v1/admin/category/:id
exports.deleteCategory = catchAsyncErrors(async (req, res, next) => {
  let findCategory = await category.findById(req.params.id);

  if (!findCategory) {
    return next(new ErrorHandler("Không tìm thấy danh mục tương ứng", 404));
  }

  await findCategory.remove();

  res.status(200).json({
    success: true,
    message: "Xóa thành công",
  });
});
