'use client';

import { useMemo, useState } from 'react';
import {
  QUESTIONS,
  SECTION_LABELS,
  SECTION_ORDER,
  type QuestionConfig,
} from '@/lib/intake/questions';
import {
  buildPrintableReport,
  buildUsabilitySessionExport,
  getDecisiveCriterion,
  outcomeCopy,
  outcomeTone,
  sortAssessmentsForDisplay,
} from '@/lib/intake/results';
import type {
  Answers,
  Assessment,
  AssessedCriterion,
  ComplementarySource,
} from '@/lib/rules/schema';

interface AssessResponse {
  assessments: Assessment[];
}

export function AssessmentApp() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<string>>(() => new Set());
  const [assessments, setAssessments] = useState<Assessment[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const currentQuestion = QUESTIONS[currentIndex];
  const isLastQuestion = currentIndex === QUESTIONS.length - 1;
  const currentQuestionAnswered = answeredQuestions.has(currentQuestion.id);
  const sectionProgress = useMemo(
    () => new Set(QUESTIONS.slice(0, currentIndex + 1).map((question) => question.section)),
    [currentIndex],
  );

  function updateAnswer(question: QuestionConfig, value: string | number | boolean | undefined) {
    setError('');
    setAnsweredQuestions((existing) => new Set(existing).add(question.id));
    setAnswers((existing) => {
      const next = { ...existing };
      if (value === undefined || value === '') {
        delete next[question.answerKey];
      } else {
        next[question.answerKey] = value;
      }
      return next;
    });
  }

  async function handleContinue() {
    if (!currentQuestionAnswered) {
      setError('Choose an answer, or choose Not sure.');
      return;
    }

    if (!isLastQuestion) {
      setCurrentIndex((index) => index + 1);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) throw new Error('Assessment request failed');

      const data = (await response.json()) as AssessResponse;
      setAssessments(sortAssessmentsForDisplay(data.assessments));
    } catch {
      setError('The assessment could not be calculated. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function resetSession() {
    setAnswers({});
    setAnsweredQuestions(new Set());
    setAssessments(null);
    setCurrentIndex(0);
    setError('');
  }

  return (
    <main className="assessment-shell" id="main-content">
      <a className="skip-link" href="#assessment-content">
        Skip to assessment
      </a>
      <header className="assessment-header">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">
            V
          </span>
          <div>
            <h1>VERISSIMO</h1>
            <p>Decision lab</p>
          </div>
        </div>
        <nav className="primary-nav" aria-label="Primary navigation">
          <a href="#main-content" aria-current="page">
            Home
          </a>
          <a href="#how-it-works">How it works</a>
          <a href="#benefits-covered">Benefits</a>
          <a href="#assessment-content">Assessment</a>
        </nav>
        <div className="header-actions">
          <button className="secondary-button" type="button" onClick={resetSession}>
            Clear session
          </button>
        </div>
      </header>

      <LandingIntro />
      <DisclaimerBanner />

      <section className="assessment-panel" id="assessment-content" aria-live="polite" aria-busy={isLoading}>
        {assessments ? (
          <ResultsView answers={answers} assessments={assessments} onReset={resetSession} />
        ) : (
          <>
            <SectionProgress
              current={currentQuestion.section}
              completed={sectionProgress}
              currentStep={currentIndex + 1}
              totalSteps={QUESTIONS.length}
            />
            <div className="question-meta">
              <span>{SECTION_LABELS[currentQuestion.section]}</span>
              <span>
                Question {currentIndex + 1} of {QUESTIONS.length}
              </span>
            </div>
            <QuestionStep
              question={currentQuestion}
              answers={answers}
              isAnswered={currentQuestionAnswered}
              onAnswer={(value) => updateAnswer(currentQuestion, value)}
            />
            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="wizard-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setError('');
                  setCurrentIndex((index) => Math.max(0, index - 1));
                }}
                disabled={currentIndex === 0 || isLoading}
              >
                Back
              </button>
              <button className="primary-button" type="button" onClick={handleContinue} disabled={isLoading}>
                {isLoading ? 'Checking...' : isLastQuestion ? 'See results' : 'Continue'}
              </button>
            </div>
          </>
        )}
      </section>

      <footer className="privacy-note">
        No account. No database. Answers stay in this session unless you clear or close the page.
      </footer>
    </main>
  );
}

