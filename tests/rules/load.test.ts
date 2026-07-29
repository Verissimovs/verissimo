import { describe, it, expect, vi, afterEach } from 'vitest';
import path from 'node:path';
import { loadBenefit, loadAllBenefits } from '@/lib/rules/load';

describe('loadBenefit', () => {
  it('loads and validates the Attendance Allowance rules', () => {
    const { file } = loadBenefit('attendance-allowance');
    expect(file.benefit.id).toBe('attendance-allowance');
    expect(file.criteria.length).toBeGreaterThan(0);
  });

  it('gives every criterion an explanation and a source anchor', () => {
    const { file } = loadBenefit('attendance-allowance');
    for (const criterion of file.criteria) {
      expect(criterion.explanation.length).toBeGreaterThan(0);
      expect(criterion.source_anchor.length).toBeGreaterThan(0);
    }
  });

  it('produces a stable rules version for unchanged content', () => {
    expect(loadBenefit('attendance-allowance').rulesVersion)
      .toBe(loadBenefit('attendance-allowance').rulesVersion);
  });

  it('throws a helpful error for an unknown benefit', () => {
    expect(() => loadBenefit('does-not-exist')).toThrow(/does-not-exist/);
  });

  it('gives every evidence item a required_when that references real criteria', () => {
    for (const { file } of loadAllBenefits()) {
      const ids = new Set(file.criteria.map((c) => c.id));
      for (const evidence of file.evidence) {
        for (const ref of evidence.required_when) {
          expect(
            ids.has(ref),
            `${file.benefit.id}: evidence ${evidence.id} references unknown criterion ${ref}`,
          ).toBe(true);
        }
      }
    }
  });

  it('keeps Attendance Allowance aligned to CPAG primary and GOV.UK complementary sources', () => {
    const { file } = loadBenefit('attendance-allowance');

    expect(file.benefit.last_verified).toBe('2026-07-19');
    expect(file.benefit.source_url).toBe('https://cpag.org.uk/welfare-rights');
    expect(file.benefit.complementary_sources?.map((source) => source.url)).toEqual([
      'https://www.gov.uk/attendance-allowance/eligibility',
      'https://www.gov.uk/attendance-allowance/how-to-claim',
    ]);
    expect(file.criteria.map((criterion) => criterion.id)).toEqual([
      'aa-state-pension-age',
      'aa-disability',
      'aa-end-of-life-professional',
      'aa-care-need',
      'aa-duration',
      'aa-in-great-britain-when-claiming',
      'aa-gb-residence-history',
      'aa-habitual-residence',
      'aa-immigration-control',
      'aa-england-or-wales',
      'aa-no-overlapping-disability-benefit',
      'aa-care-home-funding',
    ]);
    expect(file.criteria.every((criterion) => criterion.source_anchor === '#online-handbooks')).toBe(true);
  });

  it('defines separate Attendance Allowance paths for ordinary and end-of-life rules', () => {
    const { file } = loadBenefit('attendance-allowance');

    expect(file.paths?.map((path) => ({ id: path.id, label: path.label }))).toEqual([
      { id: 'end_of_life', label: 'Special rules for end of life' },
      { id: 'ordinary', label: 'Ordinary Attendance Allowance rules' },
    ]);
    expect(file.paths?.[0].criteria).toContain('aa-end-of-life-professional');
    expect(file.paths?.[0].criteria).not.toContain('aa-duration');
    expect(file.paths?.[1].criteria).toContain('aa-duration');
  });

  it('uses Attendance Allowance claim details listed on GOV.UK as evidence prompts', () => {
    const { file } = loadBenefit('attendance-allowance');

    expect(file.evidence.map((item) => item.label)).toEqual([
      'National Insurance number',
      'Address and contact details',
      'Details of the disability or health condition that creates extra help needs',
      'GP surgery or medical centre details',
      'Care home, hospital or hospice details if you are currently staying in one',
      'SR1 form completed by a doctor or medical professional',
    ]);
  });
});

describe('loadAllBenefits', () => {
  it('loads every rules file in the directory', () => {
    expect(loadAllBenefits().length).toBeGreaterThanOrEqual(1);
  });

  it('loads the three in-scope Week 2 benefits', () => {
    expect(loadAllBenefits().map((benefit) => benefit.file.benefit.id).sort()).toEqual([
      'attendance-allowance',
      'personal-independence-payment',
      'universal-credit',
    ]);
  });
});

/**
 * O diretório de regras é resolvido a partir da localização do módulo, não
 * do cwd do processo. Um caminho baseado em `process.cwd()` só funciona
 * quando o processo nasce na raiz do projeto — funciona no `npm test` por
 * acidente de invocação, e quebra em qualquer runtime que defina o cwd de
 * outro jeito. Estes testes falham se alguém reintroduzir `process.cwd()`.
 */
describe('rules directory resolution', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads the rules regardless of the process working directory', () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.resolve('/nowhere-near-the-project'));
    expect(loadBenefit('attendance-allowance').file.benefit.id).toBe('attendance-allowance');
  });

  it('enumerates the rules directory regardless of the process working directory', () => {
    vi.spyOn(process, 'cwd').mockReturnValue(path.resolve('/nowhere-near-the-project'));
    expect(loadAllBenefits().length).toBeGreaterThanOrEqual(1);
  });
});
