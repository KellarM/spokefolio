import * as React from "react"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useStudioLanguage } from "@/lib/StudioLanguage"

// Any filled field clears with one click: an X sits at the right edge of the
// input whenever it holds text. It appears only on controlled text fields -
// password and file inputs never show it, and an input without an onChange
// has no way to accept the clear, so it stays as it was.
const Input = React.forwardRef(({ className, type, ...props }, forwardedRef) => {
  const { t } = useStudioLanguage();
  const innerRef = React.useRef(null);
  const ref = React.useCallback((node) => {
    innerRef.current = node;
    if (typeof forwardedRef === "function") forwardedRef(node);
    else if (forwardedRef) forwardedRef.current = node;
  }, [forwardedRef]);

  const canClear =
    typeof props.value === "string" &&
    props.value.length > 0 &&
    typeof props.onChange === "function" &&
    type !== "password" &&
    type !== "file" &&
    !props.readOnly &&
    !props.disabled;

  const clear = () => {
    props.onChange({ target: { value: "" }, preventDefault() {}, stopPropagation() {} });
    if (innerRef.current) innerRef.current.focus();
  };

  return (
    <span className="relative block">
      <input
        type={type}
        className={cn(
          "sf-field flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          canClear && "pr-8",
          className
        )}
        ref={ref}
        {...props}
      />
      {canClear && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={t("common.clearField")}
          onClick={clear}
          className="absolute right-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
})
Input.displayName = "Input"

export { Input }
