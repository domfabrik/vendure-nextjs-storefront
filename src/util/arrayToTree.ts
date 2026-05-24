export type HasParent = {
  id: string;
  parentId?: string | null;
  parent?: { id?: string | null } | null;
};
export type TreeNode<T extends HasParent> = T & {
  children: Array<TreeNode<T>>;
};
export type RootNode<T extends HasParent> = {
  id?: string | null;
  children: Array<TreeNode<T>>;
};

export function arrayToTree<T extends HasParent>(nodes: T[]): RootNode<T> {
  const mappedNodes: { [id: string]: TreeNode<T> } = {};
  const topLevelNodes: TreeNode<T>[] = [];

  for (const node of nodes) {
    mappedNodes[node.id] = { ...(node as TreeNode<T>), children: [] };
  }

  for (const node of nodes) {
    const mappedNode = mappedNodes[node.id];
    const parentId = node.parentId ?? node.parent?.id ?? null;

    if (parentId === null) {
      topLevelNodes.push(mappedNode);
    } else {
      const parent = mappedNodes[parentId];
      if (parent) {
        parent.children.push(mappedNode);
      } else {
        topLevelNodes.push(mappedNode);
      }
    }
  }

  const rootId = topLevelNodes.length ? (topLevelNodes[0].parentId ?? topLevelNodes[0].parent?.id ?? null) : null;
  return { children: topLevelNodes, id: rootId };
}
