import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { resolveCropName } from '../src/lib/units';
import { CropLifecycleEngine } from '../src/services/CropLifecycleEngine';
import { CropModelRegistry } from '../src/services/ai/CropModelRegistry';
import { getAgronomicPathology } from '../src/lib/crop-disease-knowledge';
import { DiseaseDiagnosisService } from '../src/services/DiseaseDiagnosisService';

describe('Part 1: Complete Multilingual Support', () => {
  it('has identical and comprehensive translation keys in EN, HI, GU', () => {
    const en = JSON.parse(fs.readFileSync('src/locales/en.json', 'utf8'));
    const hi = JSON.parse(fs.readFileSync('src/locales/hi.json', 'utf8'));
    const gu = JSON.parse(fs.readFileSync('src/locales/gu.json', 'utf8'));

    const coreKeys = [
      'crop_cycles', 'start_crop_cycle', 'active_crop_cycles', 'all_crops',
      'stage_planned', 'stage_sown', 'stage_growing', 'stage_flowering', 'stage_fruiting',
      'stage_harvest_ready', 'stage_harvested', 'stage_completed',
      'tasks', 'tasks_subtitle', 'add_task', 'filter_all', 'filter_pending', 'filter_completed',
      'identify_crop_optional', 'auto_detect_leaf', 'other_crop', 'enter_custom_crop',
      'what_to_do_now', 'why_it_matters', 'how_to_do_it', 'precautions', 'materials_inputs'
    ];

    for (const key of coreKeys) {
      expect(en[key], `en missing ${key}`).toBeDefined();
      expect(hi[key], `hi missing ${key}`).toBeDefined();
      expect(gu[key], `gu missing ${key}`).toBeDefined();
    }
  });

  it('correctly resolves crop name based on user locale', () => {
    const mockCrop: any = {
      id: 'crop-cotton',
      name: 'Cotton',
      translations: [
        { locale: 'hi', name: 'कपास' },
        { locale: 'gu', name: 'કપાસ' },
      ],
    };

    expect(resolveCropName(mockCrop, null, 'en')).toBe('Cotton');
    expect(resolveCropName(mockCrop, null, 'hi')).toBe('कपास');
    expect(resolveCropName(mockCrop, null, 'gu')).toBe('કપાસ');
  });

  it('generates natural agricultural Hindi and Gujarati stage guidance in CropLifecycleEngine', () => {
    const mockCycle: any = {
      id: 'cycle-1',
      sowingDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      crop: { name: 'Cotton' },
      stages: [
        { id: 's1', orderIndex: 1, nameSnapshot: 'Sowing & Emergence', templateStage: { code: 'sowing', startOffsetDays: 0, durationDays: 15 } },
        { id: 's2', orderIndex: 2, nameSnapshot: 'Vegetative Growth', templateStage: { code: 'vegetative', startOffsetDays: 15, durationDays: 30 } },
        { id: 's3', orderIndex: 3, nameSnapshot: 'Flowering', templateStage: { code: 'flowering', startOffsetDays: 45, durationDays: 30 } },
      ],
    };

    const planHi = CropLifecycleEngine.buildLifecyclePlan({ ...mockCycle, crop: { name: 'कपास' } }, 'hi');
    const planGu = CropLifecycleEngine.buildLifecyclePlan({ ...mockCycle, crop: { name: 'કપાસ' } }, 'gu');

    expect(planHi.stages[0].name).toBe('बुवाई एवं अंकुरण');
    expect(planGu.stages[0].name).toBe('વાવણી અને અંકુરણ');
    expect(planHi.stages[1].name).toBe('वानस्पतिक वृद्धि (शाखा विकास)');
    expect(planGu.stages[1].name).toBe('વાનસ્પતિક વૃદ્ધિ (શાખાઓનો વિકાસ)');

    expect(planHi.stages[1].whatToDo).toContain('कपास');
    expect(planGu.stages[1].whatToDo).toContain('કપાસ');
    expect(planHi.timelineNotice).toContain('अवस्था की तारीखें');
    expect(planGu.timelineNotice).toContain('અવસ્થાની તારીખો');
  });
});

describe('Part 2: Crop Disease Detection & Mismatch Fix', () => {
  it('promotes Sugarcane and Groundnut to specialist_active with valid models', () => {
    const sugarcane = CropModelRegistry.getCropById('sugarcane');
    expect(sugarcane).toBeDefined();
    expect(sugarcane?.status).toBe('specialist_active');
    expect(sugarcane?.supportedDiseasesCount).toBe(5);

    const model = CropModelRegistry.getModelForCrop('sugarcane');
    expect(model.modelId).toBe('sugarcane-pathology-net');
    expect(model.supportedClasses.length).toBe(5);

    const groundnut = CropModelRegistry.getCropById('groundnut');
    expect(groundnut?.status).toBe('specialist_active');
  });

  it('provides ICAR pathology details for Sugarcane diseases', () => {
    const redRot = getAgronomicPathology('sugarcane_red_rot');
    expect(redRot).toBeDefined();
    expect(redRot?.disease).toContain('Red Rot');
    expect(redRot?.chemicalOptions.some((c) => c.includes('Carbendazim'))).toBe(true);

    const smut = getAgronomicPathology('sugarcane_smut');
    expect(smut).toBeDefined();
    expect(smut?.disease).toContain('Smut');

    const rust = getAgronomicPathology('sugarcane_rust');
    expect(rust).toBeDefined();
  });

  it('diagnoses Cotton and Sugarcane independently without false crop mismatch', async () => {
    // Valid JPEG buffer with magic bytes
    const jpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x60, 0x00, 0x60, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
      0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
      0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
      0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20,
      0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29,
      0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32,
      0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x40,
      0x00, 0x40, 0x03, 0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01,
      0xff, 0xda, 0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00,
      0x3f, 0x00, 0xbf, 0x80, 0xff, 0xd9,
    ]);

    // Option A: Sugarcane explicitly selected
    const diagSugarcane = await DiseaseDiagnosisService.predict(jpegBuffer, 'sugarcane_leaf.jpg', 'image/jpeg', {
      requestedCrop: 'sugarcane',
      fieldCropName: null,
    });
    expect(diagSugarcane.status).not.toBe('crop_mismatch');
    expect(diagSugarcane.crop).toBe('Sugarcane');
    expect(diagSugarcane.pathology).toBeDefined();

    // Option B: Auto-detect (no crop selected)
    const diagAuto = await DiseaseDiagnosisService.predict(jpegBuffer, 'auto_leaf.jpg', 'image/jpeg', {
      requestedCrop: null,
      fieldCropName: null,
    });
    expect(diagAuto.status).not.toBe('crop_mismatch');
    expect(diagAuto.crop).toBeDefined();

    // Sequential test: Cotton upload followed by Sugarcane upload
    const diagCotton = await DiseaseDiagnosisService.predict(jpegBuffer, 'cotton_leaf.jpg', 'image/jpeg', {
      requestedCrop: 'cotton',
      fieldCropName: null,
    });
    expect(diagCotton.crop).toBe('Cotton');
    expect(diagCotton.status).not.toBe('crop_mismatch');

    const diagSugarcaneSeq = await DiseaseDiagnosisService.predict(jpegBuffer, 'sugarcane_leaf2.jpg', 'image/jpeg', {
      requestedCrop: 'sugarcane',
      fieldCropName: null,
    });
    expect(diagSugarcaneSeq.crop).toBe('Sugarcane');
    expect(diagSugarcaneSeq.status).not.toBe('crop_mismatch');
  });
});
