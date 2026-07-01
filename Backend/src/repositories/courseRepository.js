const BaseRepository = require('./baseRepository');
const Course = require('../models/Course');

class CourseRepository extends BaseRepository {
  constructor() {
    super(Course);
  }

  
  findWithFilters(query, { sort, skip, limit }) {
    return this.model.find(query)
      .populate('category', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  findByIdWithCategory(id) {
    return this.model.findById(id).populate('category', 'name description');
  }
}

module.exports = new CourseRepository();
