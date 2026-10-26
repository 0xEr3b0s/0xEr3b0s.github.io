export type Tone = 'out' | 'err' | 'dim' | 'accent' | 'red';
export type Segment = { text: string; tone?: Tone }; // tone default 'out'
export type ReplayStep =
	| { kind: 'cmd'; prompt: Segment[]; text: string } // prompt shown at once, text typed char by char, then Enter
	| { kind: 'out'; lines: Segment[][]; delay?: number } // each line = segments; delay = ms before the first line
	| { kind: 'key'; label: string } // keystroke echoed at the end of the current line, e.g. '^C'
	| { kind: 'pause'; ms: number };
export type Replay = { label: string; steps: ReplayStep[] };

const SHELL: Segment[] = [{ text: '$ ', tone: 'accent' }];
// readline(RED"minishell\033[0m-> ")
const MINI: Segment[] = [{ text: 'minishell', tone: 'red' }, { text: '-> ' }];
// here-doc prompt, written to stderr before each line
const HEREDOC: Segment[] = [{ text: '> ' }];

// $USER, $PWD and the TTL / round-trip times below are environment values, chosen to be plausible.
export const replays: Record<string, Replay> = {
	minishell: {
		label: 'minishell',
		steps: [
			{ kind: 'cmd', prompt: SHELL, text: './minishell' },
			{
				kind: 'out',
				delay: 150,
				lines: [
					[{ text: '' }],
					[{ text: '⠀⠀⠀⢀⣀⣀⣤⣤⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀', tone: 'red' }],
					[{ text: '⠀⠰⠛⠋⠉⠀⠀⠀⠀⠉⠉⠛⠶⢤⣄⣀⠀⠀⠀⠀', tone: 'red' }],
					[{ text: '⠀⠀⠀⣠⣤⣶⣶⣶⡤⢤⣀⠀⠀⠀⠀⠉⠉⠉⠉⠀', tone: 'red' }],
					[{ text: '⠀⢀⡴⠃⠸⣿⣿⣿⡏⠀⣨⡿⠶⠦⠤⠤⠤⠤⣤⠀', tone: 'red' }],
					[{ text: '⠀⠉⠉⢻⣷⠾⣿⡛⠋⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀', tone: 'red' }],
					[{ text: '⠀⠀⠀⢼⣿⠀⠈⠛⢶⣄⡀⠀⠀⠀⠀⠀⠀⠢⡰⠀', tone: 'red' }],
					[{ text: '⠀⠀⠀⠘⣿⠀⠀⠀⠀⠈⠙⠲⢤⣀⡀⠀⠀⣀⠜⠀', tone: 'red' }],
					[{ text: '⠀⠀⠀⠀⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀', tone: 'red' }],
					// leading '\t' expanded to the first tab stop (8 columns)
					[{ text: '                      ▲ MINISHELL ▲', tone: 'red' }],
					[{ text: '' }],
				],
			},
			{ kind: 'pause', ms: 1200 },
			{ kind: 'cmd', prompt: MINI, text: 'echo "hello $USER" | tr a-z A-Z' },
			{ kind: 'out', delay: 120, lines: [[{ text: 'HELLO ER3B0S' }]] },
			{ kind: 'pause', ms: 900 },
			{ kind: 'cmd', prompt: MINI, text: 'ls src > list.txt' },
			{ kind: 'pause', ms: 700 },
			{ kind: 'cmd', prompt: MINI, text: 'wc -l < list.txt' },
			{ kind: 'out', delay: 100, lines: [[{ text: '8' }]] },
			{ kind: 'pause', ms: 900 },
			{ kind: 'cmd', prompt: MINI, text: 'cat << EOF' },
			{ kind: 'cmd', prompt: HEREDOC, text: 'hi $USER, you are in $PWD' },
			{ kind: 'cmd', prompt: HEREDOC, text: 'EOF' },
			{ kind: 'out', delay: 100, lines: [[{ text: 'hi er3b0s, you are in /home/er3b0s/minishell' }]] },
			{ kind: 'pause', ms: 1000 },
			{ kind: 'cmd', prompt: MINI, text: 'gti status' },
			{ kind: 'out', delay: 100, lines: [[{ text: 'gti:command not found', tone: 'err' }]] },
			{ kind: 'pause', ms: 600 },
			{ kind: 'cmd', prompt: MINI, text: 'echo $?' },
			{ kind: 'out', delay: 80, lines: [[{ text: '127' }]] },
			{ kind: 'pause', ms: 900 },
			{ kind: 'cmd', prompt: MINI, text: 'echo "unclosed' },
			{
				kind: 'out',
				delay: 80,
				lines: [
					[{ text: 'Error: bad quotes.', tone: 'err' }],
					[{ text: 'Error: Wrong syntax.', tone: 'err' }],
				],
			},
			{ kind: 'pause', ms: 1000 },
			{ kind: 'cmd', prompt: MINI, text: 'exit' },
			{ kind: 'out', delay: 60, lines: [[{ text: 'exit' }]] },
			{ kind: 'pause', ms: 2000 },
		],
	},
	'ft-ping': {
		label: 'ft_ping',
		steps: [
			{ kind: 'cmd', prompt: SHELL, text: 'sudo ./ft_ping 1.1.1.1' },
			{ kind: 'out', delay: 200, lines: [[{ text: 'PING 1.1.1.1 (1.1.1.1): 56 data bytes' }]] },
			{
				kind: 'out',
				delay: 12,
				lines: [[{ text: '64 bytes from 1.1.1.1: icmp_seq=0 ttl=57 time=12.483 ms' }]],
			},
			{
				kind: 'out',
				delay: 1000,
				lines: [[{ text: '64 bytes from 1.1.1.1: icmp_seq=1 ttl=57 time=11.927 ms' }]],
			},
			{
				kind: 'out',
				delay: 1000,
				lines: [[{ text: '64 bytes from 1.1.1.1: icmp_seq=2 ttl=57 time=13.106 ms' }]],
			},
			{
				kind: 'out',
				delay: 1000,
				lines: [[{ text: '64 bytes from 1.1.1.1: icmp_seq=3 ttl=57 time=12.219 ms' }]],
			},
			{ kind: 'pause', ms: 600 },
			// The terminal echoes ^C; its newline absorbs the '\n' that opens the statistics.
			{ kind: 'key', label: '^C' },
			{
				kind: 'out',
				lines: [
					[{ text: '--- 1.1.1.1 ping statistics ---' }],
					[{ text: '4 packets transmitted, 4 packets received, 0.0% packet loss' }],
					// sample stddev (n - 1), as print_exiting_stats computes it
					[{ text: 'round-trip min/avg/max/stddev = 11.927/12.434/13.106/0.502 ms' }],
				],
			},
			{ kind: 'pause', ms: 1500 },
			{ kind: 'cmd', prompt: SHELL, text: 'sudo ./ft_ping doesnotexist.invalid' },
			{
				kind: 'out',
				delay: 300,
				lines: [[{ text: 'ping: doesnotexist.invalid: Name or service not known', tone: 'err' }]],
			},
			{ kind: 'pause', ms: 2000 },
		],
	},
};
