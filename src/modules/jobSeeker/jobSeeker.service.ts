import mongoose from 'mongoose';
import { JobSeekerProfile } from './jobSeekerProfile.model';
import { AppError } from '../../utils/apiError';
import {
  UpdateProfileInput,
  EducationInput,
  ExperienceInput,
  ProjectInput,
} from './jobSeeker.validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

const findProfile = async (userId: string) => {
  const profile = await JobSeekerProfile.findOne({ user: userId }).populate(
    'skills',
    'title appliesOn'
  );
  if (!profile) {
    throw new AppError(404, 'Job seeker profile not found');
  }
  return profile;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getMyProfile = async (userId: string) => {
  return findProfile(userId);
};

export const updateMyProfile = async (
  userId: string,
  data: UpdateProfileInput
) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $set: data },
    { new: true }
  ).populate('skills', 'title appliesOn');

  if (!profile) {
    throw new AppError(404, 'Job seeker profile not found');
  }
  return profile;
};

// ─── Education ────────────────────────────────────────────────────────────────

export const addEducation = async (userId: string, data: EducationInput) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $push: { education: data } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};

export const updateEducation = async (
  userId: string,
  eduId: string,
  data: EducationInput
) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId, 'education._id': toObjectId(eduId) },
    { $set: { 'education.$': { ...data, _id: toObjectId(eduId) } } },
    { new: true }
  );
  if (!profile) {
    throw new AppError(404, 'Education entry not found');
  }
  return profile;
};

export const deleteEducation = async (userId: string, eduId: string) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $pull: { education: { _id: toObjectId(eduId) } } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};

// ─── Experience ───────────────────────────────────────────────────────────────

export const addExperience = async (userId: string, data: ExperienceInput) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $push: { experience: data } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};

export const updateExperience = async (
  userId: string,
  expId: string,
  data: ExperienceInput
) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId, 'experience._id': toObjectId(expId) },
    { $set: { 'experience.$': { ...data, _id: toObjectId(expId) } } },
    { new: true }
  );
  if (!profile) {
    throw new AppError(404, 'Experience entry not found');
  }
  return profile;
};

export const deleteExperience = async (userId: string, expId: string) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $pull: { experience: { _id: toObjectId(expId) } } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};

// ─── Projects ─────────────────────────────────────────────────────────────────

export const addProject = async (userId: string, data: ProjectInput) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $push: { projects: data } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};

export const updateProject = async (
  userId: string,
  projectId: string,
  data: ProjectInput
) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId, 'projects._id': toObjectId(projectId) },
    { $set: { 'projects.$': { ...data, _id: toObjectId(projectId) } } },
    { new: true }
  );
  if (!profile) {
    throw new AppError(404, 'Project not found');
  }
  return profile;
};

export const deleteProject = async (userId: string, projectId: string) => {
  const profile = await JobSeekerProfile.findOneAndUpdate(
    { user: userId },
    { $pull: { projects: { _id: toObjectId(projectId) } } },
    { new: true }
  );
  if (!profile) throw new AppError(404, 'Job seeker profile not found');
  return profile;
};
