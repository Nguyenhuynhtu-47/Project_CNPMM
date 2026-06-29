const { compactObject, toObject } = require('./commonDto');

const toCoursePayload = (body = {}) => compactObject({
  title: body.title,
  description: body.description,
  price: body.price,
  imageUrl: body.imageUrl,
  category: body.category,
  durationWeeks: body.durationWeeks,
  sessionCount: body.sessionCount,
  status: body.status
});

const toCategoryPayload = (body = {}) => compactObject({
  name: body.name,
  description: body.description
});

const toCourseResponse = (course) => {
  const item = toObject(course);
  if (!item) return null;

  return {
    _id: item._id,
    title: item.title,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    category: item.category,
    durationWeeks: item.durationWeeks,
    sessionCount: item.sessionCount,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
};

const toCourseListResponse = (courses = [], pagination) => ({
  courses: courses.map(toCourseResponse),
  pagination
});

module.exports = {
  toCoursePayload,
  toCategoryPayload,
  toCourseResponse,
  toCourseListResponse
};
