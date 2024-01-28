/// <reference types="node" />
import { defineConfig } from 'cypress'

export default defineConfig({
    viewportHeight: 1080,
    viewportWidth: 1920,
    e2e: {
      watchForFileChanges: true,
      baseUrl: process.env.CYPRESS_URL,
      chromeWebSecurity: false,
      experimentalStudio: true,
      defaultCommandTimeout: 20000,
      taskTimeout: 20000,
      testIsolation: false,
      video: true,
      setupNodeEvents(on, config) {
        // implement node event listeners here
      },
    },
});
