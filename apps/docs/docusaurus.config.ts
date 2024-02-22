import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

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
  // organizationName: '', // Usually your GitHub org/user name.
  // projectName: '', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    [
      'docusaurus-plugin-openapi-docs',
      {
        id: "api", // plugin id
        docsPluginId: "classic", // id of plugin-content-docs or preset for rendering docs
        config: {
          bookkeeperApi: { // the <id> referenced when running CLI commands
            specPath: "api/openapi.yaml", // path to OpenAPI spec, URLs supported
            outputDir: "docs/api", // output directory for generated files
            sidebarOptions: { // optional, instructs plugin to generate sidebar.js
              groupPathsBy: 'tag',
            },
          },
        }
      },
    ]
  ],

  themes: ["docusaurus-theme-openapi-docs"], // export theme components

  themeConfig: {
    // Replace with your project's social card
    image: 'logo.jpg',
    navbar: {
      title: 'Tasenor',
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
          sidebarId: 'apiSidebarId',
          position: 'left',
          label: 'API',
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
              href: 'https://github.com/dataplugoy/tasenor-bookkeeper',
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
