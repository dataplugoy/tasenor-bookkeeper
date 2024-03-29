import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  docSidebarId: [{type: 'autogenerated', dirName: 'guides'}],
  swaggerSidebarId: [{type: 'autogenerated', dirName: 'api-docs'}],
  apiSidebarId: [{type: 'autogenerated', dirName: 'bookkeeper-api'}],
};

export default sidebars;
