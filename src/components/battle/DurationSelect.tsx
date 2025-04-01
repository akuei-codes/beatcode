
import { Timer, ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const durationOptions = [
  { value: '5', label: '5 minutes' },
  { value: '10', label: '10 minutes' },
  { value: '15', label: '15 minutes' },
  { value: '30', label: '30 minutes' },
  { value: '60', label: '60 minutes' }
];

interface DurationSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const DurationSelect = ({ value, onValueChange }: DurationSelectProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-icon-light-gray">Battle Duration</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="icon-input flex items-center">
          <Timer size={16} className="mr-2 text-icon-accent" />
          <SelectValue placeholder="Select time limit" />
          <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
        </SelectTrigger>
        <SelectContent className="bg-icon-dark-gray border-icon-gray">
          {durationOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
