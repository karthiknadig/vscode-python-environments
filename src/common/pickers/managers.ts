import { QuickPickItem, QuickPickItemKind } from 'vscode';
import { PythonProjectCreator } from '../../api';
import { InternalEnvironmentManager, InternalPackageManager } from '../../internal.api';
import { Common } from '../localize';
import { showQuickPickWithButtons, showQuickPick } from '../window.apis';

export async function pickEnvironmentManager(
    managers: InternalEnvironmentManager[],
    defaultManagers?: InternalEnvironmentManager[],
): Promise<string | undefined> {
    if (managers.length === 0) {
        return;
    }

    if (managers.length === 1) {
        return managers[0].id;
    }

    const items: (QuickPickItem | (QuickPickItem & { id: string }))[] = [];
    if (defaultManagers && defaultManagers.length > 0) {
        items.push(
            {
                label: Common.recommended,
                kind: QuickPickItemKind.Separator,
            },
            ...defaultManagers.map((defaultMgr) => ({
                label: defaultMgr.displayName,
                description: defaultMgr.description,
                id: defaultMgr.id,
            })),
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
        );
    }
    items.push(
        ...managers
            .filter((m) => !defaultManagers?.includes(m))
            .map((m) => ({
                label: m.displayName,
                description: m.description,
                id: m.id,
            })),
    );
    const item = await showQuickPickWithButtons(items, {
        placeHolder: 'Select an environment manager',
        ignoreFocusOut: true,
    });
    return (item as QuickPickItem & { id: string })?.id;
}

export async function pickPackageManager(
    managers: InternalPackageManager[],
    defaultManagers?: InternalPackageManager[],
): Promise<string | undefined> {
    if (managers.length === 0) {
        return;
    }

    if (managers.length === 1) {
        return managers[0].id;
    }

    const items: (QuickPickItem | (QuickPickItem & { id: string }))[] = [];
    if (defaultManagers && defaultManagers.length > 0) {
        items.push(
            {
                label: Common.recommended,
                kind: QuickPickItemKind.Separator,
            },
            ...defaultManagers.map((defaultMgr) => ({
                label: defaultMgr.displayName,
                description: defaultMgr.description,
                id: defaultMgr.id,
            })),
            {
                label: '',
                kind: QuickPickItemKind.Separator,
            },
        );
    }
    items.push(
        ...managers
            .filter((m) => !defaultManagers?.includes(m))
            .map((m) => ({
                label: m.displayName,
                description: m.description,
                id: m.id,
            })),
    );
    const item = await showQuickPickWithButtons(items, {
        placeHolder: 'Select an package manager',
        ignoreFocusOut: true,
    });
    return (item as QuickPickItem & { id: string })?.id;
}

export async function pickCreator(creators: PythonProjectCreator[]): Promise<PythonProjectCreator | undefined> {
    if (creators.length === 0) {
        return;
    }

    if (creators.length === 1) {
        return creators[0];
    }

    const items: (QuickPickItem & { c: PythonProjectCreator })[] = creators.map((c) => ({
        label: c.displayName ?? c.name,
        description: c.description,
        c: c,
    }));
    const selected = await showQuickPick(items, {
        placeHolder: 'Select a project creator',
        ignoreFocusOut: true,
    });
    return (selected as { c: PythonProjectCreator })?.c;
}