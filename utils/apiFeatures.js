const flattenAndRemoveAccents = require("./plattenString");
class APIFeatures {
  constructor(query, queryStr, fieldSearch) {
    this.query = query;
    this.queryStr = queryStr;
    this.fieldSearch = fieldSearch;
  }

  search() {
    const keyword = this.queryStr.keyword
      ? {
          [this.fieldSearch || "name"]: {
            $regex: flattenAndRemoveAccents(this.queryStr.keyword),
            $options: "i",
          },
        }
      : {};

    this.query = this.query.find({ ...keyword });
    return this;
  }

  filter() {
    const queryCopy = { ...this.queryStr };

    // Removing fields from the query
    const removeFields = ["keyword", "limit", "page"];
    removeFields.forEach((el) => delete queryCopy[el]);

    // Advance filter for price, ratings etc
    let queryStr = JSON.stringify(queryCopy);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  pagination(perPage) {
    const numPerPage = +perPage;
    const currentPage = Number(this.queryStr.page) || 1;
    const skip = numPerPage * (currentPage - 1);

    this.query = this.query.limit(numPerPage).skip(skip);
    return this;
  }
}

module.exports = APIFeatures;
