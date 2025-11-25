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
      label: 'Close CRM',
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
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <button
                onClick={() => canNavigateToStep(step.number) && onStepClick?.(step.number)}
                disabled={!canNavigateToStep(step.number)}
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                  transition-all duration-200
                  ${
                    step.number === currentStep
                      ? 'bg-primary-600 text-white ring-4 ring-primary-200'
                      : step.completed
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }
                  ${
                    canNavigateToStep(step.number)
                      ? 'cursor-pointer hover:scale-110'
                      : 'cursor-not-allowed opacity-50'
                  }
                `}
              >
                {step.completed && step.number !== currentStep ? (
                  <svg
                    className="w-6 h-6"
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
                className={`mt-2 text-xs font-medium ${
                  step.number === currentStep
                    ? 'text-primary-600'
                    : step.completed
                    ? 'text-green-600'
                    : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step.completed ? 'bg-green-500' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

