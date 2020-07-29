const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const label = core.getInput('label');
    console.log('label', label);

    const token = core.getInput('token');
    console.log('got token');

    console.log(github.context);
    const octo = github.getOctokit(token);
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();
