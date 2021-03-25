var github = require('octonode');

var repoName = '';
var token = '';
var staleMinutes = 10;

async function updateIssue(client, repoName, issueId)
{
  console.log("=== Update Issue ===");
  var ghIssue = client.issue(repoName, issueId);
  await ghIssue.addLabelsAsync(['stale']);
  await ghIssue.createCommentAsync({body: 'This issue has been closed due to no activity in the last ' + staleMinutes + ' minutes'});
  await ghIssue.updateAsync({ state: 'closed' });
}

function ParseBody()
{
    repoName = process.env["GitHubRepoName"];
    token = process.env["GitHubToken"];
    staleMinutes = parseInt(process.env["MinutesForStaleIssues"], 10);
}

module.exports = async function (context, myTimer) {

    // 1. Parse arguments from body (repository name, token, stale config)
    // 2. Connect to GitHub using Token
    // 3. Query upto 100 open issues oldest to newest
    // 4. Iterate and find the issues that are stale
    // 5. Close all stale issues

    context.log('JavaScript HTTP trigger function processed a request.');
    try { 
    
    ParseBody();
    context.log("checking stale issues in " + repoName + ". Not updated in last " + staleMinutes + " minutes");
    var client = github.client(token);
    var ghRepo = client.repo(repoName);
    var issuesRet = await ghRepo.issuesAsync({page : 1, per_page : 100, state : 'open', sort : 'updated', direction : 'asc'});
    var retVal = JSON.stringify(issuesRet[0]);
    var issues = JSON.parse(retVal);
    var numberOfIssuesUpdated = 0; 

    context.log("number of issues returned : " + issues.length);
    
    for (var issue of issues) {
      context.log("----------------------------------------------");   
      context.log(issue.number + "," + issue.title + "," +  issue.updated_at);
      if (Date.now() - Date.parse(issue.updated_at) > staleMinutes * 60 * 1000) {
        context.log("Issue id : " + issue.number + " is stale");
        await updateIssue(client, repoName, issue.number);
        numberOfIssuesUpdated++;
      }
    }
     
    context.res = {
        // status: 200, /* Defaults to 200 */
        body: numberOfIssuesUpdated + " issues successfully updated as stale"
    };
} catch (error) {
    console.error(error);
    context.res = {
        status: 404,
        body: error
    };       
}
}