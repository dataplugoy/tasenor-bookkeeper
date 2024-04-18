import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import path from 'path';
import pkg from './package.json'

const config: Config = {
  title: 'Tasenor Project',
  tagline: 'Documentation',
  favicon: 'favicon.ico',

  // Set the production url of your site here
  url: 'https://docs.stg.tasenor.com',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'dataplugoy',
  projectName: 'tasenor-bookkeeper',

  onBrokenLinks: 'warn', // TODO: Should be 'throw' once things are working.
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  staticDirectories: ['public'],

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://www.google-analytics.com',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'preconnect',
        href: 'https://www.googletagmanager.com',
      },
    },
    // https://developers.google.com/analytics/devguides/collection/gtagjs/#install_the_global_site_tag
    {
      tagName: 'script',
      attributes: {
        src: `https://www.googletagmanager.com/gtag/js?id=G-CSK289J8VK`,
      },
    },
    {
      tagName: 'script',
      attributes: {},
      innerHTML: `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', 'G-CSK289J8VK');
        `,
    },
  ],

  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
   // TODO: Open API plugin is too broken to be useful.
   // [
   //   'docusaurus-plugin-openapi-docs',
   //   {
   //     id: "api", // plugin id
   //     docsPluginId: "classic", // id of plugin-content-docs or preset for rendering docs
   //     config: {
   //       bookkeeperApi: { // the <id> referenced when running CLI commands
   //         specPath: "api/openapi.yaml", // path to OpenAPI spec, URLs supported
   //         outputDir: "docs/bookkeeper-api", // output directory for generated files
   //         sidebarOptions: { // optional, instructs plugin to generate sidebar.js
   //           groupPathsBy: 'tag',
   //         },
   //       },
   //     }
   //   },
   // ],
   [
     'docusaurus-plugin-typedoc-api',
     {
       projectRoot: path.join(__dirname, '..', '..'),
       packages: ['packages/tasenor-common', 'packages/tasenor-common-node', 'packages/tasenor-common-ui'],
     },
   ],
   [
    '@easyops-cn/docusaurus-search-local',
    {
      hashed: true,
    }
   ]
  ],

  themes: ['docusaurus-theme-openapi-docs', '@docusaurus/theme-mermaid'],

  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'logo.png',
    navbar: {
      title: 'Tasenor v' + pkg.version,
      logo: {
        alt: 'Tasenor Logo',
        src: 'logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docSidebarId',
          position: 'left',
          label: 'Documentation',
        },
        {
          type: 'docSidebar',
          sidebarId: 'swaggerSidebarId',
          position: 'left',
          label: 'API',
        },
        // {
        //   type: 'docSidebar',
        //   sidebarId: 'apiSidebarId',
        //   position: 'left',
        //   label: 'API',
        // },
        {
          to: 'api',
          position: 'left',
          label: 'Class Reference',
        },
        {
          href: 'https://github.com/dataplugoy/tasenor-bookkeeper',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },

    footer: {
      style: 'dark',
      links: [
        {
          title: 'Community',
          items: [
            {
              label: 'Discussion Forum',
              href: 'https://tasenor.freeforums.net/',
            },
          ],
        },
        {
          title: 'Source Code',
          items: [
            {
              label: 'Bookkeeper',
              href: 'https://github.com/dataplugoy/tasenor-bookkeeper',
            },
          ],
        },
        {
          title: 'Help',
          items: [
            {
              label: 'How to get help?',
              href: '/docs/guides/help',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Dataplug Oy, Built with Docusaurus.`,
    },

    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },

  } satisfies Preset.ThemeConfig,
};

export default config;