function LandingIntro() {
  return (
    <div className="landing-intro">
      <section className="hero-section" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="hero-pills" aria-label="VERISSIMO principles">
            <span>AI-assisted explanations</span>
            <span>Rule-based assessment</span>
            <span>Transparent sources</span>
          </div>
          <h2 id="hero-title" aria-label="Your guide to UK welfare benefits">
            Your guide to UK welfare <span>benefits</span>
          </h2>
          <p>
            VERISSIMO helps you understand which benefits may be worth reviewing, what evidence you may need,
            and where to find trusted information before speaking to a qualified adviser.
          </p>
          <div className="hero-actions">
            <a className="primary-button hero-button" href="#assessment-content">
              Start a new assessment
            </a>
            <a className="secondary-button hero-button" href="#how-it-works">
              Learn how it works
            </a>
          </div>
          <p className="hero-privacy">Your data is private in this prototype. We do not store your answers.</p>
          <div className="source-status" aria-label="Source model">
            <span>Rule engine active</span>
            <span>CPAG primary source</span>
            <span>GOV.UK complementary check</span>
          </div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a guided benefits checklist">
          <div className="visual-bubble pound">£</div>
          <div className="visual-bubble doc">DOC</div>
          <div className="visual-family" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="visual-checklist">
            <strong>Your checklist</strong>
            <ul>
              <li>Check relevant rules</li>
              <li>Review evidence list</li>
              <li>Understand next steps</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="trust-card-grid" aria-label="Key VERISSIMO safeguards">
        <InfoCard
          tone="blue"
          title="Smart guidance"
          body="AI can explain your result in simpler language, but it does not decide eligibility."
          label="AI"
        />
        <InfoCard
          tone="green"
          title="Trusted rules"
          body="Assessments are based on explicit rule files with CPAG source trace and GOV.UK checks."
          label="RB"
        />
        <InfoCard
          tone="yellow"
          title="Evidence made easy"
          body="Result cards show documents that may help when a criterion is met."
          label="EV"
        />
        <InfoCard
          tone="red"
          title="Private by design"
          body="There is no account, no database and no persistent storage of personal answers."
          label="PR"
        />
      </section>

      <section className="overview-grid">
        <div className="how-it-works-card" id="how-it-works">
          <h3>How it works</h3>
          <ol className="process-steps">
            <li>
              <span>1</span>
              <strong>Answer questions</strong>
              <p>Tell us about a fictional or study scenario step by step.</p>
            </li>
            <li>
              <span>2</span>
              <strong>We check rules</strong>
              <p>The system compares answers with deterministic rule files.</p>
            </li>
            <li>
              <span>3</span>
              <strong>Get clear results</strong>
              <p>See which benefits may be worth reviewing and why.</p>
            </li>
            <li>
              <span>4</span>
              <strong>Review evidence</strong>
              <p>Use the checklist and source trace for next-step discussion.</p>
            </li>
          </ol>
        </div>

        <div className="benefits-card" id="benefits-covered">
          <h3>Benefits we currently cover</h3>
          <ul className="benefit-list">
            <BenefitListItem title="Attendance Allowance" description="Support for care needs after State Pension age." />
            <BenefitListItem title="Universal Credit" description="Support for living costs and low income." />
            <BenefitListItem title="Personal Independence Payment" description="Support for daily living and mobility needs." />
            <BenefitListItem title="More benefits planned" description="Further benefits can be added through new rule files." />
          </ul>
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  tone,
  title,
  body,
  label,
}: {
  tone: 'blue' | 'green' | 'yellow' | 'red';
  title: string;
  body: string;
  label: string;
}) {
  return (
    <article className={`info-card ${tone}`}>
      <span aria-hidden="true">{label}</span>
      <div>
        <h3>{title}</h3>
        <p>{body}</p>
      </div>
    </article>
  );
}

