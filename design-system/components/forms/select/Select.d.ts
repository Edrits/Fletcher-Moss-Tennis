export interface SelectProps {
  label?: string;
  options: {value:string;label:string}[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}
