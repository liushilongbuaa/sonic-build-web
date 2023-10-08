require('dotenv').config()
const fs = require('fs')

const { Server, Probot } = require("probot");
const app = require("./index.js");
const privateKeyPath = process.env.PRIVATE_KEY_PATH
console.log(privateKeyPath)
const privateKey = fs.readFileSync(privateKeyPath, 'utf8')
const secret = process.env.WEBHOOK_SECRET
//const akv = require('./keyvault.js');

async function startServer() {
//    var privateKey = await akv.getAppPrivateKey();
//    var secret = await akv.getAppWebhookSecret();
    console.log("secret", secret)
    console.log("privateKey", privateKey)
    console.log("APP_ID", process.env.APP_ID)
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