function BenefitListItem({ title, description }: { title: string; description: string }) {
  return (
    <li>
      <span aria-hidden="true">{title.slice(0, 2).toUpperCase()}</span>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </li>
  );
}

function DisclaimerBanner() {
  return (
    <aside className="disclaimer" aria-label="Important disclaimer">
      <strong>This is not official advice.</strong> VERISSIMO is a study tool. Always check CPAG Welfare Rights,
      GOV.UK, or a qualified adviser before acting on a benefits decision.
    </aside>
  );
}

function SectionProgress({
  current,
  completed,
  currentStep,
  totalSteps,
}: {
  current: QuestionConfig['section'];
  completed: Set<QuestionConfig['section']>;
  currentStep: number;
  totalSteps: number;
}) {
  const percent = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="progress-block">
      <div
        aria-label="Assessment progress"
        aria-valuemax={totalSteps}
        aria-valuemin={1}
        aria-valuenow={currentStep}
        className="progress-meter"
        role="progressbar"
      >
        <span style={{ width: `${percent}%` }} />
      </div>
      <ol className="section-progress" aria-label="Assessment sections">
        {SECTION_ORDER.map((section) => (
          <li className={section === current ? 'current' : completed.has(section) ? 'complete' : ''} key={section}>
            {SECTION_LABELS[section]}
          </li>
        ))}
      </ol>
    </div>
  );
}

function QuestionStep({
  question,
  answers,
  isAnswered,
  onAnswer,
}: {
  question: QuestionConfig;
  answers: Answers;
  isAnswered: boolean;
  onAnswer: (value: string | number | boolean | undefined) => void;
}) {
  const value = answers[question.answerKey];
  const helperId = `${question.id}-helper`;

  return (
    <fieldset className="question-step" aria-describedby={helperId}>
      <legend>{question.label}</legend>
      <p id={helperId}>{question.helperText}</p>

      {question.type === 'boolean' ? (
        <div className="answer-grid">
          <AnswerButton active={value === true} onClick={() => onAnswer(true)}>
            Yes
          </AnswerButton>
          <AnswerButton active={value === false} onClick={() => onAnswer(false)}>
            No
          </AnswerButton>
          <AnswerButton active={isAnswered && value === undefined} onClick={() => onAnswer(undefined)}>
            Not sure
          </AnswerButton>
        </div>
      ) : (
        <div className="number-answer">
          <label htmlFor={question.id}>Enter a number</label>
          <input
            aria-describedby={helperId}
            id={question.id}
            inputMode="numeric"
            min={question.min}
            max={question.max}
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(event) => {
              const raw = event.target.value;
              onAnswer(raw === '' ? undefined : Number(raw));
            }}
          />
          <button
            aria-pressed={isAnswered && value === undefined}
            className="text-button"
            type="button"
            onClick={() => onAnswer(undefined)}
          >
            I am not sure
          </button>
        </div>
      )}
    </fieldset>
  );
}

function AnswerButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={active ? 'answer-button selected' : 'answer-button'}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ResultsView({
  answers,
  assessments,
  onReset,
}: {
  answers: Answers;
  assessments: Assessment[];
  onReset: () => void;
}) {
  function exportStudyJson() {
    const exported = buildUsabilitySessionExport({
      answers,
      assessments,
      exportedAt: new Date().toISOString(),
    });
    const json = JSON.stringify(exported, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `verissimo-usability-session-${exported.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="results-view">
      <div className="results-heading">
        <div>
          <p className="eyebrow">Assessment result</p>
          <h2>Benefits worth reviewing</h2>
        </div>
        <div className="results-actions">
          <button
            aria-label="Export anonymised usability session JSON"
            className="secondary-button"
            type="button"
            onClick={exportStudyJson}
          >
            Export study JSON
          </button>
          <button className="secondary-button" type="button" onClick={onReset}>
            Start again
          </button>
        </div>
      </div>
      <div className="result-grid">
        {assessments.map((assessment) => (
          <BenefitResultCard assessment={assessment} key={assessment.benefitId} />
        ))}
      </div>
    </div>
  );
}

export function BenefitResultCard({ assessment }: { assessment: Assessment }) {
  const copy = outcomeCopy(assessment.outcome);
  const decisive = getDecisiveCriterion(assessment);
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [isPrintSelected, setIsPrintSelected] = useState(false);
  const report = buildPrintableReport(assessment, explanation);
  const headingId = `${assessment.benefitId}-result-heading`;

  async function explainSimply() {
    setIsExplaining(true);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assessment }),
      });

      if (!response.ok) throw new Error('Explain request failed');
      const data = (await response.json()) as { explanation: { text: string } };
      setExplanation(data.explanation.text);
    } catch {
      setExplanation(
        `${assessment.benefitName}: ${copy.label}. ${copy.description} This is not official advice.`,
      );
    } finally {
      setIsExplaining(false);
    }
  }

  function printReport() {
    setIsPrintSelected(true);
    requestAnimationFrame(() => {
      window.print?.();
      setIsPrintSelected(false);
    });
  }

  return (
    <article
      aria-labelledby={headingId}
      className={`result-card ${outcomeTone(assessment.outcome)}`}
      data-print-selected={isPrintSelected ? 'true' : undefined}
    >
      <div className="result-card-header">
        <h3 id={headingId}>{assessment.benefitName}</h3>
        <span aria-label={`Assessment outcome: ${copy.label}`}>{copy.label}</span>
      </div>
      <p>{copy.description}</p>
      {assessment.path ? (
        <p className="path-note">
          Assessment path: <strong>{assessment.path.label}</strong>
        </p>
      ) : null}
      {decisive ? <DecisiveCriterion criterion={decisive} /> : null}
      {assessment.missingAnswers.length > 0 && assessment.outcome !== 'unlikely' ? (
        <p className="missing-note">{assessment.missingAnswers.length} answer(s) still needed for this rule file.</p>
      ) : null}
      <div className="result-card-actions">
        <div className="simple-explanation-action">
          <button
            aria-busy={isExplaining}
            aria-label={`Make ${assessment.benefitName} result easier to read`}
            className="secondary-button"
            type="button"
            onClick={explainSimply}
            disabled={isExplaining}
          >
            {isExplaining ? 'Rewriting explanation...' : 'Make this easier to read'}
          </button>
        </div>
        <div className="print-action">
          <button
            aria-label={`Print ${assessment.benefitName} report`}
            className="secondary-button"
            type="button"
            onClick={printReport}
          >
            Print report
          </button>
        </div>
      </div>
      {explanation ? (
        <div className="simple-explanation">
          <h4>Simpler explanation</h4>
          <p>{explanation}</p>
        </div>
      ) : null}
      <PrintableReportView report={report} />
      <ComplementarySources sources={assessment.complementarySources ?? []} />
      <EvidenceList assessment={assessment} />
      <details className="trace-details">
        <summary>
          Show {assessment.benefitName} CPAG rule trace
          {(assessment.complementarySources ?? []).length > 0
            ? ' and GOV.UK complementary sources'
            : ''}
        </summary>
        <CriteriaTrace criteria={assessment.criteria} />
      </details>
    </article>
  );
}

function PrintableReportView({ report }: { report: ReturnType<typeof buildPrintableReport> }) {
  return (
    <section className="print-report" aria-label={`${report.benefitName} printable report`}>
      <p className="eyebrow">Printable report</p>
      <h4>{report.title}</h4>
      <dl className="report-meta">
        <div>
          <dt>Outcome</dt>
          <dd>{report.outcomeLabel}</dd>
        </div>
        <div>
          <dt>Generated</dt>
          <dd>{report.generatedAt}</dd>
        </div>
        <div>
          <dt>Rules version</dt>
          <dd>{report.rulesVersion}</dd>
        </div>
        {report.pathLabel ? (
          <div>
            <dt>Assessment path</dt>
            <dd>{report.pathLabel}</dd>
          </div>
        ) : null}
      </dl>
      <p>{report.outcomeDescription}</p>
      {report.explanation ? (
        <>
          <h5>Simple explanation</h5>
          <p>{report.explanation}</p>
        </>
      ) : null}
      <h5>Missing answers</h5>
      {report.missingAnswers.length > 0 ? (
        <ul>
          {report.missingAnswers.map((answer) => (
            <li key={answer}>{answer}</li>
          ))}
        </ul>
      ) : (
        <p>None.</p>
      )}
      <h5>Evidence to gather</h5>
      {report.evidence.length > 0 ? (
        <ul>
          {report.evidence.map((item) => (
            <li key={item.id}>
              <strong>{item.label}</strong>: {item.why}
            </li>
          ))}
        </ul>
      ) : (
        <p>No evidence recommendations yet.</p>
      )}
      <h5>Complementary official sources</h5>
      {report.complementarySources.length > 0 ? (
        <ul>
          {report.complementarySources.map((source) => (
            <li key={source.url}>
              <strong>{source.label}</strong>
              <p>{source.description}</p>
              <p>{source.url}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>None.</p>
      )}
      <h5>Rule trace and sources</h5>
      <ul>
        {report.criteria.map((criterion) => (
          <li key={criterion.id}>
            <strong>
              {criterion.id} - {criterion.status}
            </strong>
            <p>{criterion.explanation}</p>
            <p>{criterion.sourceUrl}</p>
          </li>
        ))}
      </ul>
      <p className="report-disclaimer">
        This is not official advice. Check CPAG Welfare Rights, GOV.UK, or speak to a qualified adviser before
        acting on a benefits decision.
      </p>
    </section>
  );
}

function ComplementarySources({ sources }: { sources: ComplementarySource[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="complementary-sources">
      <h4>{sources.length === 1 ? 'Complementary official source' : 'Complementary official sources'}</h4>
      <ul>
        {sources.map((source) => (
          <li key={source.url}>
            <strong>{source.label}</strong>
            <span>{source.description}</span>
            <a href={source.url} target="_blank" rel="noreferrer">
              Open GOV.UK source
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DecisiveCriterion({ criterion }: { criterion: AssessedCriterion }) {
  return (
    <div className="decisive-criterion">
      <strong>Decisive rule:</strong>
      <p>{criterion.explanation}</p>
      <a href={criterion.sourceUrl} target="_blank" rel="noreferrer">
        Check source on CPAG
      </a>
    </div>
  );
}

function EvidenceList({ assessment }: { assessment: Assessment }) {
  if (assessment.recommendedEvidence.length === 0) {
    return <p className="empty-evidence">No evidence recommendations yet.</p>;
  }

  return (
    <div className="evidence-list">
      <h4>Evidence to gather</h4>
      <ul>
        {assessment.recommendedEvidence.map((evidence) => (
          <li key={evidence.id}>
            <strong>{evidence.label}</strong>
            <span>{evidence.why}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CriteriaTrace({ criteria }: { criteria: AssessedCriterion[] }) {
  return (
    <ul className="criteria-trace">
      {criteria.map((criterion) => (
        <li key={criterion.id}>
          <span className="criterion-status">{criterionStatus(criterion)}</span>
          <div>
            <strong>{criterion.id}</strong>
            <p>{criterion.explanation}</p>
            <a href={criterion.sourceUrl} target="_blank" rel="noreferrer">
              CPAG source
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

function criterionStatus(criterion: AssessedCriterion): string {
  if (criterion.met === true) return 'Met';
  if (criterion.met === false) return 'Not met';
  return 'Missing';
}
