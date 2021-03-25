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
    repoName = appConfig["GitHubRepoName"];
    token = ${{GitHub_Token}};
    staleMinutes = parseInt(appConfig["MinutesForStaleIssues"], 10);
}

module.exports = async function (context, myTimer) {
    context.log('function triggered.');
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
