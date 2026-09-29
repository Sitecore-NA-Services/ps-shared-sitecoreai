// Move every item version that sits in a non-final workflow state to the final
// state, so a publish can pick it up.
//
// Why this exists: the Item Transfer API copies master only. Items whose latest
// master version was still in Draft in the old org had an older *published*
// version in the old web database, which never came across. In the new org those
// items therefore never reach Edge until someone approves them.
//
// Usage (from tools/content-transfer, needs DST_* in .env.local):
//   node workflow-approve.mjs            # dry run: list what would be approved
//   node workflow-approve.mjs --apply    # execute the workflow commands
//   node workflow-approve.mjs --apply --state <stateGuid> --command <commandGuid>
//
// Default state/command pairs are the two Draft states found on ps-shared-dev
// (2026-09-29): Basic Datasource Workflow and Basic Workflow.
import { gql } from './_authoring.mjs';

const args = process.argv.slice(2);
const apply = args.includes('--apply');
const argVal = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

const DEFAULT_PAIRS = [
  {
    name: 'Basic Datasource Workflow: Draft -> Approve',
    state: '12ffac4c565f4c9ab63e7f77e96b4d1f',
    command: '5abaf974916d4d4aa23b0bc17ca34137',
  },
  {
    name: 'Basic Workflow: Draft -> Approve',
    state: '57cc7dcee6b1456495810e5850b8bdf2',
    command: '0854979d7956479ab84a43c63a296052',
  },
];

const pairs =
  argVal('--state') && argVal('--command')
    ? [{ name: 'custom', state: argVal('--state'), command: argVal('--command') }]
    : DEFAULT_PAIRS;

const PAGE = 50;

async function listInState(state) {
  const out = [];
  for (let page = 0; ; page++) {
    const data = await gql(
      `query($v:String!,$page:Int!,$size:Int!){
        search(query:{
          filterStatement:{ criteria:[{ field:"__workflow_state", value:$v, operator:MUST }] },
          latestVersionOnly:true,
          paging:{ pageIndex:$page, pageSize:$size }
        }){ totalCount results{ innerItem{ itemId path version language{ name } } } }
      }`,
      { v: state, page, size: PAGE }
    );
    const s = data?.search;
    if (!s) throw new Error('search failed');
    out.push(...s.results.map((r) => r.innerItem));
    if (out.length >= s.totalCount || s.results.length === 0) break;
  }
  return out;
}

async function approve(item, commandId) {
  const data = await gql(
    `mutation($id:ID!,$lang:String!,$ver:Int!,$cmd:String!){
      executeWorkflowCommand(input:{
        commandId:$cmd,
        comments:"Approved by migration tooling: version was live in the old org",
        item:{ itemId:$id, language:$lang, version:$ver }
      }){ successful error nextStateId }
    }`,
    { id: item.itemId, lang: item.language.name, ver: item.version, cmd: commandId }
  );
  return data?.executeWorkflowCommand;
}

// --force: when the workflow command is refused (typically "You cannot approve an
// item with validation errors" on a datasource with an empty required field),
// write the __Workflow state field directly to the command's target state. This
// is what an administrator does in Content Editor; it skips validation only.
const force = args.includes('--force');

async function nextStateOf(commandId) {
  const data = await gql(
    `query($id:ID!){ item(where:{itemId:$id}){ next:field(name:"Next state"){ value } } }`,
    { id: commandId }
  );
  return data?.item?.next?.value;
}

async function forceState(item, stateId) {
  const data = await gql(
    `mutation($id:ID!,$lang:String!,$ver:Int!,$state:String!){
      updateItem(input:{ itemId:$id, language:$lang, version:$ver,
        fields:[{ name:"__Workflow state", value:$state }] }){ item{ itemId } }
    }`,
    { id: item.itemId, lang: item.language.name, ver: item.version, state: stateId }
  );
  return Boolean(data?.updateItem?.item);
}

let total = 0;
let ok = 0;
let forced = 0;
let failed = 0;
for (const pair of pairs) {
  const items = await listInState(pair.state);
  console.log(`\n${pair.name}: ${items.length} item version(s)`);
  total += items.length;
  const targetState = force ? await nextStateOf(pair.command) : undefined;
  for (const it of items) {
    const label = `${it.path} [${it.language.name} v${it.version}]`;
    if (!apply) {
      console.log('  would approve', label);
      continue;
    }
    const res = await approve(it, pair.command);
    if (res?.successful) {
      ok++;
      console.log('  approved', label);
      continue;
    }
    if (force && targetState && (await forceState(it, targetState))) {
      forced++;
      console.log('  forced  ', label, '(', res?.error || 'command refused', ')');
      continue;
    }
    failed++;
    console.log('  FAILED  ', label, res?.error || JSON.stringify(res));
  }
}
console.log(
  `\n${apply ? 'applied' : 'dry run'}: ${total} total, ${ok} approved, ${forced} forced, ${failed} failed`
);
