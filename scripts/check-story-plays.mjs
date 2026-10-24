// Visible stories stay still for visitors: a play function that clicks, types
// or drags belongs on a hidden twin (tagged '!dev'). A visible story whose play
// function only reads the screen opts in with the 'read-only-play' tag.
// Usage: node scripts/check-story-plays.mjs [path to the built index.json]
import { readFileSync } from 'node:fs';

const path = process.argv[2] ?? 'storybook-static/index.json';
const { entries } = JSON.parse(readFileSync(path, 'utf8'));
const stories = Object.values(entries).filter(entry => entry.type === 'story');
// Storybook tags a story with a play function 'play-fn', and drops 'dev' from
// stories hidden with '!dev'.
const offenders = stories.filter(
  ({ tags = [] }) =>
    tags.includes('dev') && tags.includes('play-fn') && !tags.includes('read-only-play')
);

if (offenders.length > 0) {
  console.error('These visible stories have a play function:');
  for (const story of offenders) {
    console.error(`  ${story.id} (${story.importPath})`);
  }
  console.error(
    "Move an interactive play function to a hidden twin (tags: ['!dev', '!autodocs']), or tag a read-only one 'read-only-play'. See CONTRIBUTING.md."
  );
  process.exit(1);
}
console.log(
  `  ${stories.length} stories checked: no visible story has an interactive play function`
);
