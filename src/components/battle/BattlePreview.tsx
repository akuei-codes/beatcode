
import { difficultyOptions } from './DifficultySelect';
import { durationOptions } from './DurationSelect';
import { languageOptions } from './LanguageSelect';

interface BattlePreviewProps {
  language: string;
  difficulty: string;
  duration: string;
  battleType?: 'Rated' | 'Casual';
}

export const BattlePreview = ({ language, difficulty, duration, battleType = 'Rated' }: BattlePreviewProps) => {
  if (!difficulty) {
    return null;
  }
  
  return (
    <div className="mt-8 bg-icon-dark-gray border border-icon-gray rounded-lg p-5 animate-fade-in">
      <h3 className="text-lg font-medium mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-icon-accent"></span>
        Battle Preview
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-icon-gray/50 p-3 rounded">
          <p className="text-icon-light-gray mb-1">Language</p>
          <p className="font-medium">{languageOptions.find(l => l.value === language)?.label || 'Not selected'}</p>
        </div>
        <div className="bg-icon-gray/50 p-3 rounded">
          <p className="text-icon-light-gray mb-1">Difficulty</p>
          <p className="font-medium flex items-center">
            {difficultyOptions.find(d => d.value === difficulty)?.label || 'Not selected'}
            {difficulty && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-icon-accent/20 text-icon-accent">
                {difficultyOptions.find(d => d.value === difficulty)?.points} points
              </span>
            )}
          </p>
        </div>
        <div className="bg-icon-gray/50 p-3 rounded">
          <p className="text-icon-light-gray mb-1">Duration</p>
          <p className="font-medium">{durationOptions.find(d => d.value === duration)?.label || 'Not selected'}</p>
        </div>
        <div className="bg-icon-gray/50 p-3 rounded">
          <p className="text-icon-light-gray mb-1">Type</p>
          <p className="font-medium">{battleType}</p>
        </div>
      </div>
    </div>
  );
};
