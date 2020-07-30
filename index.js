const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const label = core.getInput('label');
    console.log('label', label);

    const token = core.getInput('token');
    console.log('got token');

    const octo = github.getOctokit(token, {
      // to get access to issue timeline events
      previews: ['mockingbird-preview'],
    });

    const { owner, repo } = github.context.repo;
    const { number, state } = github.context.payload.issue;
    console.log(`issue ${number} is ${state}`);

    const events = await octo.issues.listEventsForTimeline({ owner, repo, issue_number: number });
    const epics = events.data
      .filter(
        (ev) =>
          ev.event === 'cross-referenced' &&
          ev.source &&
          ev.source.issue &&
          ev.source.issue.labels.some((l) => l.name === label),
      )
      .map((ev) => ev.source.issue);
    console.log(`${epics.length} epics to update`);

    const setTo = state === 'closed' ? '- [x]' : '- [ ]';
    const prefix = setTo.length;
    const pattern = new RegExp(`- \\[([ x])].*#${number}($|[^0-9])`, 'g');
    await Promise.all(
      epics.map(async (epic) => {
        console.log(`updating ${epic.number}`);
        const body = epic.body.replace(pattern, (s) => setTo + s.substr(prefix));
        console.log('new body', body);
        return await octo.issues.update({ owner, repo, issue_number: epic.number, body });
      }),
    );
    console.log('done');
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();
