
import { Code, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const languageOptions = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' }
];

interface LanguageSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const LanguageSelect = ({ value, onValueChange }: LanguageSelectProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-icon-light-gray">Programming Language</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="icon-input flex items-center">
          <Code size={16} className="mr-2 text-icon-accent" />
          <SelectValue placeholder="Select language" />
          <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
        </SelectTrigger>
        <SelectContent className="bg-icon-dark-gray border-icon-gray">
          {languageOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
