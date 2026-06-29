const BaseRepository = require('./baseRepository');
const Category = require('../models/Category');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }

  findAllSorted() {
    return this.model.find().sort({ name: 1 });
  }
}

module.exports = new CategoryRepository();
