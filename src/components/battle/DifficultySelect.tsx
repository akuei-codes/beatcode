
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export const difficultyOptions = [
  { value: 'Easy', label: 'Easy', points: 10 },
  { value: 'Medium', label: 'Medium', points: 25 },
  { value: 'Hard', label: 'Hard', points: 50 }
];

interface DifficultySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const DifficultySelect = ({ value, onValueChange }: DifficultySelectProps) => {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm text-icon-light-gray">Difficulty Level</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="icon-input flex items-center">
          <SelectValue placeholder="Select difficulty" />
          <ChevronDown size={16} className="ml-auto text-icon-light-gray" />
        </SelectTrigger>
        <SelectContent className="bg-icon-dark-gray border-icon-gray">
          {difficultyOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} className="focus:bg-icon-gray">
              <div className="flex items-center justify-between w-full">
                <span>{option.label}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-icon-accent/20 text-icon-accent">
                  {option.points} points
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
