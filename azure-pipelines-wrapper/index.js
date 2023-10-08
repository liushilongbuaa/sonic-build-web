/**
 * This is the main entrypoint to your Probot app
 * @param {import('probot').Probot} app
 */

const pr = require('./pr.js')

module.exports = (app) => {
  // Your code here
  app.log.info("Yay, the app was loaded!");

  pr.init(app)

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
};
