const profiles = Object.freeze({
  github: 'https://github.com/codagnoni',
  linkedin: 'https://www.linkedin.com/in/joao-codagnoni',
});
const form = document.querySelector('#prompt');
const input = document.querySelector('#command-input');
const output = document.querySelector('#history');
const storageKey = 'jcodagnoni.command-history';
let commands = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) commands = saved.filter(value => typeof value === 'string').slice(-100);
} catch { /* The terminal also works when browser storage is unavailable. */ }
let historyIndex = commands.length;
let draft = '';

function writeLine(text, className = 'terminal-output') {
  const line = document.createElement('p');
  line.className = className;
  line.textContent = text;
  output.append(line);
}
function setLine(value) {
  input.value = value;
  input.setSelectionRange(value.length, value.length);
}
function remember(command) {
  if (commands.at(-1) !== command) commands.push(command);
  commands = commands.slice(-100);
  historyIndex = commands.length;
  draft = '';
  try { localStorage.setItem(storageKey, JSON.stringify(commands)); } catch { /* Optional persistence. */ }
}
function noArguments(args, action) {
  if (!args.length) return true;
  writeLine(`Usage: ${action}`);
  return false;
}
const registry = {
  ls: {
    description: 'List profiles',
    run(args) {
      if (!noArguments(args, 'ls')) return;
      const line = document.createElement('p');
      line.className = 'terminal-output listed-links';
      Object.entries(profiles).forEach(([name, url]) => {
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = name;
        line.append(link);
      });
      output.append(line);
    },
  },
  open: {
    description: 'Open a profile: open <github|linkedin>',
    complete: () => Object.keys(profiles),
    run(args) {
      const [target] = args;
      if (args.length !== 1 || !Object.hasOwn(profiles, target)) {
        writeLine('Usage: open <github|linkedin>');
        return;
      }
      window.open(profiles[target], '_blank', 'noopener,noreferrer');
      writeLine(`Opening ${target} in a new tab.`);
    },
  },
  help: {
    description: 'Show commands and keyboard shortcuts',
    run(args) {
      if (!noArguments(args, 'help')) return;
      writeLine(Object.entries(registry).map(([name, command]) => `${name.padEnd(10)}${command.description}`).join('\n'));
      writeLine('Tab         Complete command or argument\n↑ / ↓       Browse history\nCtrl+L      Clear output\nCtrl+U      Delete text before cursor\nCtrl+C      Cancel current line');
    },
  },
  history: {
    description: 'Show command history',
    run(args) {
      if (noArguments(args, 'history')) writeLine(commands.map((command, index) => `${String(index + 1).padStart(4)}  ${command}`).join('\n'));
    },
  },
  clear: {
    description: 'Clear terminal output',
    run(args) { if (noArguments(args, 'clear')) output.replaceChildren(); },
  },
};

form.addEventListener('submit', event => {
  event.preventDefault();
  const command = input.value.trim();
  if (!command) return;
  remember(command);
  writeLine(`visitor@j.codagnoni:~$ ${command}`, 'command command-echo');
  const [action, ...args] = command.split(/\s+/);
  if (Object.hasOwn(registry, action)) registry[action].run(args);
  else writeLine(`${action}: command not found. Type help for commands.`);
  setLine('');
  input.focus();
  form.scrollIntoView({ block: 'nearest' });
});

function autocomplete() {
  // Only replace the token at the cursor; preserve any text after it.
  const cursor = input.selectionStart;
  const before = input.value.slice(0, cursor);
  const tokens = before.trimStart().split(/\s+/);
  const token = tokens.at(-1);
  let candidates = [];
  if (tokens.length === 1) candidates = Object.keys(registry);
  else if (tokens.length === 2 && Object.hasOwn(registry, tokens[0])) candidates = registry[tokens[0]].complete?.() || [];
  const matches = candidates.filter(value => value.startsWith(token));
  if (!matches.length) return;
  let completion = matches[0];
  for (const match of matches.slice(1)) {
    while (!match.startsWith(completion)) completion = completion.slice(0, -1);
  }
  const start = cursor - token.length;
  const suffix = input.value.slice(cursor);
  const replacement = completion + (matches.length === 1 && !suffix ? ' ' : '');
  input.value = input.value.slice(0, start) + replacement + suffix;
  input.setSelectionRange(start + replacement.length, start + replacement.length);
  if (matches.length > 1) writeLine(matches.join('  '));
}
input.addEventListener('keydown', event => {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    autocomplete();
  } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
    event.preventDefault();
    if (historyIndex === commands.length) draft = input.value;
    historyIndex = Math.max(0, Math.min(commands.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
    setLine(historyIndex === commands.length ? draft : commands[historyIndex]);
  } else if (event.ctrlKey && ['l', 'u', 'c', 'a', 'e'].includes(event.key.toLowerCase())) {
    event.preventDefault();
    switch (event.key.toLowerCase()) {
      case 'l': output.replaceChildren(); break;
      case 'u': {
        const cursor = input.selectionEnd;
        input.value = input.value.slice(cursor);
        input.setSelectionRange(0, 0);
        break;
      }
      case 'c':
        writeLine(`visitor@j.codagnoni:~$ ${input.value}^C`, 'command command-echo');
        setLine(''); historyIndex = commands.length; draft = ''; break;
      case 'a': input.setSelectionRange(0, 0); break;
      case 'e': input.setSelectionRange(input.value.length, input.value.length); break;
    }
  }
});
document.querySelector('.terminal').addEventListener('click', event => {
  if (event.target.closest('a, input') || window.getSelection()?.toString()) return;
  input.focus();
});
input.focus({ preventScroll: true });
