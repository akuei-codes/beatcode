
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface BattleTypeSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export const BattleTypeSwitch = ({ checked, onCheckedChange }: BattleTypeSwitchProps) => {
  return (
    <div className="flex items-center justify-between pt-2 border-t border-icon-gray/30">
      <div className="space-y-0.5">
        <Label className="text-sm text-icon-white">Rated Battle</Label>
        <p className="text-xs text-icon-light-gray">
          Affects player ratings when completed
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        className="data-[state=checked]:bg-icon-accent"
      />
    </div>
  );
};
