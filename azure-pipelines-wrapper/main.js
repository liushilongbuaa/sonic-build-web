const { Server, Probot } = require("probot");
const app = require("./index.js");
const akv = require('./keyvault.js');
const fs = require('fs')

async function startServer() {
    //var privateKey = await akv.getAppPrivateKey();
    //var secret = await akv.getAppWebhookSecret();

    secret = process.env.WEBHOOK_SECRET
    privateKeyPath = process.env.PRIVATE_KEY_PATH
    privateKey = fs.readFileSync(privateKeyPath, 'utf8')

    const server = new Server({
        Probot: Probot.defaults({
        appId: process.env.APP_ID,
        privateKey: privateKey,
        secret: secret,
        }),
        port: process.env.PORT || '3000',
        webhookPath: process.env.WEBHOOK_PATH,
        webhookProxy: process.env.WEBHOOK_PROXY_URL,
    });

    server.expressApp.get("/", (req, res) => res.end("Welcome GitHub Application: Azure Pipelines Wrapper"));
    await server.load(app);

    server.start();
}


(async () => {
    const txt = await startServer();
    console.log("txt:", txt);
})();
