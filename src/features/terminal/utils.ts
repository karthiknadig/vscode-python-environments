import * as path from 'path';
import { Terminal, TerminalOptions, Uri } from 'vscode';
import { sleep } from '../../common/utils/asyncUtils';
import { PythonEnvironment, PythonProject, PythonProjectEnvironmentApi, PythonProjectGetterApi } from '../../api';
import { getWorkspaceFolders } from '../../common/workspace.apis';

const SHELL_INTEGRATION_TIMEOUT = 500; // 0.5 seconds
const SHELL_INTEGRATION_POLL_INTERVAL = 20; // 0.02 seconds

export async function waitForShellIntegration(terminal: Terminal): Promise<boolean> {
    let timeout = 0;
    while (!terminal.shellIntegration && timeout < SHELL_INTEGRATION_TIMEOUT) {
        await sleep(SHELL_INTEGRATION_POLL_INTERVAL);
        timeout += SHELL_INTEGRATION_POLL_INTERVAL;
    }
    return terminal.shellIntegration !== undefined;
}

export function isTaskTerminal(terminal: Terminal): boolean {
    // TODO: Need API for core for this https://github.com/microsoft/vscode/issues/234440
    return terminal.name.toLowerCase().includes('task');
}

export function getTerminalCwd(terminal: Terminal): string | undefined {
    if (terminal.shellIntegration?.cwd) {
        return terminal.shellIntegration.cwd.fsPath;
    }
    const cwd = (terminal.creationOptions as TerminalOptions)?.cwd;
    if (cwd) {
        return typeof cwd === 'string' ? cwd : cwd.fsPath;
    }
    return undefined;
}

async function getDistinctProjectEnvs(
    api: PythonProjectEnvironmentApi,
    projects: readonly PythonProject[],
): Promise<PythonEnvironment[]> {
    const envs: PythonEnvironment[] = [];
    await Promise.all(
        projects.map(async (p) => {
            const e = await api.getEnvironment(p.uri);
            if (e && !envs.find((x) => x.envId.id === e.envId.id)) {
                envs.push(e);
            }
        }),
    );
    return envs;
}

export async function getEnvironmentForTerminal(
    api: PythonProjectGetterApi & PythonProjectEnvironmentApi,
    terminal?: Terminal,
): Promise<PythonEnvironment | undefined> {
    let env: PythonEnvironment | undefined;

    const projects = api.getPythonProjects();
    if (projects.length === 0) {
        env = await api.getEnvironment(undefined);
    } else if (projects.length === 1) {
        env = await api.getEnvironment(projects[0].uri);
    } else {
        const envs = await getDistinctProjectEnvs(api, projects);
        if (envs.length === 1) {
            // If we have only one distinct environment, then use that.
            env = envs[0];
        } else {
            // If we have multiple distinct environments, then we can't pick one
            // So skip selecting so we can try heuristic approach
            env = undefined;
        }
    }

    if (env) {
        return env;
    }

    // This is a heuristic approach to attempt to find the environment for this terminal.
    // This is not guaranteed to work, but is better than nothing.
    const terminalCwd = terminal ? getTerminalCwd(terminal) : undefined;
    if (terminalCwd) {
        env = await api.getEnvironment(Uri.file(path.resolve(terminalCwd)));
    } else {
        const workspaces = getWorkspaceFolders() ?? [];
        if (workspaces.length === 1) {
            env = await api.getEnvironment(workspaces[0].uri);
        }
    }

    return env;
}
