const spawnSync = require('child_process').spawnSync;
const execFile = require('child_process').execFile;

async function init(app){
    while ( true ){
        let run = spawnSync('./env_init.sh', { encoding: 'utf-8' })
        app.log.info(`[ INIT ] ${run.status} ${run.output}`)
        if (run.status == 0){
            app.log.info(`[ INIT ] succeed!!!`)
            return
        }
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
        await delay(3000)
    }
}

async function daemon_run(app){
    setInterval(async function() {
        app.log.info("[ DAEMON ] Start to run daemon process")
        execFile('./env_init_daemon.sh', { encoding: 'utf-8' })
    }, 300000);
};

module.exports = {
    init,
    daemon_run,
}