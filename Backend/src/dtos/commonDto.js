const toObject = (document) => {
  if (!document) return null;
  if (typeof document.toObject === 'function') return document.toObject();
  return document;
};

const compactObject = (value) => {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
};

module.exports = {
  toObject,
  compactObject
};
