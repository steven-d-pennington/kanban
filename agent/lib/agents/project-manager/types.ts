/**
 * Types for Project Manager Agent
 */

/**
 * Input for PRD generation
 */
export interface PRDInput {
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  projectContext: {
    id: string;
    name: string;
    description?: string;
    techStack?: string[];
    conventions?: Record<string, unknown>;
  };
}

/**
 * User persona in the PRD
 */
export interface Persona {
  name: string;
  description: string;
  needs: string[];
}

/**
 * Functional requirement
 */
export interface FunctionalRequirement {
  id: string;
  description: string;
  priority: 'must' | 'should' | 'could';
}

/**
 * Non-functional requirement
 */
export interface NonFunctionalRequirement {
  id: string;
  category: string;
  description: string;
}

/**
 * Acceptance criterion in Gherkin-style format
 */
export interface AcceptanceCriterion {
  id: string;
  scenario: string;
  given: string;
  when: string;
  then: string;
}

/**
 * Risk assessment item
 */
export interface Risk {
  description: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

/**
 * Complete PRD output structure
 */
export interface PRDOutput {
  summary: string;
  personas: Persona[];
  requirements: {
    functional: FunctionalRequirement[];
    nonFunctional: NonFunctionalRequirement[];
  };
  acceptanceCriteria: AcceptanceCriterion[];
  technicalConsiderations: string[];
  dependencies: string[];
  risks: Risk[];
  outOfScope: string[];
}
