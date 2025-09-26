// remark-cot.ts (ESM / TypeScript)
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root, Code, Content, Parent } from 'mdast';

type CoTStatus = string;
type Step = { id: string; summary: string; description?: string; order: number };

type NodeRef = { parent: Parent; index: number; node: Content; kind: 'init' | 'step' | 'summary' };

type Group = {
    id: string;
    title?: string;
    description?: string;
    status: CoTStatus;
    closed: boolean;
    steps: Map<string, Step>;
    nodes: NodeRef[];          // all cot nodes for this group
    anchor?: NodeRef;          // where we will render <cot-group>
    firstStepOrder: number;    // for ordering steps by first appearance
};

function parseAttrs(meta?: string | null): Record<string, any> {
    if (!meta) return {};
    const m = meta.trim();
    const body = m.startsWith('{') && m.endsWith('}') ? m.slice(1, -1) : m;
    const attrs: Record<string, any> = {};
    const re = /([a-zA-Z_][\w-]*)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s"']+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body))) {
        const key = match[1];
        let raw = match[2];
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
        }
        const val =
            raw === 'true' ? true :
                raw === 'false' ? false :
                    !Number.isNaN(Number(raw)) && raw.trim() !== '' ? Number(raw) :
                        raw;
        attrs[key] = val;
    }
    return attrs;
}

function splitSummaryDescription(value: string) {
    const lines = value.replace(/\r\n/g, '\n').split('\n');
    // summary = first non-empty line
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    const summary = (lines[i] || '').trim();
    // description = everything after a blank line (or just the rest)
    i++;
    // find a blank separator (optional)
    while (i < lines.length && lines[i].trim() !== '') i++;
    const description = lines.slice(i + 1).join('\n').trim() || undefined;
    return { summary, description };
}

function removeAt(parent: Parent, index: number) {
    (parent.children as Content[]).splice(index, 1);
}

const remarkCot: Plugin<[], Root> = () => {
    return (tree) => {
        const groups = new Map<string, Group>();

        // 1) Collect all cot-* nodes, compute final state per group
        visit(tree, 'code', (node: Code, index, parent) => {
            if (!parent || typeof index !== 'number') return;
            const lang = (node.lang || '').trim();
            if (!lang.startsWith('cot-')) return;

            const attrs = parseAttrs(node.meta);
            const value = node.value || '';
            const ref: NodeRef = {
                parent,
                index,
                node,
                kind: lang === 'cot-init' ? 'init' : lang === 'cot-summary' ? 'summary' : 'step'
            };

            if (lang === 'cot-init') {
                const groupId = String(attrs.group || '').trim();
                if (!groupId) return;
                const g = groups.get(groupId) ?? {
                    id: groupId,
                    title: undefined,
                    description: undefined,
                    status: String(attrs.status ?? 'thinking'),
                    closed: false,
                    steps: new Map(),
                    nodes: [],
                    anchor: undefined,
                    firstStepOrder: 0,
                };
                const { summary, description } = splitSummaryDescription(value);
                if (g.title == null && summary) g.title = summary;
                if (g.description == null && description) g.description = description;
                g.status = g.status ?? String(attrs.status ?? 'thinking');
                g.closed = g.status === 'done';
                g.nodes.push(ref);
                // provisional anchor (will be overridden by any summary later)
                if (!g.anchor) g.anchor = ref;
                groups.set(groupId, g);

            } else if (lang === 'cot-step') {
                const groupId = String(attrs.group || '').trim();
                const stepId = String(attrs.id || '').trim();
                if (!groupId || !stepId) return;
                const g = groups.get(groupId) ?? {
                    id: groupId,
                    title: undefined,
                    description: undefined,
                    status: 'thinking',
                    closed: false,
                    steps: new Map(),
                    nodes: [],
                    anchor: undefined,
                    firstStepOrder: 0,
                };
                if (!g.closed) {
                    const { summary, description } = splitSummaryDescription(value);
                    if (!g.steps.has(stepId)) {
                        const order = ++g.firstStepOrder;
                        g.steps.set(stepId, { id: stepId, summary, description, order });
                    } else {
                        const prev = g.steps.get(stepId)!;
                        g.steps.set(stepId, { ...prev, summary, description });
                    }
                }
                g.nodes.push(ref);
                if (!g.anchor) g.anchor = ref; // still provisional until we see a summary
                groups.set(groupId, g);

            } else if (lang === 'cot-summary') {
                const groupId = String(attrs.group || '').trim();
                if (!groupId) return;
                const status = String(attrs.status ?? '').trim();
                if (!status) return;
                const g = groups.get(groupId) ?? {
                    id: groupId,
                    title: undefined,
                    description: undefined,
                    status: 'thinking',
                    closed: false,
                    steps: new Map(),
                    nodes: [],
                    anchor: undefined,
                    firstStepOrder: 0,
                };
                if (!g.closed) {
                    g.status = status;
                    g.closed = status === 'done';
                }
                g.nodes.push(ref);
                // **Prefer summary as the final anchor**
                g.anchor = ref;
                groups.set(groupId, g);
            }
        });

        // 2) For each group: replace the anchor with <cot-group>, remove all other cot-* nodes
        for (const g of groups.values()) {
            if (!g.anchor) continue;

            // Build steps array (sorted by first appearance)
            const steps = Array.from(g.steps.values()).sort((a, b) => a.order - b.order);

            // Replace anchor node
            const { parent, index } = g.anchor;
            const elementNode: any = {
                type: 'cotGroup',
                data: {
                    hName: 'cot-group',
                    hProperties: {
                        'data-id': g.id,
                        'data-title': g.title ?? '',
                        'data-description': g.description ?? '',
                        'data-status': g.status ?? 'thinking',
                        'data-closed': String(g.closed ?? false),
                        'data-steps': JSON.stringify(steps),
                    },
                },
                children: [],
            };
            (parent.children as Content[])[index] = elementNode;

            // Remove all other group nodes (descending index per parent)
            const byParent = new Map<Parent, NodeRef[]>();
            for (const r of g.nodes) {
                if (r === g.anchor) continue; // keep anchor (we already replaced it)
                const arr = byParent.get(r.parent) ?? [];
                arr.push(r);
                byParent.set(r.parent, arr);
            }
            for (const [p, refs] of byParent.entries()) {
                refs.sort((a, b) => b.index - a.index);
                for (const r of refs) removeAt(p, r.index);
            }
        }
    };
};

export default remarkCot;
