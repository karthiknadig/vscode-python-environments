import { Disposable, GlobalEnvironmentVariableCollection } from 'vscode';
import { onDidChangeConfiguration } from '../../../common/workspace.apis';
import { registerCommand } from '../../../common/command.api';
import { getAutoActivationType } from '../utils';

export interface ActivateUsingShellStartup extends Disposable {}

class ActivateUsingShellStartupImpl implements ActivateUsingShellStartup {
    private readonly disposables: Disposable[] = [];
    constructor(private readonly envCollection: GlobalEnvironmentVariableCollection) {}

    dispose() {
        this.disposables.forEach((disposable) => disposable.dispose());
    }
}

export async function checkAndUpdateStartupScripts(): Promise<void> {
    // Implement the logic to check startup scripts
    return Promise.resolve();
}

export async function removeAllStartupScripts(): Promise<void> {
    // Implement the logic to remove all startup scripts
    return Promise.resolve();
}

export function registerActivateUsingShellStartup(
    disposables: Disposable[],
    environmentVariableCollection: GlobalEnvironmentVariableCollection,
) {
    let activateUsingShellStartup: ActivateUsingShellStartup | undefined;

    disposables.push(
        onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('python.terminal.autoActivationType')) {
                const autoActType = getAutoActivationType();
                if (autoActType === 'shellStartup') {
                    if (!activateUsingShellStartup) {
                        activateUsingShellStartup = new ActivateUsingShellStartupImpl(environmentVariableCollection);
                    }
                } else {
                    activateUsingShellStartup?.dispose();
                    activateUsingShellStartup = undefined;
                }
            }
        }),
        new Disposable(() => activateUsingShellStartup?.dispose()),
        registerCommand('python-envs.removeStartupScripts', async () => {
            await removeAllStartupScripts();
        }),
    );

    const autoActType = getAutoActivationType();
    if (autoActType === 'shellStartup') {
        activateUsingShellStartup = new ActivateUsingShellStartupImpl(environmentVariableCollection);
        setImmediate(async () => {
            await checkAndUpdateStartupScripts();
        });
    }
}
