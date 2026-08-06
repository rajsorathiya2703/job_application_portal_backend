import { Tag } from './tag.model';
import { CreateTagInput } from './tag.validation';

// ─── Create Tag ───────────────────────────────────────────────────────────────

export const createTag = async (data: CreateTagInput) => {
  const tag = await Tag.create(data);
  return tag;
};

// ─── List Tags ────────────────────────────────────────────────────────────────

export const getTags = async (appliesOn?: 'job' | 'skill') => {
  const filter = appliesOn ? { appliesOn } : {};
  const tags = await Tag.find(filter).sort({ createdAt: -1 });
  return tags;
};
