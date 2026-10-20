import { describe, it, expect } from 'vitest';
import questionnaireDefaults from '@/data/intakeQuestionnaireDefaults.json';
import { FEATURE_CATEGORIES } from '../useIntakeFormState';

describe('FEATURE_CATEGORIES Catalog Integrity', () => {
  const catalogFeatures = questionnaireDefaults.features;

  it('contains all 18 catalog features across the 4 categories without orphans', () => {
    const allCategorizedFeatureIds = FEATURE_CATEGORIES.flatMap((c) => c.featureIds);
    expect(allCategorizedFeatureIds.length).toBe(18);

    const catalogIds = catalogFeatures.map((f) => f.id);
    expect(catalogIds.length).toBe(18);

    // Every catalog feature must be present in a category
    catalogIds.forEach((id) => {
      expect(allCategorizedFeatureIds).toContain(id);
    });

    // Every categorized feature must exist in the catalog
    allCategorizedFeatureIds.forEach((id) => {
      expect(catalogIds).toContain(id);
    });
  });

  it('restores Category 4 (engagement_cx) with cms, pwa, i18n, video', () => {
    const engagementCategory = FEATURE_CATEGORIES.find((c) => c.id === 'engagement_cx');
    expect(engagementCategory).toBeDefined();
    expect(engagementCategory?.title).toBe('Content, Mobile & CX Localization');
    expect(engagementCategory?.featureIds).toEqual(['cms', 'pwa', 'i18n', 'video']);
  });

  it('has zero phantom or non-existent IDs across all categories', () => {
    const phantomIds = ['search', 'reviews', 'multilingual', 'blog', 'analytics'];
    const allCategorizedFeatureIds = FEATURE_CATEGORIES.flatMap((c) => c.featureIds);

    phantomIds.forEach((phantom) => {
      expect(allCategorizedFeatureIds).not.toContain(phantom);
    });
  });
});
