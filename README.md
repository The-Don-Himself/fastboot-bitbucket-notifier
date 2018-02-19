## FastBoot Bitbucket Notifier

This notifier for the [FastBoot App Server][app-server] works with Bitbucket Builds to poll for new successful builds for a specified ref / branch.

[app-server]: https://github.com/ember-fastboot/fastboot-app-server

To use the notifier, configure it with your Bitbucket API token(App Password) and your repo:

```js
const FastBootAppServer = require('fastboot-app-server');
const BitbucketNotifier    = require('fastboot-bitbucket-notifier');

let notifier = new BitbucketNotifier({
  url:      'https://api.bitbucket.com',    // Bitbucket API host, defaults to https://api.bitbucket.com
  username: 'don_omondi',                   // your Bitbucket username
  password: '123456789Password',            // your Bitbucket app password
  repo:     'my-app/ember.js',              // name of your repo
  poll:     60 * 1000                       // optional polling interval, defaults to 60 * 1000 i.e every minute
});

let server = new FastBootAppServer({
  notifier: notifier
});
```

When the notifier starts, it will poll the API for the specified repository and branch. Once a new successful build is found, it will tell the FastBoot App Server to fetch the latest version of the app.

If you like this, you may also be interested in the companion [fastboot-bitbucket-downloader](https://github.com/campus-discounts/fastboot-bitbucket-downloader), which downloads the most recent build artifact for the specified ref.
