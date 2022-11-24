/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const issue_comment = require('./issue_comment');
const check_run = require('./check_run');
const eventhub = require('./eventhub');

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  issue_comment.init(app);
  check_run.init(app);
  eventhub.init(app);

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
