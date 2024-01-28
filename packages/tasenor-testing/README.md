# Tasenor Testing

This package includes some tools for both manual and automated testing.
Unit tests that involves multiple other packages are also found from this
package.

## Debugging

### UI Tests

If UI test fails and you want to inspect situation yourself, you can browse
[http://localhost:7204/](http://localhost:7204/), since after failing test
the system is left running.

User accounts are

* root@localhost: passpass - super user
* robot@localhost: pass_pass4 - normal user for UI tests

To run test set visually
```
robot/bin/test-local-dev
```

## Cypress

To run cypress tests, you need
```
apt install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
```

TODO: Local Cypress test setup instructions.
