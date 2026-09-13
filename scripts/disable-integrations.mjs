import ts from 'typescript';
import fs from 'node:fs';

const file = 'public/assets/main-B2LH-fDE.js';
const source = fs.readFileSync(file, 'utf8');
const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const edits = [];
function visit(node) {
  if (ts.isCallExpression(node) && node.arguments.length >= 2) {
    const [tag, props] = node.arguments;
    const propsText = props.getText(tree);
    const isAgentScript = ts.isStringLiteral(tag) && tag.text === 'script' && propsText.includes('application/webmcp+json');
    const isAgentComponent = ts.isIdentifier(tag) && tag.text === 'K1' && propsText.includes('instance:');
    if (isAgentScript || isAgentComponent) {
      edits.push({start:node.getStart(tree),end:node.end});
      return;
    }
  }
  ts.forEachChild(node, visit);
}
visit(tree);
let result = source;
for (const edit of edits.sort((a,b)=>b.start-a.start)) result = result.slice(0,edit.start)+'null'+result.slice(edit.end);
fs.writeFileSync(file,result);
console.log(`Disabled ${edits.length} nonvisual external agent integrations.`);
