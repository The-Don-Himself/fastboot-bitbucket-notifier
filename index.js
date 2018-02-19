'use strict';

const request   = require('request');

function AppNotFoundError(message) {
  let error = new Error(message);
  error.name = 'AppNotFoundError';

  return error;
}

/*
 * Notifier class that notifies Fastboot App Server of a new Ember build artifact from Bitbucket to download.
 */
class BitbucketNotifier {
  constructor(options) {
    this.ui = options.ui;

    this.url = options.url || 'https://api.bitbucket.org';
    this.username = options.username;
    this.password = options.password;
    this.filename = options.filename;

    this.repo = options.repo;

    this.pollTime = options.poll || 300 * 1000;

    let url = this.url;
    let repo = this.repo;
    let filename = this.filename;

    this.fileUrl = url + '/2.0/repositories/' + repo + '/downloads/' + filename;
  }

  subscribe(notify) {
    let addon = this;

    addon.notify = notify;

    return addon.fetchCurrentLastModified()
      .then((lastModified) => {
        addon.fastbootLastModified = lastModified;
        addon.schedulePoll();
      });
  }

  fetchCurrentLastModified() {
    let addon = this;

    let fileUrl = addon.fileUrl;
    let username = addon.username;
    let password = addon.password;

    let options = {
        method: 'GET', // Would prefer a Head request but they are not supported
        uri: fileUrl,
        auth: {
            user: username,
            pass: password,
            sendImmediately: true
        }
    };

    addon.ui.writeLine('domain     : ' + addon.url);
    addon.ui.writeLine('repository : ' + addon.repo);
    addon.ui.writeLine('filename   : ' + addon.filename);

    return new Promise((res, rej) => {
        request(options)
        .on('response', function(response) {
            let filename,
                contentDisp = response.headers['content-disposition'];
            if (contentDisp && /^attachment/i.test(contentDisp)) {
                filename = contentDisp.toLowerCase()
                    .split('filename=')[1]
                    .split(';')[0]
                    .replace(/"/g, '');
            }

            if(!filename){
                addon.ui.writeError('Did Not Find Zip File, Notifications Aborted.');
                rej(new AppNotFoundError());
            } else {
                addon.ui.writeLine('Found Zip File : ' + filename);

                let lastModified = response.getHeader("Last-Modified");
                addon.ui.writeLine('Last-Modified : ' + lastModified);

                res(lastModified);
            }
        })
        .on('error', function(error) {
            console.log('error:', error); // Print the error if one occurred
            addon.ui.writeError('could not fetch repo build artifact');
            rej(new AppNotFoundError());
        });
    });
  }

  schedulePoll() {
    let addon = this;

    addon.ui.writeLine("Polling With In Intervals Of : " + addon.pollTime / 1000 + " seconds");
    setTimeout(() => {
      addon.poll();
    }, addon.pollTime);
  }

  poll() {
    let addon = this;

    addon.fetchCurrentLastModified()
      .then((lastModified) => {
        addon.compareDates(lastModified);
        addon.schedulePoll();
      })
      .catch(() => {
        addon.ui.writeError("An Error Occurred While Polling!");
      });
  }

  compareDates(lastModified) {
    let addon = this;

    if (lastModified !== this.fastbootLastModified) {
      addon.ui.writeLine("New Build Found");
      addon.fastbootLastModified = lastModified;
      addon.notify();
    }
  }
}


module.exports = BitbucketNotifier;
