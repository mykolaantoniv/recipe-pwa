import { Minus, Plus } from "lucide-react";

interface PortionStepperProps {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

const PortionStepper = ({ value, onChange, min = 1, max = 20 }: PortionStepperProps) => {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">Вкажіть кількість осіб</p>
      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-foreground disabled:opacity-30 active:scale-95 transition-all"
        >
          <Minus className="w-5 h-5" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value);
            if (!isNaN(n) && n >= min && n <= max) onChange(n);
          }}
          className="w-16 h-12 text-center bg-secondary text-foreground text-xl font-extrabold rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-foreground disabled:opacity-30 active:scale-95 transition-all"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PortionStepper;
