function init(app) {
    app.log.info("Init pr");

    app.on("pull_request", async (context) => {
        var payload = context.payload;
        console.log(payload.action)
        console.log(payload.pull_request.html_url)
  });
};

module.exports = Object.freeze({
    init: init,
});
