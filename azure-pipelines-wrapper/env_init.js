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
                return
            }
            throw(e)
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
        execFile('./env_init_daemon.sh', { encoding: 'utf-8' }, (error, stdout)=>{
            for (const line of stdout.split(/\r?\n/)){
                if (line.includes("ms_conflict.result: ")){
                    let pr_result = line.split(' ').pop()
                    if (pr_result.split('=').length == 2){
                        let pr = pr_result.split('=')[0]
                        let result = pr_result.split('=')[1]
                        app.log.info(["[ DAEMON ]", pr, result].join(" "));
                    }
                }
            }
        })
        fs.rmdirSync("daemon_lock");
    }, 30000);
};

module.exports = {
    init,
    daemon_run,
}