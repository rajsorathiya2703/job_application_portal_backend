import { RecruiterProfile } from './recruiterProfile.model';
import { Company } from '../company/company.model';
import { AppError } from '../../utils/apiError';
import { UpdateCompanyInput } from './recruiter.validation';

// ─── Profile ──────────────────────────────────────────────────────────────────

export const getMyProfile = async (userId: string) => {
  const profile = await RecruiterProfile.findOne({ user: userId }).populate('company');
  if (!profile) {
    throw new AppError(
      404,
      'Recruiter profile not found. Please set up your company first.'
    );
  }
  return profile;
};

// ─── Designation ──────────────────────────────────────────────────────────────

export const updateDesignation = async (
  userId: string,
  designation: string | undefined
) => {
  const profile = await RecruiterProfile.findOneAndUpdate(
    { user: userId },
    { $set: { designation } },
    { new: true }
  ).populate('company');

  if (!profile) {
    throw new AppError(
      404,
      'Recruiter profile not found. Please set up your company first.'
    );
  }
  return profile;
};

// ─── Company ──────────────────────────────────────────────────────────────────

export const createOrUpdateCompany = async (
  userId: string,
  data: UpdateCompanyInput
) => {
  const existingProfile = await RecruiterProfile.findOne({ user: userId });

  if (!existingProfile) {
    // First-time setup: company.name is required
    if (!data.name || data.name.trim() === '') {
      throw new AppError(400, 'Company name is required for first-time setup');
    }

    // Create Company first (company must exist before RecruiterProfile)
    const company = await Company.create({
      ...data,
      createdBy: userId,
    });

    // Create RecruiterProfile linked to the new company
    const profile = await RecruiterProfile.create({
      user: userId,
      company: company._id,
    });

    return RecruiterProfile.findById(profile._id).populate('company');
  }

  // Update existing company
  const updatedCompany = await Company.findByIdAndUpdate(
    existingProfile.company,
    { $set: data },
    { new: true }
  );

  if (!updatedCompany) {
    throw new AppError(404, 'Associated company not found');
  }

  return RecruiterProfile.findById(existingProfile._id).populate('company');
};
