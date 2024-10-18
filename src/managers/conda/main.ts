import { Disposable, LogOutputChannel } from 'vscode';
import { PythonEnvironmentApi } from '../../api';
import { CondaEnvManager } from './condaEnvManager';
import { CondaPackageManager } from './condaPackageManager';
import { getPythonApi } from '../../features/pythonApi';
import { NativePythonFinder } from '../common/nativePythonFinder';
import { traceInfo } from '../../common/logging';
import { getConda } from './condaUtils';
import { onDidChangeConfiguration } from '../../common/workspace.apis';

async function register(
    api: PythonEnvironmentApi,
    nativeFinder: NativePythonFinder,
    log: LogOutputChannel,
): Promise<Disposable> {
    const disposables: Disposable[] = [];
    try {
        await getConda();
        const envManager = new CondaEnvManager(nativeFinder, api, log);
        const packageManager = new CondaPackageManager(api, log);

        disposables.push(
            envManager,
            packageManager,
            api.registerEnvironmentManager(envManager),
            api.registerPackageManager(packageManager),
        );
    } catch (ex) {
        traceInfo('Conda not found, turning off conda features.');
    }
    return Disposable.from(...disposables);
}

export async function registerCondaFeatures(
    nativeFinder: NativePythonFinder,
    disposables: Disposable[],
    log: LogOutputChannel,
): Promise<void> {
    const api: PythonEnvironmentApi = await getPythonApi();

    const disposable: Disposable = await register(api, nativeFinder, log);

    disposables.push(
        disposable,
        onDidChangeConfiguration((e) => {
            if (e.affectsConfiguration('python.condaPath')) {
                // TODO: This setting requires a reload of the extension.
            }
        }),
    );
}
