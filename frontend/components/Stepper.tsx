'use client';

interface StepperProps {
  currentStep: number;
  calendlyConnected: boolean;
  closeConnected: boolean;
  stripeConnected: boolean;
  onStepClick?: (step: number) => void;
}

export default function Stepper({
  currentStep,
  calendlyConnected,
  closeConnected,
  stripeConnected,
  onStepClick,
}: StepperProps) {
  const steps = [
    { number: 1, label: 'Introduction', completed: currentStep > 1 },
    {
      number: 2,
      label: 'Calendly',
      completed: calendlyConnected || currentStep > 2,
    },
    {
      number: 3,
      label: 'CRM',
      completed: closeConnected || currentStep > 3,
    },
    {
      number: 4,
      label: 'Stripe',
      completed: stripeConnected,
    },
  ];

  const canNavigateToStep = (step: number) => {
    if (step === 1) return true;
    if (step === 2) return currentStep >= 2 || calendlyConnected;
    if (step === 3) return currentStep >= 3 || (calendlyConnected && closeConnected);
    if (step === 4) return currentStep >= 4 || (calendlyConnected && closeConnected && stripeConnected);
    return false;
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      <div className="flex items-center justify-between relative">
        {/* Progress Bar Background */}
        <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-800 -z-10" />

        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.number === currentStep;
          const isAccessible = canNavigateToStep(step.number);

          return (
            <div key={step.number} className="flex flex-col items-center relative z-10">
              <button
                onClick={() => isAccessible && onStepClick?.(step.number)}
                disabled={!isAccessible}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
                  transition-all duration-300 border-2
                  ${isCurrent
                    ? 'bg-primary-500 border-primary-500 text-white shadow-[0_0_20px_rgba(14,165,233,0.5)] scale-110'
                    : isCompleted
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-500'
                  }
                  ${isAccessible
                    ? 'cursor-pointer hover:border-primary-400'
                    : 'cursor-not-allowed opacity-50'
                  }
                `}
              >
                {isCompleted && !isCurrent ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </button>
              <span
                className={`mt-3 text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${isCurrent
                    ? 'text-primary-400'
                    : isCompleted
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                  }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

