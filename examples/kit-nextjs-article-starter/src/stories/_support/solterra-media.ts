/**
 * Solterra media library items that stories and landing page manifests may reference.
 *
 * `src` is a local copy served from `.storybook/public` so previews work without a
 * Sitecore session; `mediaId` is the real media item in the Solterra media library and
 * is what gets written to Sitecore image fields when a page is published.
 */
export type SolterraMedia = {
  mediaId: string;
  sitecorePath: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

export const SOLTERRA_MEDIA = {
  windmills: {
    mediaId: 'b80d28e1-ebbc-49e6-a965-70070ac4087b',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Windmills',
    src: '/solterra/windmills.jpg',
    alt: 'Windmills',
    width: 1184,
    height: 666,
  },
  solarPanels: {
    mediaId: '684ce003-47fc-4a46-a0b3-e190ca1f4d85',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Solar Panels',
    src: '/solterra/solar-panels.jpg',
    alt: 'Solar panels',
    width: 1183,
    height: 788,
  },
  italy: {
    mediaId: 'f8a68a36-ad81-4420-86d0-c2fdfe5ae094',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Italy Image',
    src: '/solterra/italy-image.jpg',
    alt: 'Hillside town at sunset',
    width: 1196,
    height: 636,
  },
  tropicalBird: {
    mediaId: '050b55b3-4a2c-4288-8d32-282d10a77ec9',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/tropical bird',
    src: '/solterra/tropical-bird.jpg',
    alt: 'Tropical bird',
    width: 900,
    height: 600,
  },
  hero1: {
    mediaId: 'e42f56f1-ebaa-4450-b32a-9bcf1ef6cc45',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Hero1',
    src: '/solterra/hero1.png',
    alt: 'Community members outdoors',
    width: 1009,
    height: 778,
  },
  hero2: {
    mediaId: '9fda38d2-e66f-4da3-98fd-8643bcfd9664',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Hero2',
    src: '/solterra/hero2.png',
    alt: 'Portrait',
    width: 255,
    height: 333,
  },
  femaleAuthor: {
    mediaId: '2ad901a3-2709-4e68-a1f2-4f583ee5637f',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/female_author',
    src: '/solterra/female_author.png',
    alt: 'Female author',
    width: 1024,
    height: 1024,
  },
  womanInGlasses: {
    mediaId: '404145d5-d955-4e19-9bb8-b9e23923138c',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Woman in glasses',
    src: '/solterra/woman-in-glasses.jpg',
    alt: 'Woman with glasses',
    width: 754,
    height: 604,
  },
  womanInSand: {
    mediaId: 'ddd4a2d5-a723-4a19-96bb-d783921e6757',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/woman in sand',
    src: '/solterra/woman-in-sand.jpg',
    alt: 'Woman in sand',
    width: 600,
    height: 611,
  },
  boxes: {
    mediaId: 'c23ec2b1-9b7e-4190-ad43-0c1821a0b637',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Boxes',
    src: '/solterra/boxes.jpg',
    alt: 'Boxes',
    width: 859,
    height: 910,
  },
  woman1: {
    mediaId: 'dd4d2fb9-7e2d-41ac-a718-d173c23e79d8',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Woman1',
    src: '/solterra/woman1.png',
    alt: 'Woman smiling',
    width: 344,
    height: 356,
  },
  woman3: {
    mediaId: '1d13a18b-c2eb-4d80-a6bc-22d85f2589b5',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Woman3',
    src: '/solterra/woman3.jpg',
    alt: 'Woman at work',
    width: 903,
    height: 602,
  },
  woman3Square: {
    mediaId: 'e0d46c29-cd99-4def-932f-430eb4335f54',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Woman3-Square',
    src: '/solterra/woman3-square.jpg',
    alt: 'Woman at work',
    width: 666,
    height: 602,
  },
  productKit: {
    mediaId: '1b0945c5-d65c-488e-b72e-45983a61000d',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/The Ordinary Kit',
    src: '/solterra/the-ordinary-kit.png',
    alt: 'Product kit',
    width: 371,
    height: 340,
  },
  logo: {
    mediaId: 'e732c884-8655-4a03-b8b0-f7eba817e231',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Logo',
    src: '/solterra/logo.webp',
    alt: 'Solterra & Co.',
    width: 164,
    height: 30,
  },
  logoWhite: {
    mediaId: '0101754b-3fa9-4d44-8c7a-92e5f72e68c2',
    sitecorePath: '/sitecore/media library/Feature/Solterra/images/Footer Logo',
    src: '/solterra/footer-logo.webp',
    alt: 'Solterra & Co.',
    width: 164,
    height: 30,
  },
} as const satisfies Record<string, SolterraMedia>;

export type SolterraMediaKey = keyof typeof SOLTERRA_MEDIA;
