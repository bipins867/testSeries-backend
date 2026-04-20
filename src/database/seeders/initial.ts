import bcrypt from 'bcryptjs';
import { Role, User, Exam, Subject, Topic } from '../models';
import { config } from '../../common/config';
import { logger } from '../../common/logger';
import { slugify, normalizeTopic } from '../../common/utils/slug';
import { ROLES } from '../../common/constants';

/**
 * Seed the database with initial data:
 * - Roles
 * - Super admin user
 * - Sample exam → subject → topic hierarchy for UPSC
 */
export async function runSeeders(): Promise<void> {
  try {
    // ─── Roles ─────────────────────────────────
    const roles = [
      { name: ROLES.USER, description: 'Regular user' },
      { name: ROLES.ADMIN, description: 'Administrator' },
      { name: ROLES.SUPER_ADMIN, description: 'Super administrator' },
    ];

    for (const role of roles) {
      await Role.findOrCreate({
        where: { name: role.name },
        defaults: role,
      });
    }
    logger.info('✅ Roles seeded.');

    // ─── Super Admin ─────────────────────────────────
    const superAdminRole = await Role.findOne({ where: { name: ROLES.SUPER_ADMIN } });
    if (!superAdminRole) throw new Error('Super admin role not found after seeding');

    const existingAdmin = await User.scope('full').findOne({ where: { email: config.admin.email } });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(config.admin.password, 12);
      await User.create({
        email: config.admin.email,
        password_hash: hashedPassword,
        first_name: config.admin.firstName,
        last_name: config.admin.lastName,
        role_id: superAdminRole.id,
        is_active: true,
      });
      logger.info(`✅ Super admin seeded: ${config.admin.email}`);
    } else {
      logger.info('ℹ️  Super admin already exists, skipping.');
    }

    // ─── Exam / Subject / Topic hierarchy ─────────────────────────────────
    const examData = {
      name: 'UPSC CSE Prelims',
      slug: 'upsc-cse-prelims',
      description: 'Union Public Service Commission Civil Services Examination Preliminary Test',
      subjects: [
        {
          name: 'Indian History',
          topics: [
            'Ancient Indian History',
            'Medieval Indian History',
            'Modern Indian History',
            'Harappan Civilization',
            'Vedic Period',
            'Maurya Empire',
            'Gupta Empire',
            'Mughal Empire',
            'British India',
            'Indian National Movement',
          ],
        },
        {
          name: 'Indian Polity',
          topics: [
            'Indian Constitution',
            'Fundamental Rights',
            'Directive Principles',
            'Parliament',
            'Judiciary',
            'Union Executive',
            'State Government',
            'Local Government',
            'Constitutional Amendments',
            'Election Commission',
          ],
        },
        {
          name: 'Geography',
          topics: [
            'Physical Geography',
            'Indian Geography',
            'World Geography',
            'Climatology',
            'Oceanography',
            'Geomorphology',
            'Indian Rivers',
            'Natural Resources',
          ],
        },
        {
          name: 'Indian Economy',
          topics: [
            'Indian Economy Basics',
            'Indian Agriculture',
            'Industrial Development',
            'Monetary Policy',
            'Fiscal Policy',
            'Foreign Trade',
            'Banking System',
            'Economic Reforms',
            'Budget and Finance',
          ],
        },
        {
          name: 'Science & Technology',
          topics: [
            'Science & Technology',
            'Space Technology',
            'Nuclear Technology',
            'Biotechnology',
            'Information Technology',
            'Defence Technology',
            'Health & Medicine',
          ],
        },
        {
          name: 'Environment & Ecology',
          topics: [
            'Environment & Ecology',
            'Biodiversity',
            'Climate Change',
            'Environmental Laws',
            'National Parks & Sanctuaries',
            'Pollution',
            'Sustainable Development',
          ],
        },
        {
          name: 'Current Affairs',
          topics: [
            'International Relations',
            'Government Schemes',
            'Important Acts & Bills',
            'Awards & Honours',
            'Summits & Conferences',
            'Reports & Indices',
          ],
        },
      ],
    };

    const [exam] = await Exam.findOrCreate({
      where: { slug: examData.slug },
      defaults: {
        name: examData.name,
        slug: examData.slug,
        description: examData.description,
        is_active: true,
        display_order: 1,
      },
    });

    for (let si = 0; si < examData.subjects.length; si++) {
      const subjectData = examData.subjects[si];
      const subjectSlug = slugify(subjectData.name);

      const [subject] = await Subject.findOrCreate({
        where: { exam_id: exam.id, slug: subjectSlug },
        defaults: {
          exam_id: exam.id,
          name: subjectData.name,
          slug: subjectSlug,
          is_active: true,
          display_order: si + 1,
        },
      });

      for (let ti = 0; ti < subjectData.topics.length; ti++) {
        const topicName = subjectData.topics[ti];
        const topicSlug = slugify(topicName);
        const normalizedName = normalizeTopic(topicName);

        await Topic.findOrCreate({
          where: { subject_id: subject.id, slug: topicSlug },
          defaults: {
            subject_id: subject.id,
            name: topicName,
            slug: topicSlug,
            normalized_name: normalizedName,
            is_active: true,
            question_count: 0,
            display_order: ti + 1,
          },
        });
      }
    }

    logger.info('✅ Exam/subject/topic catalog seeded.');
  } catch (error) {
    logger.error('❌ Seeder error:', error);
    throw error;
  }
}
