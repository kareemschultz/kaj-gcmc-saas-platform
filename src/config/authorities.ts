// Guyana authority and agency configuration

export const AUTHORITIES = {
  GRA: {
    code: 'GRA',
    name: 'Guyana Revenue Authority',
    description: 'Tax and revenue collection',
    color: '#1e40af', // blue-800
  },
  NIS: {
    code: 'NIS',
    name: 'National Insurance Scheme',
    description: 'Social security and insurance',
    color: '#15803d', // green-700
  },
  DCRA: {
    code: 'DCRA',
    name: 'Deeds & Commercial Registries Authority',
    description: 'Business registration and incorporation',
    color: '#9333ea', // purple-600
  },
  Immigration: {
    code: 'Immigration',
    name: 'Immigration / Ministry of Home Affairs',
    description: 'Work permits, visas, and residence',
    color: '#c2410c', // orange-700
  },
} as const;

export type AuthorityCode = keyof typeof AUTHORITIES;

export function getAuthorityByCode(code: AuthorityCode) {
  return AUTHORITIES[code];
}

export function getAllAuthorities() {
  return Object.values(AUTHORITIES);
}
