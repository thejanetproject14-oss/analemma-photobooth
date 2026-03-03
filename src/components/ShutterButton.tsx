interface ShutterButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const ShutterButton = ({ onClick, disabled }: ShutterButtonProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-[72px] h-[72px] rounded-full bg-primary-foreground border-[4px] border-primary shadow-elevated flex items-center justify-center transition-transform active:scale-90 disabled:opacity-50"
      aria-label="Take photo"
    >
      <div className="w-[56px] h-[56px] rounded-full bg-primary/90 transition-colors hover:bg-primary" />
    </button>
  );
};

export default ShutterButton;
