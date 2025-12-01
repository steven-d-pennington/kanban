/**
 * PRD Formatter
 *
 * Converts PRD output to markdown format for human readability.
 */

import type { PRDOutput } from './types';

/**
 * Format a PRD as markdown.
 */
export function formatPRD(prd: PRDOutput): string {
  const sections: string[] = [];

  // Header
  sections.push('# Product Requirements Document');
  sections.push('');

  // Executive Summary
  sections.push('## Executive Summary');
  sections.push('');
  sections.push(prd.summary);
  sections.push('');

  // User Personas
  if (prd.personas.length > 0) {
    sections.push('## User Personas');
    sections.push('');
    for (const persona of prd.personas) {
      sections.push(`### ${persona.name}`);
      sections.push('');
      sections.push(persona.description);
      sections.push('');
      sections.push('**Needs:**');
      for (const need of persona.needs) {
        sections.push(`- ${need}`);
      }
      sections.push('');
    }
  }

  // Functional Requirements
  if (prd.requirements.functional.length > 0) {
    sections.push('## Functional Requirements');
    sections.push('');
    sections.push('| ID | Requirement | Priority |');
    sections.push('|----|-------------|----------|');
    for (const req of prd.requirements.functional) {
      sections.push(`| ${req.id} | ${req.description} | ${req.priority} |`);
    }
    sections.push('');
  }

  // Non-Functional Requirements
  if (prd.requirements.nonFunctional.length > 0) {
    sections.push('## Non-Functional Requirements');
    sections.push('');
    sections.push('| ID | Category | Requirement |');
    sections.push('|----|----------|-------------|');
    for (const req of prd.requirements.nonFunctional) {
      sections.push(`| ${req.id} | ${req.category} | ${req.description} |`);
    }
    sections.push('');
  }

  // Acceptance Criteria
  if (prd.acceptanceCriteria.length > 0) {
    sections.push('## Acceptance Criteria');
    sections.push('');
    for (const ac of prd.acceptanceCriteria) {
      sections.push(`### ${ac.id}: ${ac.scenario}`);
      sections.push('');
      sections.push(`- **Given** ${ac.given}`);
      sections.push(`- **When** ${ac.when}`);
      sections.push(`- **Then** ${ac.then}`);
      sections.push('');
    }
  }

  // Technical Considerations
  if (prd.technicalConsiderations.length > 0) {
    sections.push('## Technical Considerations');
    sections.push('');
    for (const consideration of prd.technicalConsiderations) {
      sections.push(`- ${consideration}`);
    }
    sections.push('');
  }

  // Dependencies
  if (prd.dependencies.length > 0) {
    sections.push('## Dependencies');
    sections.push('');
    for (const dep of prd.dependencies) {
      sections.push(`- ${dep}`);
    }
    sections.push('');
  }

  // Risks
  if (prd.risks.length > 0) {
    sections.push('## Risks');
    sections.push('');
    sections.push('| Risk | Likelihood | Impact | Mitigation |');
    sections.push('|------|------------|--------|------------|');
    for (const risk of prd.risks) {
      sections.push(`| ${risk.description} | ${risk.likelihood} | ${risk.impact} | ${risk.mitigation} |`);
    }
    sections.push('');
  }

  // Out of Scope
  if (prd.outOfScope.length > 0) {
    sections.push('## Out of Scope');
    sections.push('');
    for (const item of prd.outOfScope) {
      sections.push(`- ${item}`);
    }
    sections.push('');
  }

  return sections.join('\n').trim();
}
