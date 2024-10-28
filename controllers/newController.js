const New = require("../models/news");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");

const cloudinary = require("cloudinary");
const flattenAndRemoveAccents = require("../utils/plattenString");

// create new: api/v1/news/new
exports.newNew = catchAsyncErrors(async (req, res, next) => {
  const reqBody = req.body;

  const { title, content, image } = reqBody;

  let result = {
    public_id: null,
    secure_url: null,
  };

  if (image) {
    result = await cloudinary.v2.uploader.upload(image, {
      folder: "news",
    });
  }

  const contentPlatten = req.body.content
    ? flattenAndRemoveAccents(req.body.content)
    : null;

  res.status(201).json({
    success: true,
    new: await New.create({
      title,
      content,
      author: req.user._id,
      image: {
        public_id: result.public_id,
        url: result.secure_url,
      },
      search: contentPlatten,
    }),
  });
});

// Get all news: api/v1/news?limit=&page=&keyword=
exports.getNews = catchAsyncErrors(async (req, res, next) => {
  let { keyword, limit = 10, page = 1 } = req.query;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  const apiFeatures = new APIFeatures(
    New.find().populate({
      path: "author",
      select: "avatar _id name",
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

  let news = await apiFeatures.query;
  let filteredNewsCount = news.length;

  apiFeatures.pagination(limit);
  news = await apiFeatures.query;

  news = news.map((product) => {
    const { search, ...rest } = product._doc;
    return rest;
  });

  res.status(200).json({
    total: filteredNewsCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(filteredNewsCount / limit),
    rows: news,
  });
});

// Get single new => api/v1/news/:id
exports.getSingleNew = catchAsyncErrors(async (req, res, next) => {
  const findNew = await New.findById(req.params.id).populate({
    path: "author",
    select: "avatar _id name",
  });

  if (!findNew) {
    return next(new ErrorHandler("Không tìm thấy bài viết", 404));
  }

  res.status(200).json({
    success: true,
    new: findNew,
  });
});

// Update new => api/v1/admin/news/:id
exports.updateNew = catchAsyncErrors(async (req, res, next) => {
  let findNew = await New.findById(req.params.id);

  if (!findNew) {
    return next(new ErrorHandler("Không tìm thấy bài viết", 404));
  }

  let image = req?.files?.image;

  if (image) {
    await cloudinary.v2.uploader.destroy(findNew.image?.public_id);

    const dataBase64 = `data:${image.mimetype};base64,${image.data.toString(
      "base64"
    )}`;

    const result = await cloudinary.v2.uploader.upload(dataBase64, {
      folder: "news",
    });

    req.body.image = {
      public_id: result.public_id,
      url: result.secure_url,
    };
  }

  res.status(200).json({
    success: true,
    new: await await New.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }),
  });
});

// Delete New   =>   /api/v1/admin/news/:id
exports.deleteNew = catchAsyncErrors(async (req, res, next) => {
  const findNew = await New.findById(req.params.id);

  if (!findNew) {
    return next(new ErrorHandler("Không tìm thấy bài viết", 404));
  }

  await cloudinary.v2.uploader.destroy(findNew.image.public_id);

  await findNew.remove();

  res.status(200).json({
    success: true,
    message: "Xóa thành công",
  });
});
