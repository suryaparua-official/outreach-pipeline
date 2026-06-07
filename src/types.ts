export interface Company {
  domain: string;
  name?: string;
}

export interface DecisionMaker {
  firstName: string;
  lastName: string;
  title: string;
  linkedinUrl: string;
  companyDomain: string;
  personId?: string;
  email?: string;
}

export interface Contact {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  companyDomain: string;
}

export interface PipelineResult {
  companies: Company[];
  decisionMakers: DecisionMaker[];
  contacts: Contact[];
  emailsSent: number;
}
