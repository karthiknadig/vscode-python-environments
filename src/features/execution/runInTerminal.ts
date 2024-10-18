import { Terminal, TerminalShellExecution } from 'vscode';
import { PythonEnvironment } from '../../api';
import { PythonTerminalExecutionOptions } from '../../internal.api';
import { getDedicatedTerminal, getProjectTerminal } from './terminal';
import { onDidEndTerminalShellExecution } from '../../common/window.apis';
import { createDeferred } from '../../common/utils/deferred';
import { quoteArgs } from './execUtils';

export async function runInTerminal(
    options: PythonTerminalExecutionOptions,
    environment: PythonEnvironment,
    extra?: { show?: boolean },
): Promise<void> {
    let terminal: Terminal | undefined;
    if (options.useDedicatedTerminal) {
        terminal = await getDedicatedTerminal(options.useDedicatedTerminal, environment, options.project);
    } else {
        terminal = await getProjectTerminal(options.project, environment);
    }

    if (terminal) {
        if (extra?.show) {
            terminal.show();
        }

        const executable =
            environment.execInfo?.activatedRun?.executable ?? environment.execInfo?.run.executable ?? 'python';
        const args = environment.execInfo?.activatedRun?.args ?? environment.execInfo?.run.args ?? [];
        const allArgs = [...args, ...options.args];

        if (terminal.shellIntegration) {
            let execution: TerminalShellExecution | undefined;
            const deferred = createDeferred<void>();
            const disposable = onDidEndTerminalShellExecution((e) => {
                if (e.execution === execution) {
                    disposable.dispose();
                    deferred.resolve();
                }
            });
            execution = terminal.shellIntegration.executeCommand(executable, allArgs);
            return deferred.promise;
        } else {
            const text = quoteArgs([executable, ...allArgs]).join(' ');
            terminal.sendText(`${text}\n`);
        }
    }
}
