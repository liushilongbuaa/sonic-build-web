function init(app) {
    app.log.info("Init pr");

    app.on("issue_comment.created", async (context) => {
        var payload = context.payload;
        console.log(payload)
  });
};

module.exports = Object.freeze({
    init: init,
});
