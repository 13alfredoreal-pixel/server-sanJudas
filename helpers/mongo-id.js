export const MONGO_OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

export const isMongoObjectId = (value) => MONGO_OBJECT_ID_RE.test(String(value || ''));
