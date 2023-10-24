const akv = require('./keyvault');
const spawnSync = require('child_process').spawnSync;
const repo = 'sonic-buildimage'

function init(app) {
    app.log.info("Init conflict detect");

    app.on(["pull_request.opened", "pull_request.synchronize", "pull_request.reopened", "issue_comment.created"], async (context) => {
        var payload = context.payload;
        console.log(payload.action)
        console.log(payload.pull_request.html_url)
        if (payload.repository.name != repo){
            console.log("repo not match")
            return 0
        }
        if (payload.action == "issue_comment.created"){
            issue_user_login = payload.issue.user.login;
            comment_user_login = payload.comment.user.login;
            comment_body = payload.comment.body.trim();
            if (issue_user_login != comment_user_login){
                return
            }
            if (comment_body.toLowerCase() != '/azpw run ms_conflict'){
                return
            }
        }

        var gh_token = await akv.getSecretFromCache("GH_TOKEN")
        var mssonic_token = await akv.getSecretFromCache("MSSONIC_TOKEN")
        var msazure_token = await akv.getSecretFromCache("MSAZURE_TOKEN")
        var conflict_script_branch = await akv.getSecretFromCache("CONFLICT_SCRIPT_BRANCH")
        console.log("script branch:", conflict_script_branch)

        var result = 'success'
        run = spawnSync('bash', ['./conflict_detect.sh', payload.pull_request.html_url, gh_token, mssonic_token, msazure_token, conflict_script_branch], { encoding: 'utf-8' })
        if ( run.status != 0 ) {
            result = 'failure'
            if ( run.status != 254) { console.log(run.status,run.output) };
        }
        var url = ''
        for ( const element of run.output[1].split(/\r?\n|\r|\n/g) ) {
            if ( element.startsWith('https://dev.azure') ) {
                url = element
                break
            }
        }

        var check = await context.octokit.rest.checks.create({
                owner: "liushilongbuaa",
                repo: repo,
                head_sha: payload.pull_request.head.sha,
                name: 'ms_conflict',
                conclusion: result,
                status: 'completed',
                output: {
                    title: "ms code conflict",
                    summary: "conflict details:\n" + url + "\nPlease resolve conflict in the PR by pushing to PRID-fix branch.\nThen comment on PR: /azpw run ms_conflict"
                }
            }
        );
        if ( check.status != 201 && check.status != 202 ) { console.log(check) }
  });
};

module.exports = Object.freeze({
    init: init,
});
