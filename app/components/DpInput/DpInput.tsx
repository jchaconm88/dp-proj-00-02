import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Dropdown } from "primereact/dropdown";
import { Checkbox } from "primereact/checkbox";
import type { DropdownChangeEvent } from "primereact/dropdown";
import type { ChangeEvent } from "react";

const labelClass = "font-medium text-zinc-700 dark:text-zinc-300";
const controlClass = "w-full";

export type DpInputType =
  | "input"
  | "input-decimal"
  | "number"
  | "select"
  | "check"
  | "textarea";

export interface DpInputOption {
  label: string;
  value: string | number;
}

export interface DpInputPropsBase {
  label: string;
  name?: string;
  className?: string;
  disabled?: boolean;
}

export interface DpInputInputProps extends DpInputPropsBase {
  type: "input" | "number" | "textarea";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputType?: "text" | "password";
  rows?: number;
}

export interface DpInputInputDecimalProps extends DpInputPropsBase {
  type: "input-decimal";
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface DpInputSelectProps extends DpInputPropsBase {
  type: "select";
  value: string | number;
  onChange: (value: string | number) => void;
  options: DpInputOption[] | Record<string, unknown>[];
  optionLabel?: string;
  optionValue?: string;
  placeholder?: string;
  filter?: boolean;
}

export interface DpInputCheckProps extends DpInputPropsBase {
  type: "check";
  value: boolean;
  onChange: (value: boolean) => void;
}

export type DpInputProps =
  | DpInputInputProps
  | DpInputInputDecimalProps
  | DpInputSelectProps
  | DpInputCheckProps;

function getInputId(name: string | undefined, label: string): string {
  return name ?? label.replace(/\s+/g, "-").toLowerCase();
}

export default function DpInput(props: DpInputProps) {
  const { label, name, className = "", disabled } = props;
  const id = getInputId(name, label);
  const wrapperClass =
    props.type === "check" ? "flex items-center gap-2" : "flex flex-col gap-2";

  if (props.type === "select") {
    const {
      value,
      onChange,
      options,
      optionLabel = "label",
      optionValue = "value",
      placeholder,
      filter,
    } = props;
    return (
      <div className={`${wrapperClass} ${className}`.trim()}>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <Dropdown
          id={id}
          value={value}
          options={options}
          optionLabel={optionLabel}
          optionValue={optionValue}
          onChange={(e: DropdownChangeEvent) => onChange(e.value ?? "")}
          placeholder={placeholder}
          filter={filter}
          disabled={disabled}
          className={controlClass}
        />
      </div>
    );
  }

  if (props.type === "check") {
    const { value, onChange } = props;
    return (
      <div className={`${wrapperClass} ${className}`.trim()}>
        <Checkbox
          inputId={id}
          checked={value}
          onChange={(e) => onChange(e.checked ?? false)}
          disabled={disabled}
        />
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
      </div>
    );
  }

  if (props.type === "input-decimal") {
    const { value, onChange, placeholder } = props;
    return (
      <div className={`${wrapperClass} ${className}`.trim()}>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <InputText
          id={id}
          value={value}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          disabled={disabled}
          className={controlClass}
        />
      </div>
    );
  }

  // input | number | textarea
  const { value, onChange, placeholder, inputType = "text", rows } = props;
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChange(e.target.value);

  if (props.type === "textarea") {
    return (
      <div className={`${wrapperClass} ${className}`.trim()}>
        <label htmlFor={id} className={labelClass}>
          {label}
        </label>
        <InputTextarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          className={controlClass}
          rows={rows ?? 3}
        />
      </div>
    );
  }

  const inputTypeMap: Record<string, string> = {
    input: inputType,
    number: "number",
  };

  return (
    <div className={`${wrapperClass} ${className}`.trim()}>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <InputText
        id={id}
        value={value}
        onChange={handleChange}
        type={inputTypeMap[props.type] ?? "text"}
        placeholder={placeholder}
        disabled={disabled}
        className={controlClass}
      />
    </div>
  );
}
