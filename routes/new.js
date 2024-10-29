const express = require("express");
const router = express.Router();

const {
  getNews,
  newNew,
  getSingleNew,
  updateNew,
  deleteNew,
} = require("../controllers/newController");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router.route("/news").get(getNews);

router
  .route("/admin/news")
  .post(isAuthenticatedUser, authorizeRoles("admin"), newNew);

router.route("/news/:id").get(getSingleNew);
router
  .route("/admin/news/:id")
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateNew);

router
  .route("/admin/news/:id")
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteNew);

module.exports = router;
