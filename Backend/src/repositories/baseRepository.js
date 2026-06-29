class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  create(data) {
    return this.model.create(data);
  }

  findById(id) {
    return this.model.findById(id);
  }

  findOne(query) {
    return this.model.findOne(query);
  }

  find(query = {}) {
    return this.model.find(query);
  }

  count(query = {}) {
    return this.model.countDocuments(query);
  }

  updateById(id, data, options = { new: true }) {
    return this.model.findByIdAndUpdate(id, data, options);
  }

  deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

module.exports = BaseRepository;
