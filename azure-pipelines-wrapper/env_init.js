const spawnSync = require('child_process').spawnSync;
const execFile = require('child_process').execFile;
const lockfile = require('proper-lockfile');

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
        lockfile.lock('env_init_daemon.log')
        .then((release) => {
            app.log.info("[ DAEMON ] Start to run daemon process")
            execFile('./env_init_daemon.sh', { encoding: 'utf-8' })
            return release();
        })
        .catch((e) => {
            // either lock could not be acquired
            console.log(e)
        });
    }, 300000);
};

module.exports = {
    init,
    daemon_run,
}