const HOME_PATH = '/sitecore/content/nextjs-article_starter/solterra/Home';

/**
 * Existing Solterra pages (site `solterra`). Landing page manifests use these keys for
 * internal links and for the parent of a new page.
 */
export const SOLTERRA_PAGES = {
  home: { id: '43919bef-1195-48e9-afc6-e5e165241400', route: '/', itemPath: HOME_PATH },
  about: { id: '5ed52178-8f06-49be-9d4c-f191e650189e', route: '/About', itemPath: `${HOME_PATH}/About` },
  solutions: {
    id: '14588770-d56f-4b9f-96a3-eb7628fda4e6',
    route: '/Solutions',
    itemPath: `${HOME_PATH}/Solutions`,
  },
  platform: {
    id: '443edd44-ffc4-4f91-8d54-f6a7a663122b',
    route: '/Platform',
    itemPath: `${HOME_PATH}/Platform`,
  },
  pricing: { id: '2abfce36-ba65-4872-b6bb-6167a0749beb', route: '/Pricing', itemPath: `${HOME_PATH}/Pricing` },
  company: { id: '6f709c8a-95b6-4e74-8495-b2b5aea5da3b', route: '/Company', itemPath: `${HOME_PATH}/Company` },
  howItWorks: {
    id: '2e39244f-c8f0-400e-b3ea-6417f8f80723',
    route: '/How-It-Works',
    itemPath: `${HOME_PATH}/How It Works`,
  },
  resources: {
    id: 'c971b680-0d6e-4399-bee3-1c566f38cbf6',
    route: '/Resources',
    itemPath: `${HOME_PATH}/Resources`,
  },
  articles: {
    id: '7880ef4a-bef4-491c-9759-f273d6ef9c93',
    route: '/Articles',
    itemPath: `${HOME_PATH}/Articles`,
  },
  search: { id: '51cd4884-54eb-4a84-9a63-c697cb09f87f', route: '/Search', itemPath: `${HOME_PATH}/Search` },
} as const;

export type SolterraPageKey = keyof typeof SOLTERRA_PAGES;
