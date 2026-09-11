import type { GutterComment } from "./communityTypes";

export type CommentTreeNode = {
  comment: GutterComment;
  children: CommentTreeNode[];
};

/** Build a true parent/child tree while keeping orphaned replies visible as roots. */
export function buildCommentTree(comments: GutterComment[]): CommentTreeNode[] {
  const nodes = new Map<string, CommentTreeNode>();
  const order = new Map<string, number>();

  comments.forEach((comment, index) => {
    nodes.set(comment.id, { comment, children: [] });
    order.set(comment.id, index);
  });

  const roots: CommentTreeNode[] = [];
  for (const comment of comments) {
    const node = nodes.get(comment.id)!;
    const parent = comment.parentId ? nodes.get(comment.parentId) : undefined;
    if (parent && parent !== node) parent.children.push(node);
    else roots.push(node);
  }

  const sortBySourceOrder = (items: CommentTreeNode[]) => {
    items.sort((a, b) => (order.get(a.comment.id) ?? 0) - (order.get(b.comment.id) ?? 0));
    items.forEach((item) => sortBySourceOrder(item.children));
  };
  sortBySourceOrder(roots);

  return roots;
}

export function countDescendants(node: CommentTreeNode): number {
  return node.children.reduce((total, child) => total + 1 + countDescendants(child), 0);
}

export function someCommentInBranch(node: CommentTreeNode, predicate: (comment: GutterComment) => boolean): boolean {
  return predicate(node.comment) || node.children.some((child) => someCommentInBranch(child, predicate));
}

/** Backward-compatible flattened grouping for older callers. */
export function groupCommentThreads(comments: GutterComment[]) {
  const flatten = (nodes: CommentTreeNode[]): GutterComment[] =>
    nodes.flatMap((node) => [node.comment, ...flatten(node.children)]);

  return buildCommentTree(comments).map((node) => ({
    comment: node.comment,
    replies: flatten(node.children),
  }));
}
