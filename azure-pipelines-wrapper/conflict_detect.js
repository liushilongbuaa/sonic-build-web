const spawnSync = require('child_process').spawnSync;
const { Octokit } = require('@octokit/rest');
const akv = require('./keyvault');
const InProgress = 'in_progress'
const MsConflict = 'ms_conflict'
const MsChecker = 'ms_checker'
const { v4: uuidv4 } = require('uuid');
const COMPLETED = 'completed'
const FAILURE = 'failure'
const SUCCESS = 'success'

async function check_create(app, context, uuid, owner, repo, commit, check_name, result, status, output_title, output_summary){
    let check = await context.octokit.rest.checks.create({
        owner: owner,
        repo: repo,
        head_sha: commit,
        name: check_name,
        conclusion: result,
        status: status,
        output: {
            title: output_title,
            summary: output_summary,
        },
    });
    app.log.info([`[ CONFLICT DETECT ] [${uuid}]`, check.status, check.body].join(" "))
}

function init(app) {
    app.log.info("[ CONFLICT DETECT ] Init conflict detect");

    app.on( ["pull_request.opened", "pull_request.synchronize", "pull_request.reopened", "issue_comment.created"] , async (context) => {
        var payload = context.payload;
        const uuid = uuidv4()
        var full_name = payload.repository.full_name
        var owner = full_name.split('/')[0]
        var repo = full_name.split('/')[1]
        if ("sonic-net/sonic-buildimage" != full_name) {
            app.log.info(`[ CONFLICT DETECT ] [${uuid}] repo not match!`)
            return
        }

        var url, number, commit, base_branch, pr_owner, check_suite
        var gh_token = await akv.getSecretFromCache("GH_TOKEN")
        var script_branch = await akv.getSecretFromCache("CONFLICT_SCRIPT_BRANCH")
        var msazure_token = await akv.getSecretFromCache("MSAZURE_TOKEN")


        var param = Array()
        if (payload.issue && payload.action == "created") {
            // issue_comment.created
            let comment_body = payload.comment.body.trim().toLowerCase()
            if (!payload.issue.pull_request) {
                app.log.error(`[ CONFLICT DETECT ] [${uuid}] no PR found, exit!`)
                return
            }
            url = payload.issue.html_url
            number = payload.issue.number.toString()
            let pr = await context.octokit.rest.pulls.get({
                owner: owner,
                repo: repo,
                pull_number: number,
            });
            commit = pr.data.head.sha
            base_branch = pr.data.base.ref
            pr_owner = pr.data.head.user.login
            if (comment_body.startsWith(`/azpw ${MsConflict}`)) {
                check_suite = MsConflict
            } else if (comment_body.startsWith(`/azpw ${MsChecker}`)) {
                check_suite = MsChecker
                if (pr_owner != 'liushilongbuaa'){ return }; //TODO remove test line.
            } else {
                app.log.info(`[ CONFLICT DETECT ] [${uuid}] comment: ${comment_body}, exit!`)
                return
            }
            check_create(app, context, uuid, owner, repo, commit, check_suite, "", InProgress, check_suite, InProgress)
            comment_body=comment_body.replace('/azpw ', '')
            param.push(`ACTION="${comment_body}"`)
        } else {
            // pull_request.opened/synchronize/reopend
            url = payload.pull_request.html_url
            number = payload.number.toString()
            commit = payload.pull_request.head.sha
            base_branch = payload.pull_request.base.ref
            pr_owner = payload.pull_request.user.login
            param.push(`ACTION=ALL`)
            check_suite = "ALL"
            check_create(app, context, uuid, owner, repo, commit, MsConflict, "", InProgress, "ms code conflict", InProgress)
            if (pr_owner == 'liushilongbuaa')  { check_create(app, context, uuid, owner, repo, commit, MsChecker, "", InProgress, "", "") } //TODO remove test line.
        }
        app.log.info([`[ CONFLICT DETECT ] [${uuid}]`, url, number, commit, base_branch, pr_owner, check_suite].join(" "))
        param.push(`REPO=${repo}`)
        param.push(`GH_TOKEN=${gh_token}`)
        param.push(`MSAZURE_TOKEN=${msazure_token}`)
        param.push(`SCRIPT_BRANCH=${script_branch}`)
        param.push(`SCRIPT_NAME=ms_conflict_detect.sh`)
        param.push(`PR_NUMBER=${number}`)
        param.push(`PR_URL=${url}`)
        param.push(`PR_OWNER=${pr_owner}`)
        param.push(`PR_BASE_BRANCH=${base_branch}`)

        // If it belongs to ms, comment on PR.
        var description = '', comment_at = '', mspr = '', tmp = ''
        var run = spawnSync('./conflict_detect.sh', param, { encoding: 'utf-8' })
        for (const line of run.stdout.split(/\r?\n/)){
            if (line.includes("pr_owner: ")){
                comment_at = line.split(' ').pop()
            }
            if (line.includes("ms_pr: ") && mspr == ''){
                mspr = line.split(' ').pop()
            }
            if (line.includes("ms_pr_new: ")){
                mspr = line.split(' ').pop()
            }
            if (line.includes("tmp dir: ")){
                tmp = line.split(' ').pop()
            }
        }
        app.log.info(`[ CONFLICT DETECT ] [${uuid}] ${mspr}, ${tmp}`)

        if (run.status == 254) {
            app.log.info([`[ CONFLICT DETECT ] [${uuid}] Conflict detected!`, url].join(" "))
            description = `@${comment_at} PR: ${url} is conflict with MS internal repo<br>${mspr}<br>Please push fix commit to sonicbld/precheck/head/${number}<br>Then approve PR and comment "/azpw ms_conflict" in github PR.`
            check_create(app, context, uuid, owner, repo, commit, MsConflict, FAILURE, COMPLETED, "Code conflict with ms repo!", description)
        }
        if (run.status == 253){
            description = `@${comment_at} Conflict already exists in ${base_branch}<br>Please wait a few hours to run ms_conflict again!`
            check_create(app, context, uuid, owner, repo, commit, MsConflict, FAILURE, COMPLETED, "Please wait a few hours and run again.", description)
        }
        if (run.status == 252 || run.status == 254){
            description = `Please check result in ${mspr}`
            check_create(app, context, uuid, owner, repo, commit, MsChecker, "", InProgress, "MS PR validation", description)
        }
        if (run.status == 0){
            app.log.info(`[ CONFLICT DETECT ] [${uuid}] Check passed! check_suite ${check_suite}`)
            if ( ['ALL',MsConflict].includes(check_suite) ) {
                check_create(app, context, uuid, owner, repo, commit, MsConflict, SUCCESS, COMPLETED, "MS conflict detect", mspr)
            }
            if ( ['ALL',MsChecker].includes(check_suite) ) {
                check_create(app, context, uuid, owner, repo, commit, MsChecker, SUCCESS, COMPLETED, "MS PR validation", mspr)
            }
        }
        if ( ! [0, 254, 253, 252].includes(run.status) ){
            app.log.error(`[ CONFLICT DETECT ] [${uuid}] Exit Code: ${run.status}`)
        }
    });
};

module.exports = Object.freeze({
    init: init,
});
