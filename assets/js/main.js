const profiles = {
  github: 'https://github.com/codagnoni',
  linkedin: 'https://www.linkedin.com/in/joao-codagnoni',
};
const form = document.querySelector('#prompt');
const input = document.querySelector('#command-input');
const history = document.querySelector('#history');
const commands = [];
let historyIndex = 0;

function writeLine(text, className = 'terminal-output') {
  const line = document.createElement('p');
  line.className = className;
  line.textContent = text;
  history.append(line);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const command = input.value.trim();
  if (!command) return;
  commands.push(command);
  historyIndex = commands.length;
  writeLine(`visitor@j.codagnoni:~$ ${command}`, 'command command-echo');
  const [action, target, ...extra] = command.toLowerCase().split(/\s+/);
  if (action === 'ls' && !target) {
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
    history.append(line);
  } else if (action === 'open' && profiles[target] && extra.length === 0) {
    window.open(profiles[target], '_blank', 'noopener,noreferrer');
    writeLine(`Opening ${target} in a new tab.`);
  } else if (action === 'help' && !target) {
    writeLine('ls              List profiles\nopen github     Open GitHub\nopen linkedin   Open LinkedIn\nclear           Clear terminal output');
  } else if (action === 'clear' && !target) {
    history.replaceChildren();
  } else {
    writeLine(action === 'open' ? 'Usage: open github | open linkedin' : `Command not found: ${action}. Type help for commands.`);
  }
  input.value = '';
  input.focus();
  form.scrollIntoView({ block: 'nearest' });
});

input.addEventListener('keydown', event => {
  if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
  event.preventDefault();
  historyIndex = Math.max(0, Math.min(commands.length, historyIndex + (event.key === 'ArrowUp' ? -1 : 1)));
  input.value = commands[historyIndex] || '';
});
