import { Search, X } from "lucide-react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className: string;
  inputClassName: string;
  iconSize?: number;
  iconStrokeWidth?: number;
  clearLabel?: string;
  onClear?: () => void;
}

export function SearchField({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className,
  inputClassName,
  iconSize = 16,
  iconStrokeWidth,
  clearLabel,
  onClear,
}: SearchFieldProps) {
  return (
    <label className={className}>
      <Search aria-hidden="true" size={iconSize} strokeWidth={iconStrokeWidth} />
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={inputClassName}
      />
      {onClear && clearLabel && value && (
        <button
          type="button"
          className="grid h-[25px] w-[25px] flex-none cursor-pointer place-items-center rounded-[7px] border-0 bg-transparent text-[#8296a6] hover:bg-[#edf4f9] hover:text-[#527087]"
          aria-label={clearLabel}
          onClick={onClear}
        >
          <X aria-hidden="true" size={15} strokeWidth={1.8} />
        </button>
      )}
    </label>
  );
}
