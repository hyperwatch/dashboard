// Helpers on the pipeline tree of /nodes.json?view=tree, following the
// navigation between log streams of Hyperwatch's HTML interface.

// Where a pipeline node is in the tree: its named ancestors and the node
// itself (unnamed steps, like maps and filters, are skipped). Returns null
// when the node isn't in the tree.
export function findNode(tree, name) {
  const search = (node, ancestors) => {
    if (!node) return null;
    if (node.name === name) return { ancestors, node };
    const path = node.name ? [...ancestors, node.name] : ancestors;
    for (const child of node.children || []) {
      const found = search(child, path);
      if (found) return found;
    }
    return null;
  };
  const roots = [tree, ...(tree.inputs || []).map((input) => input.tree)];
  for (const root of roots) {
    const found = search(root, []);
    if (found) return found;
  }
  return null;
}

// The named nodes one level below a node
export function namedChildren(node) {
  return (node.children || []).flatMap((child) =>
    child.name ? [child.name] : namedChildren(child)
  );
}

// The levels of the navigation to a node: each level of the path to it, then
// the nodes below it. Up to main (or outside it) a level is one node; below
// main, a level lists all its nodes. Each node is { name, current, onPath }.
// Returns null when the node isn't in the tree.
export function nodeLevels(tree, name) {
  const found = tree && findNode(tree, name);
  if (!found) return null;
  const level = (nodes, onPath) =>
    nodes.map((node) => ({
      name: node,
      current: node === name,
      onPath: node === onPath,
    }));
  const path = [...found.ancestors, name];
  const main = found.ancestors.indexOf('main');
  const levels = path.map((node, i) =>
    main === -1 || i <= main
      ? level([node], node)
      : level(namedChildren(findNode(tree, path[i - 1]).node), node)
  );
  const below = namedChildren(found.node);
  if (below.length > 0) levels.push(level(below));
  return levels;
}
