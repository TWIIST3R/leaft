"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import gsap from "gsap";

type Employee = {
  id: string;
  first_name: string;
  last_name: string;
  current_job_title: string;
  current_department_id: string | null;
  manager_id: string | null;
};
type Dept = { id: string; name: string };
type TreeNode = Employee & { children: TreeNode[] };

function buildTree(employees: Employee[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  employees.forEach((e) => map.set(e.id, { ...e, children: [] }));

  const roots: TreeNode[] = [];
  map.forEach((node) => {
    if (node.manager_id && map.has(node.manager_id)) {
      map.get(node.manager_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function OrgNode({
  node,
  deptMap,
  depth,
  expandedSet,
  toggleExpand,
}: {
  node: TreeNode;
  deptMap: Map<string, string>;
  depth: number;
  expandedSet: Set<string>;
  toggleExpand: (id: string) => void;
}) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSet.has(node.id);
  const deptName = node.current_department_id ? deptMap.get(node.current_department_id) : null;

  useEffect(() => {
    if (nodeRef.current) {
      gsap.fromTo(nodeRef.current, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.35, ease: "power2.out" });
    }
  }, []);

  return (
    <div className="relative">
      <div ref={nodeRef} className="flex items-start gap-2">
        {hasChildren && (
          <button
            onClick={() => toggleExpand(node.id)}
            className="mt-3 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md border border-[#e2e7e2] bg-white text-xs text-[color:rgba(11,11,11,0.5)] transition hover:bg-[#f0f2f0]"
          >
            {isExpanded ? "−" : "+"}
          </button>
        )}
        {!hasChildren && depth > 0 && <span className="mt-3 h-5 w-5 shrink-0" />}

        <div className="group rounded-2xl border border-[#e2e7e2] bg-white px-4 py-3 shadow-sm transition hover:border-[var(--brand)]/30 hover:shadow-md">
          <Link href={`/dashboard/talents/${node.id}`} className="block">
            <p className="text-sm font-semibold text-[var(--text)] group-hover:text-[var(--brand)]">
              {node.first_name} {node.last_name}
            </p>
            <p className="mt-0.5 text-xs text-[color:rgba(11,11,11,0.6)]">
              {node.current_job_title || "—"}
            </p>
          </Link>
          {deptName && (
            <span className="mt-1.5 inline-block rounded-lg bg-[var(--brand)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--brand)]">
              {deptName}
            </span>
          )}
          {hasChildren && (
            <p className="mt-1 text-[10px] text-[color:rgba(11,11,11,0.4)]">
              {node.children.length} subordonné{node.children.length > 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1 border-l-2 border-[#e2e7e2] pl-4">
          {node.children
            .sort((a, b) => a.last_name.localeCompare(b.last_name))
            .map((child) => (
              <OrgNode
                key={child.id}
                node={child}
                deptMap={deptMap}
                depth={depth + 1}
                expandedSet={expandedSet}
                toggleExpand={toggleExpand}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function OrganigrammeClient({
  employees,
  departments,
}: {
  employees: Employee[];
  departments: Dept[];
}) {
  const deptMap = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments]);
  const tree = useMemo(() => buildTree(employees), [employees]);
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => {
    const set = new Set<string>();
    tree.forEach((root) => set.add(root.id));
    return set;
  });
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mainRef.current) return;
    const nodes = mainRef.current.querySelectorAll("[data-org-root]");
    gsap.fromTo(nodes, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.45, stagger: 0.08, ease: "power2.out" });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    const walk = (nodes: TreeNode[]) => {
      nodes.forEach((n) => { all.add(n.id); walk(n.children); });
    };
    walk(tree);
    setExpandedSet(all);
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedSet(new Set());
  }, []);

  if (employees.length === 0) {
    return (
      <div className="rounded-3xl border border-[#e2e7e2] bg-white p-12 text-center shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <p className="text-[color:rgba(11,11,11,0.65)]">Aucun talent dans l&apos;organisation.</p>
        <Link href="/dashboard/talents/new" className="mt-4 inline-flex items-center rounded-full bg-[var(--brand)] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
          Ajouter un talent
        </Link>
      </div>
    );
  }

  return (
    <div ref={mainRef} className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={expandAll} className="cursor-pointer rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
          Tout déplier
        </button>
        <button onClick={collapseAll} className="cursor-pointer rounded-full border border-[#e2e7e2] bg-white px-3 py-1.5 text-xs font-medium text-[var(--text)] transition hover:bg-[#f8faf8]">
          Tout replier
        </button>
        <span className="text-xs text-[color:rgba(11,11,11,0.5)]">
          {employees.length} collaborateur{employees.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="rounded-3xl border border-[#e2e7e2] bg-[#f8faf8] p-6 shadow-[0_24px_60px_rgba(17,27,24,0.06)]">
        <div className="space-y-3">
          {tree
            .sort((a, b) => a.last_name.localeCompare(b.last_name))
            .map((root) => (
              <div key={root.id} data-org-root>
                <OrgNode
                  node={root}
                  deptMap={deptMap}
                  depth={0}
                  expandedSet={expandedSet}
                  toggleExpand={toggleExpand}
                />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
