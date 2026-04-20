interface SectionHeaderProps {
  title: string;
  action?: { label: string; onClick?: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {action && (
        <button
          onClick={action.onClick}
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}