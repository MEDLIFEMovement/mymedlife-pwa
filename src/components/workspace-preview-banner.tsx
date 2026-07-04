type WorkspacePreviewBannerProps = {
  workspaceLabel: string;
};

export function WorkspacePreviewBanner({
  workspaceLabel,
}: WorkspacePreviewBannerProps) {
  return (
    <aside className="sticky top-0 z-50 border-b border-[#b7c8df] bg-[#eef5ff] px-4 py-3 text-[#10223f] shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 text-sm">
        <strong>Preview Mode — read-only</strong>
        <span>
          You are viewing {workspaceLabel}. Submissions, approvals, messages,
          check-ins, point changes, and integrations are disabled.
        </span>
      </div>
    </aside>
  );
}
