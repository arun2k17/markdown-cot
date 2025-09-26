// remark-cot.ts (ESM / TypeScript)
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';
import type { Root, Code, Content, Parent } from 'mdast';

type CoTStatus = string; // "thinking" | "done" | etc. (you control the vocabulary)

type Step = {
    id: string;
    summary: string;
    description?: string;
    order: number;         // first appearance order (stable)
};

type Group = {
    id: string;
    title?: string;        // from cot-init summary
    description?: string;  // from cot-init description
    status: CoTStatus;     // last status seen (cot-summary or cot-init)
    closed: boolean;       // status === 'done'
    steps: Map<string, Step>;
    firstOrder: number;    // document order index of the first block seen for this group
    anchor?: NodeRef;      // where to insert <cot-group>
    // bookkeeping
    _seenStepIds: Set<string>;
};

type NodeRef = { parent: Parent; index: number; node: Content };

function parseAttrs(meta?: string | null): Record<string, unknown> {
    // meta is like `{group=sess-42 id=answer status=thinking}`
    if (!meta) return {};
    const m = meta.trim();
    const body = m.startsWith('{') && m.endsWith('}') ? m.slice(1, -1) : m;
    const attrs: Record<string, unknown> = {};
    // match key=value with quoted or bare values
    const re = /([a-zA-Z_][\w-]*)=("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|[^\s"']+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(body))) {
        const key = match[1];
        let raw = match[2];
        if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
            raw = raw.slice(1, -1).replace(/\\"/g, '"').replace(/\\'/g, "'");
        }
        // coerce booleans/numbers when obvious
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
    // first non-empty line => summary
    let i = 0;
    while (i < lines.length && lines[i].trim() === '') i++;
    const summary = (lines[i] || '').trim();
    // description is content after the first blank line that *follows* the summary line
    i++;
    // find the first blank line (optional)
    if (i < lines.length && lines[i].trim() !== '') {
        // require a blank separator; if not present, treat rest as description anyway
    }
    const descStart = i;
    const description = lines.slice(descStart).join('\n').trim() || undefined;
    return { summary, description };
}

function setAnchorIfEarlier(g: Group, ref: NodeRef, globalOrder: number) {
    if (!g.anchor || g.firstOrder > globalOrder) {
        g.anchor = ref;
        g.firstOrder = globalOrder;
    }
}

function removeAt(parent: Parent, index: number) {
    parent.children.splice(index, 1);
}

export interface RemarkCotOptions {
    // no options yet; reserved for future (e.g., custom element name)
    elementName?: string; // default: 'cot-group'
}

/**
 * remark-cot:
 *  - gathers cot-init/step/summary per group
 *  - replaces the first block with a single <cot-group> element
 *  - removes the rest of cot-* blocks for that group
 */
const remarkCot: Plugin<[RemarkCotOptions?], Root> = (opts?: RemarkCotOptions) => {
    const elementName = opts?.elementName ?? 'cot-group';

    return (tree) => {
        const groups = new Map<string, Group>();
        const toRemove: Array<NodeRef> = [];
        let globalOrder = 0;

        // 1) scan & collect
        visit(tree, 'code', (node: Code, index, parent) => {
            if (!parent || typeof index !== 'number') return;
            const lang = (node.lang || '').trim();
            if (!lang.startsWith('cot-')) return;

            const attrs = parseAttrs(node.meta);
            const value = node.value || '';
            globalOrder += 1;

            const ref: NodeRef = { parent, index, node };

            if (lang === 'cot-init') {
                const groupId = String(attrs.id || '').trim();
                if (!groupId) return; // invalid init; ignore

                const { summary, description } = splitSummaryDescription(value);
                const g = groups.get(groupId) ?? {
                    id: groupId,
                    title: undefined,
                    description: undefined,
                    status: String(attrs.status ?? 'thinking'),
                    closed: false,
                    steps: new Map(),
                    firstOrder: Number.MAX_SAFE_INTEGER,
                    anchor: undefined,
                    _seenStepIds: new Set(),
                };

                // Only the first cot-init sets title/description; later cot-init blocks are ignored by spec.
                if (g.title == null && summary) g.title = summary;
                if (g.description == null && description) g.description = description;

                // status from init is only used if no later cot-summary overrides it
                g.status = g.status ?? String(attrs.status ?? 'thinking');
                g.closed = g.status === 'done';

                setAnchorIfEarlier(g, ref, globalOrder);
                groups.set(groupId, g);

                // We'll replace this node later with <cot-group>
                toRemove.push(ref);

            } else if (lang === 'cot-step') {
                const groupId = String(attrs.group || '').trim();
                const stepId = String(attrs.id || '').trim();
                if (!groupId || !stepId) return;

                const { summary, description } = splitSummaryDescription(value);
                const g = groups.get(groupId) ?? {
                    id: groupId,
                    title: undefined,
                    description: undefined,
                    status: 'thinking',
                    closed: false,
                    steps: new Map(),
                    firstOrder: Number.MAX_SAFE_INTEGER,
                    anchor: undefined,
                    _seenStepIds: new Set(),
                };

                // respect terminal rule: ignore anything after status=done
                if (!g.closed) {
                    if (!g.steps.has(stepId)) {
                        const order = g.steps.size + 1; // order by first appearance
                        g.steps.set(stepId, { id: stepId, summary, description, order });
                    } else {
                        // update existing (last write wins), keep order
                        const prev = g.steps.get(stepId)!;
                        g.steps.set(stepId, { ...prev, summary, description });
                    }
                }

                setAnchorIfEarlier(g, ref, globalOrder);
                groups.set(groupId, g);
                toRemove.push(ref);

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
                    firstOrder: Number.MAX_SAFE_INTEGER,
                    anchor: undefined,
                    _seenStepIds: new Set(),
                };

                if (!g.closed) {
                    g.status = status;
                    g.closed = status === 'done';
                }

                setAnchorIfEarlier(g, ref, globalOrder);
                groups.set(groupId, g);
                toRemove.push(ref);
            }
        });

        // 2) replace anchor nodes with <cot-group> per group
        for (const g of groups.values()) {
            if (!g.anchor) continue;
            const { parent, index } = g.anchor;

            // Build a custom mdast node that react-markdown will turn into a custom element.
            const steps = Array.from(g.steps.values()).sort((a, b) => a.order - b.order);

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
                        'data-steps': JSON.stringify(steps),   // <-- JSON in data attribute
                    },
                },
                children: [],
            };

            (parent.children as Content[])[index] = elementNode as unknown as Content;
        }

        // 3) remove all other cot-* code blocks (non-anchor ones)
        // We already replaced anchors; now drop the rest, adjusting indices as we go.
        // Sort by parent uniqueness then descending index to avoid shifting issues.
        const byParent = new Map<Parent, NodeRef[]>();
        for (const r of toRemove) {
            // Skip the anchor we already replaced
            const g = Array.from(groups.values()).find(gr => gr.anchor?.node === r.node);
            if (g && g.anchor?.node === r.node) continue;
            const arr = byParent.get(r.parent) ?? [];
            arr.push(r);
            byParent.set(r.parent, arr);
        }
        for (const [parent, refs] of byParent.entries()) {
            refs.sort((a, b) => b.index - a.index);
            for (const r of refs) removeAt(parent, r.index);
        }
    };
};

export default remarkCot;
