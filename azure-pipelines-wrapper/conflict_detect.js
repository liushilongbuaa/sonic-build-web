const akv = require('./keyvault');
const spawnSync = require('child_process').spawnSync;
const owner = 'sonic-net'
const repo = 'sonic-buildimage'

function init(app) {
    app.log.info("Init conflict detect");

    app.on(["pull_request.opened", "pull_request.synchronize", "pull_request.reopened", "issue_comment.created"], async (context) => {
        var payload = context.payload;
        var gh_token = await akv.getSecretFromCache("GH_TOKEN")
        var mssonic_token = await akv.getSecretFromCache("MSSONIC_TOKEN")
        var msazure_token = await akv.getSecretFromCache("MSAZURE_TOKEN")
        var conflict_script_url = await akv.getSecretFromCache("CONFLICT_SCRIPT_URL")
        var url, commit

        console.log(payload.action)
        if (payload.repository.name != repo){
            console.log("repo not match")
            return
        }
        if (payload.issue && payload.action == "created"){
            let issue_user_login = payload.issue.user.login;
            let comment_user_login = payload.comment.user.login;
            let comment_body = payload.comment.body.trim();
            if (comment_body.toLowerCase() != '/azpw ms_conflict'){
                return
            }
            if (! payload.issue.pull_request){
                return
            }
            url = payload.issue.html_url.toString();
            let number = url.split('/').slice(-1)[0]
            let pr = await context.octokit.rest.pulls.get({
                owner: owner,
                repo: repo,
                pull_number: number,
            });
            commit = pr.data.head.sha
        } else {
            url = payload.pull_request.html_url
            commit = payload.pull_request.head.sha
        }
        console.log(url)

        await context.octokit.rest.checks.create({
            owner: owner,
            repo: repo,
            head_sha: commit,
            name: 'ms_conflict',
            status: 'in_progress',
        }
        );
        console.log(url, gh_token, mssonic_token, msazure_token, conflict_script_url)
        var result = 'success'
        try {
            run = spawnSync('bash', ['./conflict_detect.sh', url, gh_token, mssonic_token, msazure_token, conflict_script_url], { encoding: 'utf-8' })
            console.log(run)
            if ( run.status != 0 ) {
                result = 'failure'
                if ( run.status != 254) { console.log(run.status,run) };
            }
        } catch (error) {
            console.log(error)
            return
        }
        
        url = ''
        for ( const element of run.output[1].split(/\r?\n|\r|\n/g) ) {
            if ( element.startsWith('https://dev.azure') ) {
                url = element
                break
            }
        }

        var check = await context.octokit.rest.checks.create({
                owner: owner,
                repo: repo,
                head_sha: commit,
                name: 'ms_conflict',
                conclusion: result,
                status: 'completed',
                output: {
                    title: "ms code conflict",
                    summary: "conflict details:\n" + url + "\nPlease resolve conflict in the PR by pushing to PRID-fix branch.\nThen comment on PR: /azpw ms_conflict"
                }
            }
        );
        if ( check.status != 201 && check.status != 202 ) { console.log(check) }
  });
};

module.exports = Object.freeze({
    init: init,
});
