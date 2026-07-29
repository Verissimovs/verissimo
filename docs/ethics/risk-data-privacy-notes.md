# Risk And Data Privacy Notes

## Study Risk Level

Expected risk level: low, if testing is limited to fictional scenarios and no personal benefits advice is provided.

Confidence: medium. Final classification depends on Southampton Solent University ethics review.

## Main Ethical Risks

| Risk | Level | Mitigation |
|---|---|---|
| Participant treats the prototype as official advice | High | Repeated disclaimer in information sheet, consent form, opening script and UI. Researcher must not advise on real entitlement. |
| Participant discloses sensitive personal data | High | Use fictional scenarios only. Do not ask for or record real health, income, immigration, benefits, address, identity or National Insurance details. Stop and redirect if disclosed. |
| Benefits or end-of-life wording causes distress | Medium | Warn before participation. Allow skip/stop at any time. Make end-of-life task optional. |
| LLM explanation appears authoritative | Medium | Explain that the rules engine decides and LLM only paraphrases. Keep official source links visible. Do not present output as final entitlement. |
| Accessibility barriers affect participation | Medium | Use WCAG-oriented design and browser-level axe checks. Record accessibility issues during testing. |
| Accidental re-identification through quotes | Medium | Use participant codes and remove identifying details from quotes. |

## Data Minimisation

Collect only:

- participant code,
- task success or failure,
- usability notes,
- anonymised comments,
- questionnaire answers.

Do not collect:

- full name in research dataset,
- address,
- National Insurance number,
- actual benefit claim details,
- real health or disability details,
- income or savings,
- immigration status,
- login credentials.

## Prototype Data Handling

Current implementation has no user accounts and no project database. Questionnaire answers are used for the session flow and assessment result. The printable report is generated client-side through browser printing.

The Gemini LLM provider is server-side and receives a bounded assessment trace for explanation paraphrasing. It must not be sent real participant personal data during usability testing because participants use fictional scenarios only.

## Storage Of Research Notes

Recommended handling:

- store notes in a university-approved location,
- use participant codes such as P1, P2 and P3,
- keep consent forms separate from anonymised observation notes,
- restrict access to the student and supervisor,
- delete raw notes after the retention period approved by the ethics submission.

Retention period to confirm in ethics submission: `[insert retention period]`.

## Dissertation Reporting

Report aggregated findings and anonymised quotes only. Avoid any quote that could identify a participant through personal circumstances.

