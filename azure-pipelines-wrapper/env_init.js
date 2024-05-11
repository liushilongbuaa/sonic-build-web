const spawnSync = require('child_process').spawnSync;
const execFile = require('child_process').execFile;
const akv = require('./keyvault.js');
const { App, createNodeMiddleware } = require("@octokit/app");
const fs = require('fs');

async function init(app){
    while ( true ){
        let run = spawnSync('./env_init.sh', { encoding: 'utf-8' })
        if (run.status == 0){
            app.log.info(`[ INIT ] succeed!!!`)
            return
        }
        app.log.info(`[ INIT ] ${run.status} ${run.output}`)
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        await delay(3000)
    }
}

async function daemon_run(app){
    setInterval(async function() {
        try {
            fs.mkdirSync('daemon_lock')
        } catch(e) {
            if(e.code == 'EEXIST') {
                let lock = fs.statSync('daemon_lock').ctimeMs
                let now = Date.now()
                if (now - lock > 36000){
                    app.log.info("[ DAEMON ] lock more than 10 hours! go on.");
                } else {
                    app.log.info("[ DAEMON ] return!");
                    return
                }
            } else {
                throw(e)
            }
        }
        const privateKey = await akv.getAppPrivateKey();
        const secret = await akv.getAppWebhookSecret();
        let appclinet = new App({
            appId: process.env.APP_ID,
            privateKey: privateKey,
            webhooks: {
                secret: secret,
            },
        })
        let data = await appclinet.octokit.request("/app");
        app.log.info(["[ DAEMON ] START!", data.data.name].join(" "));
        execFile('bash', ['-c', 'env_init_daemon.sh 2>&1 | while IFS= read -r line; do echo [$(date +%FT%TZ)] $line | tee -a env_init_daemon.log; done'], { uid: 0, encoding: 'utf-8' }, (error, stdout, stderr)=>{
            for (const line of stdout.split(/\r?\n/)){
                if (line.includes("ms_checker.result: ")){
                    let pr_result = line.split(' ').pop()
                    if (pr_result.split('=').length == 2){
                        let pr = pr_result.split('=')[0]
                        let result = pr_result.split('=')[1]
                        app.log.info(["[ DAEMON ] Result:", pr, result].join(" "));
                    }
                }
            }
            app.log.info("[ DAEMON ] END!");
            fs.rmdirSync("daemon_lock");
        })
    }, 1* 3600 * 1000);
};

module.exports = {
    init,
    daemon_run,
}