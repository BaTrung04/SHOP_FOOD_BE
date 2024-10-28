const express = require("express");
const router = express.Router();

const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");
const {
  newCategory,
  getCategory,
  deleteCategory,
  getSingleCategory,
  updateCategory,
} = require("../controllers/categoryController");

router.route("/category").get(getCategory);

router
  .route("/admin/category")
  .post(isAuthenticatedUser, authorizeRoles("admin"), newCategory);

router.route("/category/:id").get(isAuthenticatedUser, getSingleCategory);
router
  .route("/admin/category/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateCategory);

router
  .route("/admin/category/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteCategory);

module.exports = router;
