const Order = require("../models/order");
const Product = require("../models/product");

const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const APIFeatures = require("../utils/apiFeatures");

// Create a new order   =>  /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const {
    orderItems,
    shippingInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
  } = req.body;

  const order = await Order.create({
    orderItems,

    shippingInfo: {
      ...shippingInfo,
      name: req.user.name, // Lấy name từ req.user và lưu vào shippingInfo
    },
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    paymentInfo,
    paidAt: Date.now(),
    user: req.user._id,
  });
  console.log(req.user.name);
  res.status(200).json({
    success: true,
    order,
  });
});

// Get single order   =>   /api/v1/order/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return next(new ErrorHandler("Không tìm thấy đơn hàng nào có ID này", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders   =>   /api/v1/orders/me
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user.id });

  res.status(200).json({
    success: true,
    orders,
  });
});

// Get all orders - ADMIN  =>   /api/v1/admin/orders/
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  let { keyword: orderStatus, limit = 10, page = 1 } = req.query;

  limit = isNaN(limit) || limit <= 0 ? 10 : Number(limit);
  page = isNaN(page) || page <= 0 ? 1 : Number(page);

  let totalAmount = 0;

  // Calculate total amount
  let allOrders = await Order.find();
  allOrders.forEach((order) => {
    totalAmount += order.totalPrice;
  });

  // Create API Features for filtering and sorting
  const apiFeaturesForCount = new APIFeatures(
    Order.find(),
    {
      keyword: orderStatus,
    },
    "orderStatus"
  )
    .search()
    .filter();

  const totalOrdersCount = await apiFeaturesForCount.query.countDocuments();

  const apiFeaturesForPagination = new APIFeatures(
    Order.find(),
    {
      keyword: orderStatus,
      limit,
      page,
    },
    "orderStatus"
  )
    .search()
    .filter()
    .pagination();

  // Sort orders by createdAt in descending order
  apiFeaturesForPagination.query = apiFeaturesForPagination.query.sort({
    createdAt: -1,
  });

  // Fetch paginated orders
  const orders = await apiFeaturesForPagination.query;
  orders.forEach((order) => {
    order.shippingInfo.nam = req.user.name; // Lấy name từ req.user
  });
  res.status(200).json({
    total: totalOrdersCount,
    limit: limit,
    page: page,
    totalPage: Math.ceil(totalOrdersCount / limit),
    rows: orders,
    metadata: {
      totalAmount,
    },
  });
});

// Update / Process order - ADMIN  =>   /api/v1/admin/order/:id
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (order.orderStatus === "Đã giao hàng") {
    return next(new ErrorHandler("Bạn đã giao đơn đặt hàng này", 400));
  }

  order.orderItems.forEach(async (item) => {
    await updateStock(item.product, item.quantity);
  });

  (order.orderStatus = req.body.status), (order.deliveredAt = Date.now());

  await order.save();

  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.stock = product.stock - quantity;

  await product.save({ validateBeforeSave: false });
}

// GET MONTHLY INCOME
exports.getMonthlyIncome = async (req, res, next) => {
  const date = new Date();
  const lastYear = new Date(date.setFullYear(date.getFullYear() - 1));

  try {
    let income = await Order.aggregate([
      { $match: { createdAt: { $gte: lastYear } } },
      {
        $project: {
          // $project : chỉ định các field mong muốn truy vấn.
          month: { $month: "$createdAt" },
          sales: "$totalPrice",
        },
      },
      {
        $group: {
          // $group: nhóm các document theo điều kiện nhất định
          _id: "$month",
          total: { $sum: "$sales" },
        },
      },
    ]);
    res.status(200).json(income);
  } catch (err) {
    res.status(500).json(err);
  }
};

// Delete order - ADMIN  =>   /api/v1/admin/order/:id
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Không tìm thấy đơn hàng", 404));
  }

  await order.remove();

  res.status(200).json({
    success: true,
    message: "Đơn hàng đã được xóa thành công",
  });
});
